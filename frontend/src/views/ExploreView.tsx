import { TestDriveRun } from '@deep-age/shared';
import { Eye, Bot, Sparkles, HelpCircle } from 'lucide-react';

interface ExploreViewProps {
  run: TestDriveRun;
}

export function ExploreView({ run }: ExploreViewProps) {
  const isCompleted = run.summary.taskStatus === 'completed';

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in">
      {/* Top Plain English Headline Card */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isCompleted
                ? 'bg-emerald-500 shadow-md shadow-emerald-500/30'
                : 'bg-amber-500 shadow-md shadow-amber-500/30'
            }`}
          />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isCompleted
                ? 'The AI agent completed your task successfully'
                : 'The AI agent was unable to complete your task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Task: "{run.task}" on{' '}
              <span className="font-mono text-slate-700 dark:text-zinc-300 font-medium">
                {run.url}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Parallel Experience: Visual Screen vs Plain English Story */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: What You See (Visual Webpage) */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                What You (Human) See
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              ● Live Webpage
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-black/50 min-h-[300px]">
            {run.screenshot ? (
              <img
                src={`data:image/jpeg;base64,${run.screenshot}`}
                alt="Live website screen"
                className="w-full h-auto max-h-[360px] object-contain rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm"
              />
            ) : (
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Loading website preview...
              </p>
            )}
          </div>
        </div>

        {/* Right: The Plain English Story */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Plain-English Explanation
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-normal">
              {run.plainExplanation.exploreSummary}
            </div>

            {run.plainExplanation.whyItHappened && (
              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-slate-700 dark:text-zinc-300">Why this happened:</div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {run.plainExplanation.whyItHappened}
                </p>
              </div>
            )}
          </div>

          {/* Simple Action Guidance */}
          <div className="mt-5 p-3.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">What this means for you:</strong>
              {isCompleted
                ? 'The website is properly configured for AI assistants to complete requests autonomously.'
                : 'You may need to perform this step manually on the website because the site owner has not yet enabled automated AI actions for this feature.'}
            </div>
          </div>
        </div>
      </div>

      {/* Human vs Agent Reality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white mb-1.5">
            <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Human Experience
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Humans can see styled buttons, product photos, and visual banners on the screen and use a mouse or touch to click them.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white mb-1.5">
            <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            AI Agent Experience
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            {run.tools.length > 0
              ? `The agent discovered ${run.tools.length} structured tools (${run.tools.map((t) => t.name).join(', ')}). ${
                  run.frictions.length > 0
                    ? 'However, it could not find a tool for the specific step you requested.'
                    : 'It executed all actions directly with 0 guesswork.'
                }`
              : 'The agent found 0 WebMCP tools and had to guess which raw HTML elements to touch.'}
          </p>
        </div>
      </div>
    </div>
  );
}
