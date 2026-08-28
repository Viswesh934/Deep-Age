import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Bug, ArrowRight, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const ExplorePage: React.FC = () => {
  const { activeRun, startTestDrive, isLoading } = useTestDriveContext();
  const navigate = useNavigate();

  if (!activeRun) {
    return (
      <Card className="p-10 text-center space-y-3 border-dashed border-border/80 font-sans shadow-xs rounded-2xl">
        <div className="w-10 h-10 rounded-2xl bg-secondary text-primary mx-auto flex items-center justify-center">
          <Bot className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-sm font-bold text-foreground">No Active Session</h3>
          <p className="text-xs text-muted-foreground">
            Enter a URL and task in the bar above or trigger a demo run.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => startTestDrive(undefined, undefined, 'explore')}
          disabled={isLoading}
          className="gap-2 font-semibold text-xs rounded-full px-5 h-8"
        >
          <Play className="w-3 h-3 fill-current" />
          Run Test-Drive
        </Button>
      </Card>
    );
  }

  const isCompleted = activeRun.summary.taskStatus === 'completed';

  return (
    <div className="flex flex-col gap-4 font-sans animate-fade-in">
      {/* High-Impact Main View: Live Viewport + Immediate Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Real Browser Viewport (Headless Chromium Live Capture) */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
          {/* Simulated Browser Chrome Top Bar */}
          <div className="px-3.5 py-2.5 bg-secondary/60 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-0.5 bg-background/80 rounded-full border border-border/60 text-[11px] font-mono text-muted-foreground max-w-xs truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5ae561]"></span>
              <span className="truncate">{activeRun.url}</span>
            </div>

            <Badge variant="outline" className="text-[10px] rounded-full font-mono">
              Chromium Live
            </Badge>
          </div>

          <div className="p-3 bg-secondary/20 flex items-center justify-center min-h-[380px]">
            {activeRun.screenshot ? (
              <img
                src={`data:image/jpeg;base64,${activeRun.screenshot}`}
                alt="Headless browser capture"
                className="w-full h-auto max-h-[460px] object-contain rounded-xl border border-border/70 shadow-xs"
              />
            ) : (
              <p className="text-xs text-muted-foreground font-medium">Capture unavailable.</p>
            )}
          </div>
        </div>

        {/* Right: Direct Diagnostics & Action Engine */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Status Verdict Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
              isCompleted
                ? 'bg-[#5ae561]/10 border-[#5ae561]/30 text-foreground'
                : 'bg-[#ff8527]/10 border-[#ff8527]/30 text-foreground'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-[#5ae561] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#ff8527] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono uppercase tracking-wider">
                  {isCompleted ? 'Task Completed' : 'Friction Detected'}
                </span>
                <Badge
                  variant={isCompleted ? 'success' : 'warning'}
                  className="text-[10px] font-mono rounded-full uppercase"
                >
                  {isCompleted ? 'PASS' : `${activeRun.frictions.length} Friction`}
                </Badge>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                {activeRun.plainExplanation.exploreSummary}
              </p>
            </div>
          </div>

          {/* Key Facts / Execution HUD */}
          <Card className="p-4 border-border/80 shadow-xs rounded-2xl space-y-3 font-mono text-xs">
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground text-[11px]">Task:</span>
                <span className="font-sans font-medium text-foreground text-right truncate max-w-[200px]">
                  {activeRun.task}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground text-[11px]">Target URL:</span>
                <span className="text-foreground truncate max-w-[200px]">{activeRun.url}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground text-[11px]">Discovered Tools:</span>
                <span className="font-bold text-foreground">
                  {activeRun.tools.length > 0 ? (
                    <span className="text-[#5ae561]">
                      {activeRun.tools.length} WebMCP ({activeRun.tools.map((t) => t.name).join(', ')})
                    </span>
                  ) : (
                    <span className="text-[#ff8527]">0 tools registered</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground text-[11px]">Execution Latency:</span>
                <span className="text-foreground">{activeRun.summary.durationMs || 0}ms</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-[11px]">Network Calls:</span>
                <span className="text-foreground">{activeRun.network.length} intercepted</span>
              </div>
            </div>

            {/* Direct Action: Jump to Debugger */}
            <div className="pt-2">
              <Button
                onClick={() => navigate('/debug')}
                className="w-full gap-2 text-xs font-semibold h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Bug className="w-3.5 h-3.5" />
                Open Developer Debugger & Code Fixes
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
