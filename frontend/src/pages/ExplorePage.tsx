import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Bug,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Check,
  XCircle,
  Sparkles
} from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StateGraphViewer } from '@/components/explore/StateGraphViewer';
import { IntentPlanner } from '@/components/explore/IntentPlanner';
import { CatalogExplorer } from '@/components/explore/CatalogExplorer';

export const ExplorePage: React.FC = () => {
  const { activeRun, startTestDrive, isLoading } = useTestDriveContext();
  const navigate = useNavigate();

  if (!activeRun) {
    return (
      <Card className="p-10 text-center space-y-4 border-dashed border-border/80 bg-card shadow-xs rounded-3xl font-sans">
        <div className="w-12 h-12 rounded-2xl bg-secondary text-primary mx-auto flex items-center justify-center shadow-xs">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-bold text-foreground">Explore AI Agent Reality</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Test-drive any website to see exactly how autonomous AI agents experience your pages, reason through tasks, and complete actions in real-time.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => startTestDrive(undefined, undefined, 'explore')}
          disabled={isLoading}
          className="gap-2 font-semibold text-xs rounded-full px-6 h-9"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Initial Test-Drive</span>
        </Button>
      </Card>
    );
  }

  const isCompleted = activeRun.summary.taskStatus === 'completed';

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in text-foreground pb-12">
      {/* 1. Top 3 Minimal Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Metric 1: Outcome */}
        <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Task Outcome
            </span>
            <div className="text-base font-bold text-foreground flex items-center gap-2">
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#5ae561]" />
                  <span>Success (0 Friction)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#ff8527]" />
                  <span>Friction Blocked</span>
                </>
              )}
            </div>
          </div>
          <Badge
            variant={isCompleted ? 'success' : 'warning'}
            className="text-[10px] font-mono font-bold uppercase rounded-full px-2.5 py-0.5"
          >
            {isCompleted ? 'OK' : `${activeRun.frictions.length} Friction`}
          </Badge>
        </Card>

        {/* Metric 2: Execution Time */}
        <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Execution Time
            </span>
            <div className="text-base font-bold text-foreground font-mono">
              {activeRun.summary.durationMs || 0} ms
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground rounded-full">
            CDP Stream
          </Badge>
        </Card>

        {/* Metric 3: WebMCP Tools */}
        <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              WebMCP Tools
            </span>
            <div className="text-base font-bold text-foreground">
              {activeRun.tools.length} <span className="text-xs font-normal text-muted-foreground">Discovered</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground rounded-full">
            modelContext
          </Badge>
        </Card>
      </div>

      {/* 2. Main Viewport & Execution Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left (7 Cols): Headless Chromium Viewport */}
        <Card className="lg:col-span-7 overflow-hidden flex flex-col border-border/80 shadow-xs bg-card rounded-2xl">
          <CardHeader className="px-3.5 py-2.5 bg-secondary/60 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0 mr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-0.5 bg-background/80 rounded-full border border-border/60 text-[11px] font-mono text-muted-foreground max-w-xs truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5ae561]"></span>
                <span className="truncate">{activeRun.url}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/80 rounded-full">
              Chromium Live
            </Badge>
          </CardHeader>

          <CardContent className="p-3 flex-1 flex flex-col items-center justify-center bg-secondary/20 min-h-[360px]">
            {activeRun.screenshot ? (
              <img
                src={`data:image/jpeg;base64,${activeRun.screenshot}`}
                alt="Headless browser capture"
                className="w-full h-auto max-h-[440px] object-contain rounded-xl border border-border/70 shadow-xs"
              />
            ) : (
              <p className="text-xs text-muted-foreground font-mono">
                Capture unavailable.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right (5 Cols): Diagnostics HUD & Action Log */}
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

          {/* Action Log Card */}
          <Card className="p-4 border-border/80 shadow-xs rounded-2xl space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Agent Action Log
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {activeRun.timeline?.length || 0} milestones
              </span>
            </div>

            {activeRun.timeline && activeRun.timeline.length > 0 && (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {activeRun.timeline.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-2.5 text-xs"
                  >
                    <div className="mt-0.5 shrink-0">
                      {step.status === 'success' ? (
                        <div className="w-4 h-4 rounded-full bg-[#5ae561]/20 text-[#36533f] dark:text-[#74b684] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : step.status === 'warning' ? (
                        <div className="w-4 h-4 rounded-full bg-[#ff8527]/20 text-[#ff8527] flex items-center justify-center">
                          <AlertTriangle className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                          <XCircle className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-foreground text-xs truncate">{step.label}</span>
                        {step.durationMs && (
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">+{step.durationMs}ms</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Direct Action: Jump to Debugger */}
            <div className="pt-2">
              <Button
                onClick={() => navigate('/debug')}
                className="w-full gap-2 text-xs font-semibold h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Open Developer Debugger & Code Fixes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Deep Explore Layer (State Machine, Intent Resolver & Catalog) */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ff8527]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Site Exploration & Capability Surface
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <IntentPlanner siteUrl={activeRun.url} />
          <CatalogExplorer siteUrl={activeRun.url} />
        </div>

        <StateGraphViewer graph={activeRun.stateGraph} />
      </div>
    </div>
  );
};

export default ExplorePage;
