import React from 'react';
import { TimelineStep } from '@/types';
import {
  Compass,
  Search,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ExecutionTimelineProps {
  timeline: TimelineStep[];
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <Card className="border-border/80 bg-card p-6 text-center text-xs text-muted-foreground rounded-2xl">
        No execution timeline recorded.
      </Card>
    );
  }

  const getStepIcon = (phase: string) => {
    switch (phase) {
      case 'spawn':
      case 'navigation':
        return <Compass className="w-3.5 h-3.5 text-sky-400" />;
      case 'discovery':
        return <Search className="w-3.5 h-3.5 text-indigo-400" />;
      case 'reasoning':
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'execution':
        return <Zap className="w-3.5 h-3.5 text-[#ff8527]" />;
      case 'diagnosis':
        return <Activity className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusNodeColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'border-[#5ae561] bg-[#5ae561]/20 text-[#5ae561] shadow-[0_0_12px_rgba(90,229,97,0.3)]';
      case 'warning':
        return 'border-[#ff8527] bg-[#ff8527]/20 text-[#ff8527] shadow-[0_0_12px_rgba(255,133,39,0.3)]';
      case 'error':
        return 'border-destructive bg-destructive/20 text-destructive shadow-[0_0_12px_rgba(239,68,68,0.3)]';
      default:
        return 'border-primary/60 bg-primary/20 text-primary';
    }
  };

  return (
    <Card className="border-border/80 bg-card rounded-2xl shadow-xs overflow-hidden font-sans">
      <CardHeader className="p-4 bg-muted/20 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#ff8527]" />
          <div>
            <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-foreground">
              Sequential Execution Timeline Trace
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              Live step-by-step trace of browser sandbox spawn, DOM discovery, LLM pathfinding, and tool executions
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-muted-foreground rounded-full">
          {timeline.length} Steps
        </Badge>
      </CardHeader>

      <CardContent className="p-5 md:p-6 bg-background/50">
        <div className="relative pl-6 md:pl-8 space-y-6">
          {/* Continuous Vertical Timeline Line Spine */}
          <div className="absolute left-[19px] md:left-[27px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary via-[#ff8527] to-border/60"></div>

          {timeline.map((step, idx) => (
            <div key={step.id || idx} className="relative flex items-start gap-4 group">
                {/* Timeline Step Node Circle on the Spine */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${getStatusNodeColor(
                    step.status
                  )}`}
                >
                  {getStepIcon(step.phase)}
                </div>

                {/* Step Milestone Content Card */}
                <div className="flex-1 p-3.5 md:p-4 rounded-2xl bg-card/90 border border-border/80 shadow-2xs hover:border-border transition-colors space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-muted-foreground font-bold">
                        #{idx + 1}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase font-tech px-2 py-0 rounded-full border-border/80"
                      >
                        {step.phase}
                      </Badge>
                      <h4 className="font-bold text-foreground text-xs md:text-sm font-sans">
                        {step.label}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground shrink-0">
                      {step.durationMs && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary/80 border border-border/60 text-neutral-300">
                          {step.durationMs}ms
                        </span>
                      )}
                      <span>
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      {step.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-[#5ae561]" />}
                      {step.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-[#ff8527]" />}
                      {step.status === 'error' && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                    </div>
                  </div>

                  {/* Step Description Detail */}
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed pt-0.5">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionTimeline;
