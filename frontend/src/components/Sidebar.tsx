import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const Sidebar: React.FC = () => {
  const { isDark, toggleTheme, setTask, runDemoScenario, setShowMcpModal } = useTestDriveContext();
  const navigate = useNavigate();

  const handleSelectPreset = (question: string) => {
    setTask(question);
    if (question.includes('checkout') || question.includes('cart')) {
      runDemoScenario(false, 'debug');
      navigate('/debug');
    }
  };

  return (
    <aside className="w-64 bg-card text-card-foreground border-r border-border flex flex-col justify-between shrink-0 font-sans select-none transition-colors">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
              DA
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                Deep Age
              </h1>
              <p className="text-[10px] text-muted-foreground">Agent Observability</p>
            </div>
          </div>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator />

        {/* Persona Modes Navigation */}
        <div className="p-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1.5 block">
            Select Persona
          </label>
          <nav className="space-y-1">
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-secondary text-secondary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Compass className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <div className="text-foreground">Explore Mode</div>
                    <div className="text-[10px] font-normal text-muted-foreground">For normal users</div>
                  </div>
                </>
              )}
            </NavLink>

            <NavLink
              to="/debug"
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-secondary text-secondary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Bug className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <div className="text-foreground">Debug Mode</div>
                    <div className="text-[10px] font-normal text-muted-foreground">For developers & PMs</div>
                  </div>
                </>
              )}
            </NavLink>

            <NavLink
              to="/inspect"
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-secondary text-secondary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <div className="text-foreground">Inspect Mode</div>
                    <div className="text-[10px] font-normal text-muted-foreground">For security & privacy</div>
                  </div>
                </>
              )}
            </NavLink>
          </nav>
        </div>

        <Separator />

        {/* Common Human Questions */}
        <div className="p-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1.5 block">
            Quick Questions
          </label>
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectPreset('Why did checkout fail?')}
              className="w-full justify-start h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground font-normal gap-2"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Why did checkout fail?</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectPreset('Where did this price come from?')}
              className="w-full justify-start h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground font-normal gap-2"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Where did this price come from?</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectPreset('What information does this site send?')}
              className="w-full justify-start h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground font-normal gap-2"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">What data is sent?</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectPreset('Find a laptop under ₹80,000 with 16GB RAM and add it to the cart')}
              className="w-full justify-start h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground font-normal gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">Buy laptop under ₹80k</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer / MCP Tools */}
      <div className="p-3 space-y-2">
        <Separator className="mb-2" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMcpModal(true)}
          className="w-full justify-between text-xs h-9"
        >
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            MCP Config
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>

        <div className="px-2 text-[10px] text-muted-foreground">
          Chrome WebMCP Native • 100% Real Engine
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
