import React, { useState } from 'react';
import { TestDriveRun } from '@deep-age/shared';
import {
  Globe,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface NetworkWaterfallProps {
  run: TestDriveRun;
}

export const NetworkWaterfall: React.FC<NetworkWaterfallProps> = ({ run }) => {
  const [filterOrigin, setFilterOrigin] = useState<'all' | 'first-party' | 'third-party'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRequests = run.network.filter((item) => {
    if (filterOrigin !== 'all' && item.origin !== filterOrigin) return false;
    if (searchQuery.trim()) {
      return (
        item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.status).includes(searchQuery)
      );
    }
    return true;
  });

  const maxDuration = Math.max(...run.network.map((n) => n.durationMs || 100), 100);

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in">
      {/* Network Header with Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 md:p-5 rounded-2xl border border-border/80 shadow-2xs backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-glow-cyan">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground font-tech flex items-center gap-2">
              <span>Network Traffic & Waterfall</span>
              <Badge variant="outline" className="font-mono text-[10px] text-cyan-500 border-cyan-500/30 rounded-md">
                {run.network.length} Captured Requests
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">
              Real-time HAR network stream captured directly via Chrome DevTools Protocol (CDP).
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter URL, method..."
              className="pl-9 h-9 text-xs font-mono bg-background/90 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1 bg-background/90 p-1 rounded-xl border border-border/80 text-xs shadow-inner-glow font-tech">
            <button
              type="button"
              onClick={() => setFilterOrigin('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterOrigin === 'all' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterOrigin('first-party')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterOrigin === 'first-party' ? 'bg-indigo-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              1st-Party
            </button>
            <button
              type="button"
              onClick={() => setFilterOrigin('third-party')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterOrigin === 'third-party' ? 'bg-amber-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              3rd-Party
            </button>
          </div>
        </div>
      </div>

      {/* Network Table */}
      <Card className="border-border/80 bg-card/95 overflow-hidden shadow-card-dark rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-tech text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5 w-20">Method</th>
                <th className="p-3.5 w-20">Status</th>
                <th className="p-3.5">Target Resource URL</th>
                <th className="p-3.5 w-28">Origin</th>
                <th className="p-3.5 w-48 text-right">Latency Waterfall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground text-xs font-sans">
                    No network events found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req, idx) => {
                  const isExpanded = expandedId === req.id;
                  const isThirdParty = req.origin === 'third-party';
                  const widthPercent = Math.max(8, Math.min(100, (req.durationMs / maxDuration) * 100));

                  return (
                    <React.Fragment key={req.id || idx}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-muted/40' : ''
                        }`}
                      >
                        <td className="p-3.5 text-center text-muted-foreground text-[11px]">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 inline text-primary" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 inline text-muted-foreground" />
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                              req.method === 'POST'
                                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                                : req.method === 'GET'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {req.method}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold">
                          <span
                            className={`${
                              req.status >= 200 && req.status < 300
                                ? 'text-emerald-500'
                                : req.status >= 400
                                ? 'text-rose-500'
                                : 'text-amber-500'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-md truncate text-foreground font-mono text-xs font-semibold">
                          {req.url}
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={isThirdParty ? 'warning' : 'outline'}
                            className="text-[9px] uppercase font-mono font-bold rounded-md"
                          >
                            {req.origin}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <span className="text-[11px] text-muted-foreground font-mono">{req.durationMs}ms</span>
                            <div className="w-24 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  req.durationMs < 100
                                    ? 'bg-emerald-500'
                                    : req.durationMs < 500
                                    ? 'bg-indigo-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${widthPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Payload & Headers Drawer */}
                      {isExpanded && (
                        <tr className="bg-zinc-950/40">
                          <td colSpan={6} className="p-5 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Request Headers / Body */}
                              <div className="p-4 rounded-xl bg-background/90 border border-border/80 space-y-1.5 shadow-2xs">
                                <span className="font-bold text-foreground font-tech text-xs block">Request Payload / Params</span>
                                <pre className="p-3.5 bg-zinc-950 text-indigo-300 rounded-xl text-[11px] font-mono overflow-x-auto border border-zinc-800 max-h-48 shadow-inner leading-relaxed">
                                  {JSON.stringify(req.queryParams || req.requestBody || req.requestHeaders || {}, null, 2)}
                                </pre>
                              </div>

                              {/* Response Headers / Body */}
                              <div className="p-4 rounded-xl bg-background/90 border border-border/80 space-y-1.5 shadow-2xs">
                                <span className="font-bold text-foreground font-tech text-xs block">Response Body</span>
                                <pre className="p-3.5 bg-zinc-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto border border-zinc-800 max-h-48 shadow-inner leading-relaxed">
                                  {JSON.stringify(req.responseBody || req.responseHeaders || {}, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default NetworkWaterfall;

