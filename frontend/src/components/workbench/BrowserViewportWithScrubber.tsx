import React, { useState } from 'react';
import { TestDriveRun, TimelineStep } from '@deep-age/shared';
import {
  Maximize2,
  Minimize2,
  Clock,
  Compass,
  Search,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Activity,
  Layers,
  Eye,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BrowserViewportWithScrubberProps {
  run: TestDriveRun;
}

export const BrowserViewportWithScrubber: React.FC<BrowserViewportWithScrubberProps> = ({ run }) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(() =>
    run.timeline && run.timeline.length > 0 ? run.timeline.length - 1 : 0
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDomPins, setShowDomPins] = useState<boolean>(true);

  const activeStep: TimelineStep | undefined = run.timeline?.[selectedStepIndex];

  const getStepIcon = (phase: string) => {
    switch (phase) {
      case 'spawn':
      case 'navigation':
        return <Compass className="w-3.5 h-3.5" />;
      case 'discovery':
        return <Search className="w-3.5 h-3.5" />;
      case 'reasoning':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'execution':
        return <Zap className="w-3.5 h-3.5" />;
      case 'diagnosis':
        return <Activity className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="success" className="font-mono text-[10px] uppercase font-bold">
            <CheckCircle2 className="w-3 h-3 mr-0.5" /> OK
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" className="font-mono text-[10px] uppercase font-bold">
            <AlertTriangle className="w-3 h-3 mr-0.5" /> WARN
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="font-mono text-[10px] uppercase font-bold">
            <XCircle className="w-3 h-3 mr-0.5" /> ERR
          </Badge>
        );
      default:
        return (
          <Badge variant="info" className="font-mono text-[10px] uppercase font-bold">
            <Info className="w-3 h-3 mr-0.5" /> INFO
          </Badge>
        );
    }
  };

  return (
    <div className={`flex flex-col gap-5 font-sans ${isFullscreen ? 'fixed inset-0 z-50 bg-background/98 p-6 backdrop-blur-2xl overflow-y-auto' : ''}`}>
      {/* Viewport Card */}
      <Card className="border-border/80 bg-card/95 overflow-hidden shadow-card-dark rounded-2xl">
        {/* Browser Mock Chrome Bar */}
        <div className="bg-muted/40 border-b border-border/80 px-4 py-3 flex items-center justify-between gap-3">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-2xs"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-2xs"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-2xs"></div>
          </div>

          {/* Address bar */}
          <div className="flex-1 max-w-xl mx-auto flex items-center gap-2 bg-background/90 border border-border/70 rounded-xl px-3.5 py-1.5 text-xs font-mono text-muted-foreground truncate shadow-inner-glow">
            <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate text-foreground font-semibold">{run.url}</span>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowDomPins(!showDomPins)}
              className={`gap-1.5 font-tech rounded-lg text-xs ${showDomPins ? 'bg-primary/15 text-primary border-primary/40' : 'text-muted-foreground'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DOM Overlays</span>
            </Button>

            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-muted-foreground hover:text-foreground rounded-lg"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Viewport Screen Canvas */}
        <div className="relative bg-zinc-950 flex items-center justify-center min-h-[360px] max-h-[520px] overflow-hidden group">
          {run.screenshot ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={`data:image/jpeg;base64,${run.screenshot}`}
                alt="Headless Chromium Real Session"
                className="max-h-[480px] w-auto max-w-full object-contain rounded-xl border border-white/10 shadow-2xl"
              />

              {/* DOM Interactive Overlay Pins */}
              {showDomPins && run.domInteractions && run.domInteractions.length > 0 && (
                <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-end">
                  <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3.5 max-w-md pointer-events-auto shadow-2xl animate-fade-in space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-cyan-400 font-bold font-tech">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Intercepted DOM Button
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-cyan-500/30 text-cyan-300">
                        {run.domInteractions.length} selector{run.domInteractions.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-200 truncate bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/10">
                      {run.domInteractions[0]?.selector || 'button.add-to-cart'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground font-mono space-y-2">
              <Clock className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">Connecting to Chromium screencast stream...</p>
            </div>
          )}
        </div>

        {/* Playwright / Browserbase Time-Scrubber Filmstrip */}
        {run.timeline && run.timeline.length > 0 && (
          <div className="border-t border-border/80 bg-muted/20 p-4 md:p-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold font-tech text-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span className="uppercase tracking-tight text-xs">Execution Timeline Scrubber</span>
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground font-normal">
                  {run.timeline.length} Milestones
                </Badge>
              </div>

              {activeStep && (
                <div className="flex items-center gap-2 font-mono text-xs">
                  {getStatusBadge(activeStep.status)}
                  {activeStep.durationMs && (
                    <span className="text-muted-foreground text-[11px] bg-background px-2.5 py-0.5 rounded-lg border border-border/60">
                      +{activeStep.durationMs}ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Scrubber Nodes Strip */}
            <div className="relative flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
              {run.timeline.map((step, idx) => {
                const isSelected = selectedStepIndex === idx;
                return (
                  <button
                    key={step.id || idx}
                    type="button"
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#ff8527] text-white border-[#ff8527] shadow-sm font-bold scale-[1.02]'
                        : 'bg-card/90 text-muted-foreground hover:text-foreground border-border/80 hover:border-border'
                    }`}
                  >
                    {getStepIcon(step.phase)}
                    <span className="truncate max-w-[140px]">{step.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Milestone Inspector Drawer */}
            {activeStep && (
              <div className="bg-background/90 border border-border/80 rounded-2xl p-4 text-xs space-y-1.5 shadow-2xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="outline" className="uppercase font-tech text-[10px] tracking-wider text-primary border-primary/30 rounded-md">
                      {activeStep.phase}
                    </Badge>
                    <span className="font-tech font-bold text-foreground text-xs">{activeStep.label}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(activeStep.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs font-sans">{activeStep.detail}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default BrowserViewportWithScrubber;

