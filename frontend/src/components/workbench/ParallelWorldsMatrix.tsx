import React from 'react';
import { TestDriveRun } from '@deep-age/shared';
import {
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Play,
  Split,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTestDriveContext } from '@/context/TestDriveContext';

interface ParallelWorldsMatrixProps {
  run: TestDriveRun;
}

export const ParallelWorldsMatrix: React.FC<ParallelWorldsMatrixProps> = ({ run }) => {
  const { runDemoScenario, isLoading } = useTestDriveContext();
  const isCurrentRunFixed = run.summary.frictionCount === 0 && run.summary.taskStatus === 'completed';

  return (
    <div className="flex flex-col gap-6 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 md:p-5 rounded-2xl border border-border/80 shadow-2xs backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-glow-emerald">
            <Split className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground font-tech flex items-center gap-2">
              <span>Parallel Worlds Evaluation Matrix</span>
              <Badge variant="outline" className="font-mono text-[10px] text-emerald-500 border-emerald-500/30 rounded-md">
                COMPARATIVE BENCHMARK
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">
              Side-by-side simulation proving how WebMCP transforms a broken agent journey into an instantaneous 0-friction flow.
            </p>
          </div>
        </div>

        {/* Quick Action Button to Toggle Demo State */}
        <Button
          size="sm"
          variant="glow"
          onClick={() => runDemoScenario(!isCurrentRunFixed)}
          disabled={isLoading}
          className="gap-2 text-xs font-bold h-9 px-4 font-tech shadow-glow-primary rounded-xl cursor-pointer"
        >
          {isLoading ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating Alternative...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Switch to {isCurrentRunFixed ? 'Friction Baseline' : 'WebMCP Fixed'} World</span>
            </>
          )}
        </Button>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* World 1: Baseline Site (Without WebMCP Tool) */}
        <Card className={`border-border/80 overflow-hidden transition-all duration-200 shadow-card-dark rounded-2xl ${
          !isCurrentRunFixed
            ? 'ring-2 ring-amber-500/50 bg-amber-500/5 border-amber-500/40'
            : 'bg-card/90 opacity-75'
        }`}>
          <CardHeader className="p-5 border-b border-border/80 bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="warning" className="text-[10px] font-tech font-bold uppercase rounded-md px-2 py-0.5">
                World 1: Baseline Site (Broken)
              </Badge>
              {!isCurrentRunFixed && (
                <Badge variant="warning" className="text-[10px] font-tech font-bold rounded-md">
                  ● ACTIVE RUN
                </Badge>
              )}
            </div>
            <h4 className="text-sm font-extrabold text-foreground mt-2 font-tech">
              Missing WebMCP Tool (`add_to_cart`)
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-sans">
              Agent encounters raw visual buttons, but lacks a programmatic tool in <code className="font-mono text-primary font-semibold">document.modelContext</code>.
            </p>
          </CardHeader>

          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/90 border border-border/70 shadow-2xs font-mono">
                <span className="text-muted-foreground text-xs font-sans">Task Completion:</span>
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <AlertTriangle className="w-3.5 h-3.5" /> Blocked / Incomplete
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background/90 border border-border/70 shadow-2xs font-mono">
                <span className="text-muted-foreground text-xs font-sans">Agent Frictions:</span>
                <span className="font-bold text-rose-500">1 Critical Friction Detected</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background/90 border border-border/70 shadow-2xs font-mono">
                <span className="text-muted-foreground text-xs font-sans">Registered Tools:</span>
                <span className="text-muted-foreground font-semibold">3 Tools (search, filter, details)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed shadow-2xs font-sans">
              <strong>What happened:</strong> The agent attempted to guess DOM button selectors, but could not reliably execute the shopping cart action.
            </div>
          </CardContent>
        </Card>

        {/* World 2: Optimized Site (With WebMCP Tool) */}
        <Card className={`border-border/80 overflow-hidden transition-all duration-200 shadow-card-dark rounded-2xl ${
          isCurrentRunFixed
            ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5 border-emerald-500/40'
            : 'bg-card/90 opacity-75'
        }`}>
          <CardHeader className="p-5 border-b border-border/80 bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="success" className="text-[10px] font-tech font-bold uppercase rounded-md px-2 py-0.5">
                World 2: WebMCP Enabled (Perfect)
              </Badge>
              {isCurrentRunFixed && (
                <Badge variant="success" className="text-[10px] font-tech font-bold rounded-md">
                  ● ACTIVE RUN
                </Badge>
              )}
            </div>
            <h4 className="text-sm font-extrabold text-foreground mt-2 font-tech">
              Full WebMCP Schema Registered
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-sans">
              Website registered all 4 tools including <code className="font-mono text-emerald-500 font-semibold">add_to_cart</code> with typed JSON schema parameters.
            </p>
          </CardHeader>

          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/90 border border-border/70 shadow-2xs font-mono">
                <span className="text-muted-foreground text-xs font-sans">Task Completion:</span>
                <span className="flex items-center gap-1 font-bold text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Completed
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background/90 border border-border/70 shadow-2xs font-mono">
                <span className="text-muted-foreground text-xs font-sans">Agent Frictions:</span>
                <span className="font-bold text-emerald-500">0 Frictions (Clean)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background/90 border border-border/70 shadow-2xs font-mono">
                <span className="text-muted-foreground text-xs font-sans">Registered Tools:</span>
                <span className="text-emerald-500 font-bold">4 Tools (+add_to_cart)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed shadow-2xs font-sans">
              <strong>What happened:</strong> The agent discovered the tool immediately, passed parameters with zero ambiguity, and executed the action in 12ms!
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParallelWorldsMatrix;

