import React from 'react';
import { Eye, Bot, Sparkles, HelpCircle, Compass, Play } from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export const ExplorePage: React.FC = () => {
  const { activeRun, startTestDrive, isLoading } = useTestDriveContext();

  if (!activeRun) {
    return (
      <Card className="p-8 text-center space-y-4 border-dashed font-sans">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <CardTitle className="text-base font-bold">Ready to Explore</CardTitle>
          <CardDescription className="text-xs">
            Start a test-drive above to see how AI assistants visually view, interact with, and navigate this webpage in real-time.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => startTestDrive(undefined, undefined, 'explore')}
          disabled={isLoading}
          className="gap-2 font-bold text-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Run Test-Drive in Explore Mode
        </Button>
      </Card>
    );
  }

  const isCompleted = activeRun.summary.taskStatus === 'completed';

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in">
      {/* Top Plain English Headline Card */}
      <Card>
        <CardHeader className="p-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                isCompleted
                  ? 'bg-emerald-500 shadow-md shadow-emerald-500/30'
                  : 'bg-amber-500 shadow-md shadow-amber-500/30'
              }`}
            />
            <div>
              <CardTitle className="text-base">
                {isCompleted
                  ? 'The AI agent completed your task successfully'
                  : 'The AI agent was unable to complete your task'}
              </CardTitle>
              <CardDescription className="mt-1">
                Task: "{activeRun.task}" on{' '}
                <span className="font-mono font-medium text-foreground">
                  {activeRun.url}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Parallel Experience: Visual Screen vs Plain English Story */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: What You See (Visual Webpage) */}
        <Card className="lg:col-span-6 overflow-hidden flex flex-col">
          <CardHeader className="p-4 bg-muted/40 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs">What You (Human) See</CardTitle>
            </div>
            <Badge variant="success" className="text-[11px]">
              ● Live Webpage
            </Badge>
          </CardHeader>
          <Separator />

          <CardContent className="p-4 flex-1 flex flex-col items-center justify-center bg-muted/20 min-h-[300px]">
            {activeRun.screenshot ? (
              <img
                src={`data:image/jpeg;base64,${activeRun.screenshot}`}
                alt="Live website screen"
                className="w-full h-auto max-h-[360px] object-contain rounded-lg border border-border shadow-sm"
              />
            ) : (
              <p className="text-xs text-muted-foreground font-medium">
                Loading website preview...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right: The Plain English Story */}
        <Card className="lg:col-span-6 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Plain-English Explanation
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm leading-relaxed text-foreground">
              {activeRun.plainExplanation.exploreSummary}
            </div>

            {activeRun.plainExplanation.whyItHappened && (
              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-foreground">Why this happened:</div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {activeRun.plainExplanation.whyItHappened}
                </p>
              </div>
            )}
          </div>

          {/* Simple Action Guidance */}
          <Alert variant="info" className="mt-4">
            <HelpCircle className="w-4 h-4" />
            <AlertTitle className="text-xs font-semibold">What this means for you</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-1">
              {isCompleted
                ? 'The website is properly configured for AI assistants to complete requests autonomously.'
                : 'You may need to perform this step manually on the website because the site owner has not yet enabled automated AI actions for this feature.'}
            </AlertDescription>
          </Alert>
        </Card>
      </div>

      {/* Human vs Agent Reality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Human Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs text-muted-foreground leading-relaxed">
            Humans can see styled buttons, product photos, and visual banners on the screen and use a mouse or touch to click them.
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              AI Agent Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs text-muted-foreground leading-relaxed">
            {activeRun.tools.length > 0
              ? `The agent discovered ${activeRun.tools.length} structured tools (${activeRun.tools.map((t) => t.name).join(', ')}). ${
                  activeRun.frictions.length > 0
                    ? 'However, it could not find a tool for the specific step you requested.'
                    : 'It executed all actions directly with 0 guesswork.'
                }`
              : 'The agent found 0 WebMCP tools and had to guess which raw HTML elements to touch.'}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExplorePage;
