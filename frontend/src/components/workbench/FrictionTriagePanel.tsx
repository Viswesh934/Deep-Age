import React, { useState } from 'react';
import { AgentFriction, TestDriveRun } from '@deep-age/shared';
import {
  Check,
  Copy,
  Code2,
  CheckCircle2,
  Globe,
  MousePointerClick,
  Zap,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTestDriveContext } from '@/context/TestDriveContext';

interface FrictionTriagePanelProps {
  run: TestDriveRun;
}

type CodeFramework = 'webmcp' | 'react' | 'node';

export const FrictionTriagePanel: React.FC<FrictionTriagePanelProps> = ({ run }) => {
  const { startTestDrive, isLoading } = useTestDriveContext();
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedFrameworks, setSelectedFrameworks] = useState<Record<string, CodeFramework>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingFixId, setTestingFixId] = useState<string | null>(null);

  const filteredFrictions = run.frictions.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity === severityFilter;
  });

  const getFrameworkSnippet = (friction: AgentFriction, framework: CodeFramework): string => {
    if (framework === 'react') {
      return `import { useWebMcp } from '@deep-age/react';

export function CartButton({ product, onAddToCart }) {
  // Expose WebMCP capability automatically to browser AI agents
  useWebMcp({
    name: 'add_to_cart',
    description: 'Add a product to the customer shopping cart',
    inputSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Unique product ID' },
        quantity: { type: 'number', default: 1 }
      },
      required: ['productId']
    },
    handler: async (args) => {
      return await onAddToCart(args.productId, args.quantity);
    }
  });

  return (
    <button onClick={() => onAddToCart(product.id, 1)} className="btn-cart">
      Add to Cart
    </button>
  );
}`;
    }

    if (framework === 'node') {
      return `// Express / Node.js API with WebMCP Schema Metadata Header
app.post('/api/cart', (req, res) => {
  const { productId, quantity } = req.body;
  
  // Set WebMCP discovery headers for web agents
  res.setHeader('X-WebMCP-Tool', 'add_to_cart');
  res.setHeader('X-WebMCP-Schema', JSON.stringify({
    productId: 'string',
    quantity: 'number'
  }));

  const updatedCart = cartService.addItem(productId, quantity || 1);
  return res.json({ success: true, cart: updatedCart });
});`;
    }

    // Default Vanilla WebMCP
    return friction.codeSnippet || `// Register native WebMCP tool in the browser DOM context
if (window.modelContext) {
  window.modelContext.registerTool({
    name: 'add_to_cart',
    description: 'Add a product to the customer shopping cart',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'Product identifier' },
        quantity: { type: 'number', description: 'Number of units', default: 1 }
      },
      required: ['product_id']
    },
    execute: async (params) => {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    }
  });
}`;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in">
      {/* Triage Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/20 border border-border/60 rounded-2xl text-left">
        <div>
          <h3 className="text-sm font-semibold text-foreground text-left">
            Agent Friction Triage
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans text-left">
            {run.frictions.length > 0
              ? `${run.frictions.length} capability gaps and interaction obstacles diagnosed`
              : 'Zero agent friction points diagnosed on target website'}
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/70 text-xs font-mono">
          <button
            type="button"
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              severityFilter === 'all'
                ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({run.frictions.length})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('high')}
            className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              severityFilter === 'high'
                ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            High ({run.frictions.filter((f) => f.severity === 'high').length})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('medium')}
            className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              severityFilter === 'medium'
                ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Medium ({run.frictions.filter((f) => f.severity === 'medium').length})
          </button>
        </div>
      </div>

      {/* Virtual Run Active Notification Banner */}
      {run.isVirtualRun && (
        <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-transparent border border-emerald-500/30 rounded-2xl shadow-glow-emerald">
          <div className="flex items-center gap-2.5 text-xs text-foreground">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold font-tech">VIRTUAL WEBMCP INJECTION ACTIVE:</span>
            <span className="text-muted-foreground font-sans">
              This run was verified in isolated Chromium memory with zero code modifications needed on the target site.
            </span>
          </div>
          <Badge className="bg-emerald-500 text-black font-bold font-mono text-[10px] px-2 py-0.5">
            0 CODE CHANGES
          </Badge>
        </div>
      )}

      {/* Friction Cards List */}
      {filteredFrictions.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 bg-card/60 rounded-2xl">
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-glow-emerald">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-foreground font-tech">No Active Friction Warnings</h4>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-sans">
              All agent actions proceeded without capability gaps or unhandled schema mismatches.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFrictions.map((friction) => {
            const currentFramework = selectedFrameworks[friction.id] || 'webmcp';
            const codeSnippet = getFrameworkSnippet(friction, currentFramework);

            return (
              <Card
                key={friction.id}
                className="border-border/80 bg-card/95 overflow-hidden shadow-card-dark transition-all hover:border-border rounded-2xl"
              >
                {/* Friction Card Header */}
                <CardHeader className="p-5 pb-3.5 border-b border-border/60 bg-muted/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          friction.severity === 'high'
                            ? 'destructive'
                            : friction.severity === 'medium'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="uppercase text-[10px] font-tech font-bold tracking-wider rounded-md"
                      >
                        {friction.severity} Severity
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground rounded-md">
                        {friction.type}
                      </Badge>
                    </div>

                    <span className="text-[11px] text-muted-foreground font-mono">
                      ID: {friction.id}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-foreground mt-2 font-tech">
                    {friction.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-sans">
                    {friction.description}
                  </p>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Multi-modal Evidence Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {friction.evidence.relevantApiEndpoint && (
                      <div className="p-3.5 rounded-xl bg-background/90 border border-border/80 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-tech text-xs font-bold">
                          <Globe className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Detected REST API Endpoint</span>
                        </div>
                        <code className="text-indigo-600 dark:text-indigo-400 font-mono text-xs block font-bold bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                          {friction.evidence.relevantApiEndpoint}
                        </code>
                      </div>
                    )}

                    {friction.evidence.domElementDetected && (
                      <div className="p-3.5 rounded-xl bg-background/90 border border-border/80 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-tech text-xs font-bold">
                          <MousePointerClick className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Interactive DOM Control Detected</span>
                        </div>
                        <code className="text-cyan-600 dark:text-cyan-400 font-mono text-xs block font-bold bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/10">
                          {friction.evidence.domElementDetected}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Recommendation Callout */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold font-tech text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Recommended Developer Remediation</span>
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-200/90 leading-relaxed text-xs font-sans">
                      {friction.recommendation}
                    </p>
                  </div>

                  {/* Code Fix Generator with Multi-Framework Tabs */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold font-tech text-foreground">
                        <Code2 className="w-4 h-4 text-primary" />
                        <span>Instant WebMCP Remediation Patch:</span>
                      </div>

                      {/* Framework Selector Tabs */}
                      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border/60 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFrameworks((prev) => ({ ...prev, [friction.id]: 'webmcp' }))
                          }
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            currentFramework === 'webmcp'
                              ? 'bg-[#ff8527] text-white shadow-xs font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          Vanilla WebMCP
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFrameworks((prev) => ({ ...prev, [friction.id]: 'react' }))
                          }
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            currentFramework === 'react'
                              ? 'bg-[#ff8527] text-white shadow-xs font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          React Hook
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFrameworks((prev) => ({ ...prev, [friction.id]: 'node' }))
                          }
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            currentFramework === 'node'
                              ? 'bg-[#ff8527] text-white shadow-xs font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          Node / Express
                        </button>
                      </div>
                    </div>

                    {/* Pretty Code Snippet View */}
                    <div className="relative">
                      <pre className="p-4 bg-zinc-950 text-cyan-300 dark:bg-black rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800 leading-relaxed shadow-inner">
                        {codeSnippet}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(friction.id, codeSnippet)}
                        className="absolute top-3 right-3 h-7 text-xs gap-1.5 shadow-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-lg cursor-pointer"
                      >
                        {copiedId === friction.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Patch Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Patch</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* ⚡ Instant Virtual In-Browser Live Test Drive */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 p-3 bg-secondary/30 rounded-xl border border-border/70">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="w-4 h-4 text-[#ff8527]" />
                        <span>Inject this exact tool declaration into live browser memory to re-run test drive with zero friction:</span>
                      </div>

                      <Button
                        size="sm"
                        onClick={async () => {
                          setTestingFixId(friction.id);
                          try {
                            await startTestDrive(run.url, run.task, run.mode, friction.codeSnippet || codeSnippet);
                          } finally {
                            setTestingFixId(null);
                          }
                        }}
                        disabled={isLoading || testingFixId === friction.id}
                        className="h-8 px-4 text-xs gap-1.5 font-bold rounded-full bg-gradient-to-r from-[#ff8527] to-amber-500 hover:from-[#e06f1a] hover:to-amber-600 text-white shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        {testingFixId === friction.id || isLoading ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Injecting & Testing...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>⚡ Test Virtual Fix on Live Site</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FrictionTriagePanel;

