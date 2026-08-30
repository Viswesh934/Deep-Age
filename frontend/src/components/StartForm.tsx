import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { UserMode } from '@deep-age/shared';
import { ArrowUp, RotateCw, Globe, SlidersHorizontal, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Button } from '@/components/ui/button';

interface StartFormProps {
  url?: string;
  setUrl?: (url: string) => void;
  task?: string;
  setTask?: (task: string) => void;
  mode?: UserMode;
  isLoading?: boolean;
  onStart?: () => void;
  onRunDemoPreset?: (enableAddToCart: boolean) => void;
}

export function StartForm(props: StartFormProps) {
  const context = useTestDriveContext();
  const location = useLocation();
  const [showUrlConfig, setShowUrlConfig] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const currentMode: UserMode = props.mode ?? (
    location.pathname.includes('inspect')
      ? 'inspect'
      : location.pathname.includes('debug')
      ? 'debug'
      : 'explore'
  );

  const url = props.url ?? context.url;
  const setUrl = props.setUrl ?? context.setUrl;
  const task = props.task ?? context.task;
  const setTask = props.setTask ?? context.setTask;
  const isLoading = props.isLoading ?? context.isLoading;

  const handleStart = () => {
    if (!task.trim() && !url.trim()) return;
    if (props.onStart) {
      props.onStart();
    } else {
      context.startTestDrive(url, task, currentMode);
    }
  };

  const handleRunPreset = (enableAddToCart: boolean) => {
    if (props.onRunDemoPreset) {
      props.onRunDemoPreset(enableAddToCart);
    } else {
      context.runDemoScenario(enableAddToCart, currentMode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleStart();
    }
  };

  if (isMinimized) {
    return (
      <div className="flex items-center justify-between gap-3 bg-card/95 backdrop-blur-2xl border border-border/90 rounded-full shadow-xl px-4 py-2 ring-1 ring-black/5 dark:ring-white/5 animate-fade-in max-w-lg mx-auto">
        <div className="flex items-center gap-2 font-mono text-xs truncate">
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate text-foreground font-medium">{url || 'http://127.0.0.1:3002'}</span>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shrink-0 cursor-pointer"
        >
          <span>Prompt Bar</span>
          <ChevronUp className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card/95 backdrop-blur-2xl border border-border/90 rounded-3xl shadow-2xl p-3.5 md:p-4 space-y-3 transition-all ring-1 ring-black/5 dark:ring-white/5 animate-fade-in font-sans">
      {/* Top Meta Strip: Target URL + Presets + Minimize */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <button
            type="button"
            onClick={() => setShowUrlConfig(!showUrlConfig)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary text-foreground font-mono text-xs border border-border/70 transition-all shrink-0 shadow-2xs cursor-pointer"
            title="Click to edit target website URL"
          >
            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[280px] font-semibold text-foreground">
              {url || 'Set Target URL'}
            </span>
            <SlidersHorizontal className="w-3 h-3 text-muted-foreground ml-0.5" />
          </button>

          {showUrlConfig && (
            <div className="flex items-center gap-1.5 flex-1 animate-fade-in">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. http://127.0.0.1:3002"
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-full bg-background border border-primary/50 text-xs font-mono outline-none text-foreground shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowUrlConfig(false)}
                className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider hidden sm:inline">
            Presets:
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRunPreset(false)}
            className="h-7 px-3 text-xs text-foreground font-medium rounded-full bg-secondary/70 hover:bg-secondary border border-border/60 shadow-2xs cursor-pointer"
            title="Simulate target site missing WebMCP action tool"
          >
            <span className="w-2 h-2 rounded-full bg-[#ff8527] mr-1.5"></span>
            <span>Friction Demo</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRunPreset(true)}
            className="h-7 px-3 text-xs text-foreground font-medium rounded-full bg-secondary/70 hover:bg-secondary border border-border/60 shadow-2xs cursor-pointer"
            title="Simulate target site with WebMCP tool registered"
          >
            <span className="w-2 h-2 rounded-full bg-[#5ae561] mr-1.5"></span>
            <span>WebMCP Pass</span>
          </Button>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 ml-1 transition-colors cursor-pointer"
            title="Minimize prompt bar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Spacious Chat Input Row */}
      <div className="flex items-center gap-3 bg-secondary/40 focus-within:bg-secondary/80 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10 rounded-2xl px-4 py-2.5 border border-border/80 transition-all shadow-inner">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Instruct the AI agent (e.g. Find a laptop under ₹80k and add to cart)..."
          className="bg-transparent text-sm md:text-base outline-none w-full text-foreground placeholder:text-muted-foreground/70 py-1 font-sans"
        />

        <Button
          type="button"
          onClick={handleStart}
          disabled={isLoading || (!task.trim() && !url.trim())}
          className="font-semibold text-sm h-9 w-9 md:h-10 md:w-10 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shrink-0 shadow-sm flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer"
          aria-label="Send test-drive command"
        >
          {isLoading ? (
            <RotateCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default StartForm;
