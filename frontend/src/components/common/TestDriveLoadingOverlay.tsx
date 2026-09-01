import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Globe, Bot, Cpu, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TestDriveLoadingOverlayProps {
  isLoading: boolean;
  targetUrl?: string;
  targetTask?: string;
}

const STEPS = [
  { label: 'Launching isolated Chromium browser...', icon: Globe },
  { label: 'Intercepting network, DOM tree, and interactive elements...', icon: Cpu },
  { label: 'Autonomous AI agent reasoning through task goals...', icon: Bot },
  { label: 'OpenRouter AI generating friction diagnosis & audit...', icon: Sparkles },
];

export const TestDriveLoadingOverlay: React.FC<TestDriveLoadingOverlayProps> = ({
  isLoading,
  targetUrl,
  targetTask,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStepIndex(0);
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(stepInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in p-4">
      <Card className="max-w-md w-full p-6 border-border/90 bg-card shadow-2xl rounded-3xl space-y-6 text-foreground font-sans relative overflow-hidden">
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff8527] via-primary to-[#5ae561] animate-pulse" />

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-foreground">Running Agent Test-Drive</h3>
            <p className="text-xs text-muted-foreground font-mono">
              Live Browser Emulation • {elapsedSeconds}s elapsed
            </p>
          </div>
        </div>

        {/* Target Info */}
        {(targetUrl || targetTask) && (
          <div className="p-3 rounded-2xl bg-secondary/30 border border-border/70 space-y-1.5 text-xs font-mono">
            {targetUrl && (
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground uppercase font-bold mr-1.5">Target:</span>
                <span className="text-foreground">{targetUrl}</span>
              </div>
            )}
            {targetTask && (
              <div className="truncate text-muted-foreground text-[11px] font-sans">
                <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold mr-1.5">Goal:</span>
                <span>{targetTask}</span>
              </div>
            )}
          </div>
        )}

        {/* Step Progression */}
        <div className="space-y-2.5">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-primary/10 border border-primary/30 text-foreground font-medium shadow-xs'
                    : isDone
                    ? 'text-muted-foreground opacity-80'
                    : 'text-muted-foreground/40 opacity-40'
                }`}
              >
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#5ae561]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs leading-tight">{step.label}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-center text-muted-foreground font-mono">
          Headless Chromium stream is active in the background.
        </p>
      </Card>
    </div>
  );
};
