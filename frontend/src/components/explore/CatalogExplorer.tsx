import React, { useState, useEffect } from 'react';
import { Database, Download, FileJson, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ExploreCatalogEntity } from '@/types';
import { env } from '@/config/env';

interface CatalogExplorerProps {
  siteUrl: string;
}

export const CatalogExplorer: React.FC<CatalogExplorerProps> = ({ siteUrl }) => {
  const [catalog, setCatalog] = useState<ExploreCatalogEntity[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetch(`${env.backendUrl}/api/explore/snapshot?url=${encodeURIComponent(siteUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.snapshot?.catalog) {
          setCatalog(data.snapshot.catalog);
        }
      })
      .catch((err) => console.error('Failed to fetch explore catalog:', err));
  }, [siteUrl]);

  const filtered = catalog.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.summary.toLowerCase().includes(search.toLowerCase()) ||
    item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Card className="bg-card border-border/80 rounded-2xl shadow-xs">
      <CardHeader className="px-4 py-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#ff8527]" />
          <span>Portable Knowledge & Catalog</span>
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <a
            href={`${env.backendUrl}/api/explore/snapshot/sqlite?url=${encodeURIComponent(siteUrl)}`}
            download="site_explore.sql"
          >
            <Button size="sm" variant="outline" className="text-[11px] font-semibold h-7 rounded-full gap-1 border-border/80 hover:bg-secondary">
              <Download className="w-3 h-3" />
              <span>SQLite</span>
            </Button>
          </a>
          <a
            href={`/api/explore/snapshot/manifest?url=${encodeURIComponent(siteUrl)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button size="sm" variant="outline" className="text-[11px] font-semibold h-7 rounded-full gap-1 border-border/80 hover:bg-secondary">
              <FileJson className="w-3 h-3" />
              <span>Manifest</span>
            </Button>
          </a>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 font-sans text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter entities, specs, tags (e.g. 16GB, laptop)..."
            className="pl-8 bg-secondary/30 border-border/70 text-xs text-foreground placeholder:text-muted-foreground rounded-full h-8"
          />
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-secondary/20 border border-border/60 text-xs flex items-center justify-between"
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className="font-semibold text-foreground truncate">{item.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{item.summary}</div>
                <div className="flex gap-1 mt-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[9px] font-mono bg-secondary text-muted-foreground px-1.5 py-0.2 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {item.priceCents && (
                <div className="text-right shrink-0">
                  <div className="font-mono text-foreground font-semibold text-xs">
                    ₹{(item.priceCents / 100).toLocaleString('en-IN')}
                  </div>
                  {item.actionTool && (
                    <code className="text-[10px] text-[#ff8527] block font-mono">{item.actionTool}()</code>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
