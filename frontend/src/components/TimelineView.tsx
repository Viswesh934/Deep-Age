import { TimelineStep } from '@deep-age/shared';
import { Play, Compass, Cpu, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface TimelineViewProps {
  timeline: TimelineStep[];
}

export function TimelineView({ timeline }: TimelineViewProps) {
  if (!timeline || timeline.length === 0) {
    return <p className="text-xs font-mono text-zinc-500">Timeline data initializing...</p>;
  }

  const getPhaseIcon = (phase: string, status: string) => {
    if (status === 'error') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    if (status === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    if (phase === 'spawn') return <Play className="w-3.5 h-3.5 text-zinc-300" />;
    if (phase === 'navigation') return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
    if (phase === 'discovery') return <Cpu className="w-3.5 h-3.5 text-indigo-400" />;
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-4 font-mono shadow-2xl">
      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>AGENT_EXECUTION_TIMELINE ({timeline.length} PHASES)</span>
        <span className="text-[10px] text-zinc-600">CHRONOLOGICAL_TRACE</span>
      </div>

      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
        {timeline.map((step, idx) => (
          <div key={step.id || idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-black border border-zinc-700 flex items-center justify-center">
              {getPhaseIcon(step.phase, step.status)}
            </div>

            <div className="bg-black border border-zinc-800/90 p-2.5 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${
                  step.status === 'error'
                    ? 'text-red-400'
                    : step.status === 'warning'
                    ? 'text-amber-400'
                    : 'text-zinc-200'
                }`}>
                  {step.label}
                </span>
                {step.durationMs !== undefined && (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {step.durationMs}ms
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-1 leading-relaxed">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
