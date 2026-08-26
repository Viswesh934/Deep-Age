import { UserMode } from '@deep-age/shared';
import {
  Compass,
  Bug,
  ShieldCheck,
  Terminal,
  Sun,
  Moon,
  Sparkles,
  ShoppingBag,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

interface SidebarProps {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSelectPreset: (question: string) => void;
  onOpenMcpModal: () => void;
}

export function Sidebar({
  mode,
  onModeChange,
  isDark,
  onToggleTheme,
  onSelectPreset,
  onOpenMcpModal,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between shrink-0 font-sans select-none transition-colors">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-zinc-800 flex items-center justify-center text-white font-bold text-xs shadow">
              DA
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Deep Age
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Agent Observability</p>
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* Persona Modes */}
        <div className="p-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 mb-1 block">
            Select Persona
          </label>
          <nav className="space-y-1">
            <button
              onClick={() => onModeChange('explore')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === 'explore'
                  ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Compass className={`w-4 h-4 ${mode === 'explore' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <div>Explore Mode</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-zinc-500">For normal users</div>
              </div>
            </button>

            <button
              onClick={() => onModeChange('debug')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === 'debug'
                  ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Bug className={`w-4 h-4 ${mode === 'debug' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <div>Debug Mode</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-zinc-500">For developers & PMs</div>
              </div>
            </button>

            <button
              onClick={() => onModeChange('inspect')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === 'inspect'
                  ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${mode === 'inspect' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <div>Inspect Mode</div>
                <div className="text-[10px] font-normal text-slate-500 dark:text-zinc-500">For security & privacy</div>
              </div>
            </button>
          </nav>
        </div>

        {/* Common Human Questions */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 mb-1.5 block">
            Quick Questions
          </label>
          <div className="space-y-1">
            <button
              onClick={() => onSelectPreset('Why did checkout fail?')}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Why did checkout fail?</span>
            </button>

            <button
              onClick={() => onSelectPreset('Where did this price come from?')}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-2 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Where did this price come from?</span>
            </button>

            <button
              onClick={() => onSelectPreset('What information does this site send?')}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-2 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">What data is sent?</span>
            </button>

            <button
              onClick={() => onSelectPreset('Find a laptop under ₹80,000 with 16GB RAM and add it to the cart')}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">Buy laptop under ₹80k</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer / MCP Tools */}
      <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
        <button
          onClick={onOpenMcpModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors"
        >
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
            MCP Config
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <div className="px-2 text-[10px] text-slate-400 dark:text-zinc-500">
          Chrome WebMCP Native • 100% Real Engine
        </div>
      </div>
    </aside>
  );
}
