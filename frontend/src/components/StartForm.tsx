import React from 'react';
import { useLocation } from 'react-router-dom';
import { UserMode } from '@deep-age/shared';
import { Play, RotateCw, Sparkles, AlertCircle } from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const StartForm: React.FC = () => {
  const { url, setUrl, task, setTask, isLoading, startTestDrive, runDemoScenario } = useTestDriveContext();
  const location = useLocation();

  const currentMode: UserMode = location.pathname.includes('inspect')
    ? 'inspect'
    : location.pathname.includes('debug')
    ? 'debug'
    : 'explore';

  const handleStart = () => {
    startTestDrive(url, task, currentMode);
  };

  const handleRunPreset = (enableAddToCart: boolean) => {
    runDemoScenario(enableAddToCart, currentMode);
  };

  return (
    <Card className="font-sans">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Test-Drive a Website
            </CardTitle>
            <CardDescription className="mt-1">
              Enter any website and question. Deep Age launches headless Chromium to interact with the site and collect evidence.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active View:</span>
            <Badge variant="outline" className="capitalize font-semibold">
              {currentMode} Mode
            </Badge>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-5 space-y-5">
        {/* Target Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Target Website URL
            </label>
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://127.0.0.1:3002 or https://news.ycombinator.com"
              className="font-mono"
            />
          </div>

          <div className="md:col-span-7 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Task or Question for AI Agent
            </label>
            <Input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What should the agent do or inspect on this website?"
            />
          </div>
        </div>

        <Separator />

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Demo Presets:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRunPreset(false)}
              className="h-8 text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1.5 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              1. Missing Tool (Friction)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRunPreset(true)}
              className="h-8 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              2. WebMCP Fixed (Pass)
            </Button>
          </div>

          <Button
            type="button"
            onClick={handleStart}
            disabled={isLoading}
            className="font-bold gap-2 text-xs h-9 px-5 shadow-sm"
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
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StartForm;
