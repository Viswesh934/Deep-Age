import { TestDriveRun, UserMode } from '@deep-age/shared';
import { Clock, Activity, Cpu, CheckCircle2, AlertCircle, Eye, Bot } from 'lucide-react';

interface ResultBannerProps {
  run: TestDriveRun;
  mode: UserMode;
}

export function ResultBanner({ run, mode }: ResultBannerProps) {
  const isCompleted = run.summary.taskStatus === 'completed';

  return (
    <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 md:p-6 shadow-2xl font-sans">
      {/* Top Status & Metrics Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isCompleted ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-amber-500 shadow-lg shadow-amber-500/30'
            }`}
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-white">
                {isCompleted ? 'Agent Completed the Task' : 'Agent Encountered Friction'}
              </h3>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isCompleted ? 'Success' : 'Incomplete'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Target: <span className="text-zinc-300">{run.url}</span> • Run: {run.id}
            </p>
          </div>
        </div>

        {/* Human-Friendly Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400">Agent Tools:</span>
            <strong className="text-white font-mono">{run.summary.webmcpToolCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">Friction Points:</span>
            <strong className={run.summary.frictionCount > 0 ? 'text-amber-400 font-mono' : 'text-emerald-400 font-mono'}>
              {run.summary.frictionCount}
            </strong>
          </div>
          {run.summary.durationMs !== undefined && (
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400">Time Taken:</span>
              <strong className="text-zinc-200 font-mono">{run.summary.durationMs}ms</strong>
            </div>
          )}
        </div>
      </div>

      {/* Plain-English Explanation for Humans */}
      <div className="mt-4 p-4 rounded-xl bg-black border border-zinc-800/90 text-sm">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-zinc-400 mb-2">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>Explanation for Humans</span>
        </div>

        <p className="text-zinc-100 text-sm leading-relaxed">
          {mode === 'explore'
            ? run.plainExplanation.exploreSummary
            : run.plainExplanation.whatHappened}
        </p>

        {run.plainExplanation.whyItHappened && (
          <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
            <strong className="text-zinc-400 font-medium">Why this happened: </strong>
            {run.plainExplanation.whyItHappened}
          </div>
        )}
      </div>

      {/* Human vs Agent Comparison Matrix in Explore Mode */}
      {mode === 'explore' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2 font-bold text-zinc-200 mb-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>What You (Human) See</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              You see the visual webpage layout, product pictures, prices, and colorful buttons designed for human fingers to click.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2 font-bold text-zinc-200 mb-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>What the AI Agent Sees</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {run.tools.length > 0
                ? `The agent found ${run.tools.length} structured tools (${run.tools.map((t) => t.name).join(', ')}). ${
                    run.frictions.length > 0
                      ? 'However, it got stuck because the website did not give it a tool to finish your specific action.'
                      : 'It was able to execute your request directly without guessing.'
                  }`
                : 'The agent found 0 WebMCP tools and had to guess which HTML elements to click.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
