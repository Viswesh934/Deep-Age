import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Bug,
  ShieldCheck,
  Terminal,
  Sun,
  Moon,
  ArrowUpRight,
  LayoutGrid,
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
  const { isDark, toggleTheme, setShowMcpModal } = useTestDriveContext();

  return (
    <aside className="w-64 bg-card text-card-foreground border-r border-border/70 flex flex-col justify-between shrink-0 font-sans select-none transition-colors sticky top-0 h-screen overflow-y-auto z-40">
      <div className="flex flex-col">
        {/* Workspace Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-border/70">
          <div className="flex items-center gap-2.5">
            {/* Wajo-style Geometric Logo Badge */}
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <rect x="2" y="3" width="4" height="18" rx="1"></rect>
                <rect x="8" y="8" width="4" height="13" rx="1"></rect>
                <rect x="14" y="13" width="4" height="8" rx="1"></rect>
                <rect x="20" y="3" width="4" height="18" rx="1"></rect>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-1.5">
                Deep Age
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">Agent Observability</p>
            </div>
          </div>

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 cursor-pointer"
                  aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-[#f3c83d]" />
                  ) : (
                    <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <p>{isDark ? 'Light Theme' : 'Dark Theme'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="p-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2 block">
            Navigation
          </label>
          <nav className="space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#ff8527]/12 text-foreground font-semibold shadow-2xs border border-[#ff8527]/30'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-[#ff8527] text-white shadow-xs' : 'bg-secondary text-muted-foreground'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="text-foreground">Home & MCP</div>
                    <div className="text-[10px] font-normal text-muted-foreground">Test-drive & setup</div>
                  </div>
                </>
              )}
            </NavLink>

            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#ff8527]/12 text-foreground font-semibold shadow-2xs border border-[#ff8527]/30'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-[#ff8527] text-white shadow-xs' : 'bg-secondary text-muted-foreground'}`}>
                    <Compass className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="text-foreground">Explore</div>
                    <div className="text-[10px] font-normal text-muted-foreground">Live session</div>
                  </div>
                </>
              )}
            </NavLink>

            <NavLink
              to="/debug"
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#ff8527]/12 text-foreground font-semibold shadow-2xs border border-[#ff8527]/30'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-[#ff8527] text-white shadow-xs' : 'bg-secondary text-muted-foreground'}`}>
                    <Bug className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="text-foreground">Debug & WebMCP</div>
                    <div className="text-[10px] font-normal text-muted-foreground">Developer workbench</div>
                  </div>
                </>
              )}
            </NavLink>

            <NavLink
              to="/inspect"
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#ff8527]/12 text-foreground font-semibold shadow-2xs border border-[#ff8527]/30'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-[#ff8527] text-white shadow-xs' : 'bg-secondary text-muted-foreground'}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="text-foreground">Inspect & Security</div>
                    <div className="text-[10px] font-normal text-muted-foreground">Privacy telemetry</div>
                  </div>
                </>
              )}
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer / MCP Tools */}
      <div className="p-3 space-y-2">
        <Separator className="mb-2 border-border/60" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMcpModal(true)}
          className="w-full justify-between text-xs h-9 rounded-full border-border/80 hover:bg-secondary cursor-pointer"
        >
          <span className="flex items-center gap-2 font-medium">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span>Connect Agent (MCP)</span>
          </span>
          <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
