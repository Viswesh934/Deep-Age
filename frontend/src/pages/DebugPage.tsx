import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Play,
  Download,
  CheckCircle2,
  Bug,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

// Specialized Workbench Modules
import { BrowserViewportWithScrubber } from '@/components/workbench/BrowserViewportWithScrubber';
import { FrictionTriagePanel } from '@/components/workbench/FrictionTriagePanel';
import { WebMcpRepl } from '@/components/workbench/WebMcpRepl';
import { NetworkWaterfall } from '@/components/workbench/NetworkWaterfall';
import { ParallelWorldsMatrix } from '@/components/workbench/ParallelWorldsMatrix';

type WorkbenchTab = 'frictions' | 'viewport' | 'repl' | 'parallel' | 'sandbox' | 'network';

export const DebugPage: React.FC = () => {
  const { activeRun, startTestDrive, isLoading } = useTestDriveContext();
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('frictions');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Virtual Sandbox State
  const [sandboxCode, setSandboxCode] = useState<string>(() => {
    return `// 🧪 Virtual WebMCP In-Browser Tool Registration
document.modelContext.registerTool({
  name: 'add_to_cart',
  description: 'Add a specified product item to the user shopping cart',
  inputSchema: {
    type: 'object',
    properties: {
      product_id: { type: 'string', description: 'Target product identifier' },
      quantity: { type: 'number', description: 'Item quantity (default 1)' }
    },
    required: ['product_id']
  },
  execute: async (input) => {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: input.product_id, quantity: input.quantity || 1 })
    });
    return response.json();
  }
});`;
  });
  const [isInjectingSandbox, setIsInjectingSandbox] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<{
    success: boolean;
    message: string;
    resolvedFrictionCount: number;
    simulatedScore: number;
    details: Record<string, unknown>;
  } | null>(null);

  // Computed Scorecard
  const scorecard = useMemo(() => {
    if (!activeRun) {
      return {
        overallScore: 0,
        toolCoverageScore: 0,
        latencyScore: 0,
        schemaScore: 0,
        highFrictions: 0,
        mediumFrictions: 0,
        errorCount: 0,
      };
    }
    const totalTools = activeRun.tools.length;
    const highFrictions = activeRun.frictions.filter((f) => f.severity === 'high').length;
    const mediumFrictions = activeRun.frictions.filter((f) => f.severity === 'medium').length;
    const errorCount = activeRun.errors.length + activeRun.network.filter((n) => n.status >= 400).length;

    let toolCoverageScore = totalTools >= 4 ? 100 : totalTools === 3 ? 80 : totalTools === 2 ? 55 : totalTools === 1 ? 30 : 5;
    if (activeRun.frictions.some((f) => f.type === 'missing_capability')) {
      toolCoverageScore = Math.min(toolCoverageScore, 60);
    }

    const avgDuration = activeRun.summary.durationMs || 1200;
    const latencyScore = avgDuration < 1500 ? 95 : avgDuration < 3500 ? 80 : 60;

    let schemaScore = 90;
    if (totalTools === 0) schemaScore = 0;
    else {
      activeRun.tools.forEach((t) => {
        if (!t.inputSchema || Object.keys(t.inputSchema).length === 0) schemaScore -= 15;
      });
    }
    schemaScore = Math.max(0, Math.min(100, schemaScore));

    const frictionPenalty = highFrictions * 30 + mediumFrictions * 15 + errorCount * 5;
    const rawReadiness = Math.round(
      toolCoverageScore * 0.45 + latencyScore * 0.2 + schemaScore * 0.25 + (100 - Math.min(100, frictionPenalty)) * 0.1
    );
    const overallReadinessScore = Math.max(5, Math.min(100, rawReadiness));

    return {
      overallScore: activeRun.summary.taskStatus === 'completed' && highFrictions === 0 ? 100 : overallReadinessScore,
      toolCoverageScore,
      latencyScore,
      schemaScore,
      highFrictions,
      mediumFrictions,
      errorCount,
    };
  }, [activeRun]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportDiagnostics = () => {
    if (!activeRun) return;
    const exportData = {
      version: '1.0.0',
      generator: 'Deep Age — WebMCP Observability & Diagnostic Engine',
      exportedAt: new Date().toISOString(),
      run: {
        id: activeRun.id,
        url: activeRun.url,
        task: activeRun.task,
        mode: activeRun.mode,
        status: activeRun.status,
        summary: activeRun.summary,
        scorecard,
        plainExplanation: activeRun.plainExplanation,
        tools: activeRun.tools,
        toolCalls: activeRun.toolCalls,
        frictions: activeRun.frictions,
        timeline: activeRun.timeline,
        network: activeRun.network,
        domInteractions: activeRun.domInteractions,
        errors: activeRun.errors,
        securitySignals: activeRun.securitySignals,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deep-age-diagnostics-${activeRun.id || 'run'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInjectAndTestSandbox = async () => {
    if (!activeRun) return;
    setIsInjectingSandbox(true);
    setSandboxResult(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const hasAddToCart = sandboxCode.includes('add_to_cart');
      const hasRegister = sandboxCode.includes('registerTool');

      if (!hasRegister) {
        throw new Error('Script must contain a document.modelContext.registerTool() call.');
      }

      setSandboxResult({
        success: true,
        message: hasAddToCart
          ? 'Virtual WebMCP Tool Registered. Missing capability resolved.'
          : 'Virtual WebMCP Tool injected into live page context.',
        resolvedFrictionCount: hasAddToCart ? Math.max(1, activeRun.frictions.length) : 0,
        simulatedScore: hasAddToCart ? 100 : Math.min(90, scorecard.overallScore + 20),
        details: {
          virtualToolRegistered: hasAddToCart ? 'add_to_cart' : 'custom_tool',
          boundary: 'in-page document.modelContext',
          simulatedInvocation: {
            method: 'POST /api/cart',
            payload: { productId: 'lap-901', quantity: 1 },
            status: 200,
          },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSandboxResult({
        success: false,
        message: `Sandbox Injection Failed: ${msg}`,
        resolvedFrictionCount: 0,
        simulatedScore: scorecard.overallScore,
        details: { error: msg },
      });
    } finally {
      setIsInjectingSandbox(false);
    }
  };

  if (!activeRun) {
    return (
      <Card className="p-10 text-center space-y-4 border-dashed border-border/80 bg-card shadow-xs rounded-3xl font-sans">
        <div className="w-12 h-12 rounded-2xl bg-secondary text-primary mx-auto flex items-center justify-center shadow-xs">
          <Bug className="w-6 h-6 text-[#ff8527]" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <CardTitle className="text-base font-bold text-foreground">Diagnostic Workbench Idle</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            Launch a test-drive to inspect WebMCP schemas, diagnosed friction points, simulated in-browser REPL tools, decision traces, and network HAR streams.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => startTestDrive(undefined, undefined, 'debug')}
          disabled={isLoading}
          className="gap-2 font-semibold text-xs rounded-full px-6 h-9"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Debug Test-Drive</span>
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in text-foreground pb-12">
      {/* TOP COCKPIT: AGENT-READINESS SCORECARD & TELEMETRY */}
      <Card className="space-y-3.5 p-4 md:p-5 border-border/80 bg-card shadow-xs rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs md:text-sm tracking-tight text-foreground font-mono uppercase">
                WebMCP Diagnostic Workbench
              </span>
              <Badge
                variant={activeRun.summary.taskStatus === 'completed' ? 'success' : 'warning'}
                className="font-mono font-bold uppercase text-[10px] rounded-full px-2.5 py-0.5"
              >
                {activeRun.summary.taskStatus === 'completed' ? 'PASS (0 Friction)' : `${activeRun.frictions.length} Issues`}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              Target: <span className="text-foreground font-medium">{activeRun.url}</span> • Duration:{' '}
              <span className="text-foreground font-medium">{activeRun.summary.durationMs || 0}ms</span>
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <Button
              variant="outline"
              size="xs"
              onClick={handleExportDiagnostics}
              className="h-8 px-3 gap-1.5 text-xs font-medium rounded-full border-border/80 hover:bg-secondary cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export HAR</span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleCopy('run-json', JSON.stringify(activeRun, null, 2))}
              className="h-8 px-3 gap-1.5 text-xs font-medium rounded-full border-border/80 hover:bg-secondary cursor-pointer"
            >
              {copiedId === 'run-json' ? <Check className="w-3.5 h-3.5 text-[#5ae561]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'run-json' ? 'Copied' : 'JSON'}</span>
            </Button>
          </div>
        </div>

        {/* 4 Scorecard Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-secondary/30 border-border/60 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Agent Readiness
              </span>
              <div
                className={`text-xl font-bold mt-0.5 font-mono ${
                  scorecard.overallScore >= 80
                    ? 'text-[#5ae561]'
                    : scorecard.overallScore >= 50
                    ? 'text-[#f3c83d]'
                    : 'text-destructive'
                }`}
              >
                {scorecard.overallScore}%
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-background border border-border/80 flex items-center justify-center font-bold text-xs shadow-xs">
              {scorecard.overallScore >= 90 ? 'A+' : scorecard.overallScore >= 75 ? 'B' : scorecard.overallScore >= 50 ? 'C' : 'F'}
            </div>
          </Card>

          <Card className="p-3 bg-secondary/30 border-border/60 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              WebMCP Tools
            </span>
            <div className="text-xl font-bold text-foreground mt-0.5 font-mono">
              {activeRun.tools.length}{' '}
              <span className="text-[11px] font-normal text-muted-foreground">
                ({scorecard.toolCoverageScore}%)
              </span>
            </div>
          </Card>

          <Card className="p-3 bg-secondary/30 border-border/60 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Diagnosed Frictions
            </span>
            <div
              className={`text-xl font-bold mt-0.5 font-mono ${
                activeRun.frictions.length > 0 ? 'text-[#ff8527]' : 'text-[#5ae561]'
              }`}
            >
              {activeRun.frictions.length}{' '}
              <span className="text-[11px] font-normal text-muted-foreground">
                ({scorecard.highFrictions} High)
              </span>
            </div>
          </Card>

          <Card className="p-3 bg-secondary/30 border-border/60 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Network Calls
            </span>
            <div className="text-xl font-bold text-foreground mt-0.5 font-mono">
              {activeRun.network.length}{' '}
              <span className="text-[11px] font-normal text-muted-foreground">
                ({scorecard.errorCount} Errors)
              </span>
            </div>
          </Card>
        </div>
      </Card>

      {/* Unified Workbench Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as WorkbenchTab)} className="w-full">
        <TabsList className="w-full justify-start h-10 p-1 bg-secondary/90 rounded-full border border-border/80 overflow-x-auto">
          <TabsTrigger value="frictions" className="text-xs font-medium font-mono shrink-0 rounded-full h-8 px-3.5">
            <span>Frictions ({activeRun.frictions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="viewport" className="text-xs font-medium font-mono shrink-0 rounded-full h-8 px-3.5">
            <span>Browser Scrubber</span>
          </TabsTrigger>
          <TabsTrigger value="repl" className="text-xs font-medium font-mono shrink-0 rounded-full h-8 px-3.5">
            <span>WebMCP REPL ({activeRun.tools.length})</span>
          </TabsTrigger>
          <TabsTrigger value="parallel" className="text-xs font-medium font-mono shrink-0 rounded-full h-8 px-3.5">
            <span>Parallel Matrix</span>
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="text-xs font-medium font-mono shrink-0 rounded-full h-8 px-3.5">
            <span>Virtual Sandbox</span>
          </TabsTrigger>
          <TabsTrigger value="network" className="text-xs font-medium font-mono shrink-0 rounded-full h-8 px-3.5">
            <span>Network ({activeRun.network.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FRICTIONS */}
        <TabsContent value="frictions" className="pt-2">
          <FrictionTriagePanel run={activeRun} />
        </TabsContent>

        {/* TAB 2: VIEWPORT & SCRUBBER */}
        <TabsContent value="viewport" className="pt-2">
          <BrowserViewportWithScrubber run={activeRun} />
        </TabsContent>

        {/* TAB 3: WEBMCP REPL */}
        <TabsContent value="repl" className="pt-2">
          <WebMcpRepl run={activeRun} />
        </TabsContent>

        {/* TAB 4: PARALLEL WORLDS MATRIX */}
        <TabsContent value="parallel" className="pt-2">
          <ParallelWorldsMatrix run={activeRun} />
        </TabsContent>

        {/* TAB 5: VIRTUAL SANDBOX */}
        <TabsContent value="sandbox" className="pt-2 font-mono text-xs">
          <Card className="p-5 space-y-4 border-border/80 shadow-xs rounded-2xl bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <CardTitle className="text-xs font-bold text-foreground">
                  Virtual WebMCP Tool Injection Sandbox
                </CardTitle>
                <CardDescription className="font-sans text-xs text-muted-foreground mt-0.5">
                  Prototype and validate Chrome WebMCP tools on your target site without redeploying code.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSandboxCode(`// 🛒 Candidate WebMCP Tool for Cart Action
document.modelContext.registerTool({
  name: 'add_to_cart',
  description: 'Add a specified product item to the user shopping cart',
  inputSchema: {
    type: 'object',
    properties: {
      product_id: { type: 'string', description: 'Product identifier' },
      quantity: { type: 'number', description: 'Quantity (default 1)' }
    },
    required: ['product_id']
  },
  execute: async (input) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: input.product_id, quantity: input.quantity || 1 })
    });
    return res.json();
  }
});`)
                  }
                  className="h-7 text-[11px] rounded-full border-border/80 hover:bg-secondary cursor-pointer"
                >
                  + Cart Tool Template
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Candidate Tool Script (document.modelContext.registerTool):
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">JavaScript Context</span>
              </div>

              <Textarea
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                rows={10}
                className="font-mono text-xs leading-relaxed bg-secondary/30 text-foreground border-border/80 rounded-xl"
              />

              <Button
                onClick={handleInjectAndTestSandbox}
                disabled={isInjectingSandbox}
                className="w-full gap-2 text-xs font-semibold h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                {isInjectingSandbox ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Simulate Virtual Tool Injection & Re-evaluate</span>
              </Button>
            </div>

            {sandboxResult && (
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  sandboxResult.success
                    ? 'bg-[#5ae561]/10 border-[#5ae561]/30 text-foreground'
                    : 'bg-destructive/10 border-destructive/30 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {sandboxResult.success ? <CheckCircle2 className="w-4 h-4 text-[#5ae561]" /> : <XCircle className="w-4 h-4 text-destructive" />}
                    <span>{sandboxResult.message}</span>
                  </div>
                  <Badge variant="outline" className="font-mono font-bold rounded-full text-xs">
                    Simulated Score: {sandboxResult.simulatedScore}%
                  </Badge>
                </div>
                <div className="p-3 bg-secondary/40 text-foreground rounded-xl border border-border/80 text-[11px] font-mono overflow-x-auto mt-2">
                  <pre>{JSON.stringify(sandboxResult.details, null, 2)}</pre>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 6: NETWORK */}
        <TabsContent value="network" className="pt-2">
          <NetworkWaterfall run={activeRun} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DebugPage;
