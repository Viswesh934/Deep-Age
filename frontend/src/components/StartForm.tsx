import { UserMode } from '@deep-age/shared';
import { Play, RotateCw, Sparkles, AlertCircle } from 'lucide-react';

interface StartFormProps {
  url: string;
  setUrl: (url: string) => void;
  task: string;
  setTask: (task: string) => void;
  mode: UserMode;
  isLoading: boolean;
  onStart: () => void;
  onRunDemoPreset: (enableAddToCart: boolean) => void;
}

export function StartForm({
  url,
  setUrl,
  task,
  setTask,
  mode,
  isLoading,
  onStart,
  onRunDemoPreset,
}: StartFormProps) {
  return (
    <section className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Test-Drive a Website
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Enter any website and question. Deep Age launches headless Chromium to interact with the site and collect evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-zinc-500">Active View:</span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold capitalize">
            {mode} Mode
          </span>
        </div>
      </div>

      {/* Target Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
        <div className="md:col-span-5 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Target Website URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://127.0.0.1:3002 or https://news.ycombinator.com"
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
        </div>

        <div className="md:col-span-7 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Task or Question for AI Agent
          </label>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="What should the agent do or inspect on this website?"
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-zinc-500">Demo Presets:</span>
          <button
            type="button"
            onClick={() => onRunDemoPreset(false)}
            className="px-3 py-1 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-medium transition-colors flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            1. Missing Tool (Friction)
          </button>
          <button
            type="button"
            onClick={() => onRunDemoPreset(true)}
            className="px-3 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-medium transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            2. WebMCP Fixed (Pass)
          </button>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              Driving Live Chromium...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Test-Drive
            </>
          )}
        </button>
      </div>
    </section>
  );
}
