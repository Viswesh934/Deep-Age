import React, { useState, useEffect } from 'react';
import { TestDriveRun, WebMCPTool } from '@deep-age/shared';
import {
  Play,
  RotateCw,
  Terminal,
  AlertCircle,
  Copy,
  Check,
  Boxes,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { env } from '@/config/env';

interface WebMcpReplProps {
  run: TestDriveRun;
}

export const WebMcpRepl: React.FC<WebMcpReplProps> = ({ run }) => {
  const [selectedToolIndex, setSelectedToolIndex] = useState<number>(0);
  const [inputJson, setInputJson] = useState<string>('{}');
  const [outputJson, setOutputJson] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionDuration, setExecutionDuration] = useState<number | null>(null);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);

  const activeTool: WebMCPTool | undefined = run.tools?.[selectedToolIndex];

  // Auto-fill sensible default parameters when switching tools
  useEffect(() => {
    if (!activeTool) return;
    if (activeTool.name === 'search_products') {
      setInputJson(JSON.stringify({ query: 'laptop' }, null, 2));
    } else if (activeTool.name === 'filter_products') {
      setInputJson(JSON.stringify({ ram_gb: 16, max_price: 80000 }, null, 2));
    } else if (activeTool.name === 'get_product_details') {
      setInputJson(JSON.stringify({ product_id: 'lap-901' }, null, 2));
    } else if (activeTool.name === 'add_to_cart') {
      setInputJson(JSON.stringify({ product_id: 'lap-901', quantity: 1 }, null, 2));
    } else {
      const template: Record<string, any> = {};
      const props = (activeTool.inputSchema as any)?.properties || {};
      Object.keys(props).forEach((key) => {
        template[key] = props[key].default !== undefined ? props[key].default : props[key].type === 'number' ? 0 : 'sample';
      });
      setInputJson(JSON.stringify(template, null, 2));
    }
    setOutputJson(null);
    setExecutionDuration(null);
  }, [selectedToolIndex, activeTool]);

  const handleExecuteTool = async () => {
    if (!activeTool) return;
    setIsExecuting(true);
    const startTime = performance.now();

    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(inputJson);
      } catch {
        setOutputJson(JSON.stringify({ error: 'Invalid JSON payload format' }, null, 2));
        setIsExecuting(false);
        return;
      }

      const res = await fetch(`${env.backendUrl}/api/test-agent/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: activeTool.name,
          input: parsedInput,
          url: run.url,
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);
      setExecutionDuration(elapsed);
      setOutputJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setOutputJson(JSON.stringify({ error: err.message || 'Execution failed' }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyOutput = () => {
    if (!outputJson) return;
    navigator.clipboard.writeText(outputJson);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 md:p-5 rounded-2xl border border-border/80 shadow-2xs backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-glow-primary">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground font-tech flex items-center gap-2">
              <span>Interactive WebMCP Capability Playground</span>
              <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30 rounded-md">
                {run.tools.length} Registered Tools
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">
              Test-drive any discovered <code className="font-mono text-primary font-semibold">document.modelContext</code> tool with live JSON parameter validation in the browser session.
            </p>
          </div>
        </div>
      </div>

      {run.tools.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 bg-card/60 rounded-2xl">
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-glow-amber">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-foreground font-tech">0 WebMCP Tools Discovered</h4>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-sans">
              The target website did not register any capabilities in <code className="font-mono text-foreground font-bold">document.modelContext</code>.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Tool Selection List */}
          <Card className="lg:col-span-4 border-border/80 overflow-hidden flex flex-col bg-card/95 shadow-card-dark rounded-2xl">
            <CardHeader className="p-4 border-b border-border/80 bg-muted/20">
              <CardTitle className="text-xs font-bold flex items-center gap-2 font-tech text-foreground">
                <Boxes className="w-4 h-4 text-primary" />
                <span>Discovered Tools ({run.tools.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 space-y-2 flex-1 overflow-y-auto max-h-[480px]">
              {run.tools.map((tool, idx) => {
                const isSelected = selectedToolIndex === idx;
                const propCount = Object.keys((tool.inputSchema as any)?.properties || {}).length;

                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => setSelectedToolIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#ff8527]/10 border-[#ff8527] text-foreground shadow-xs font-bold ring-1 ring-[#ff8527]/30'
                        : 'bg-background/80 hover:bg-muted/60 border-border/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground">{tool.name}</span>
                      <Badge
                        variant={isSelected ? 'warning' : 'outline'}
                        className={`text-[10px] font-mono rounded-md ${isSelected ? 'bg-[#ff8527] text-white border-transparent' : 'border-border/60'}`}
                      >
                        {propCount} params
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-sans">
                      {tool.description || 'No description provided.'}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Right: Interactive Playground Workbench */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {activeTool && (
              <Card className="border-border/80 bg-card/95 overflow-hidden shadow-card-dark rounded-2xl">
                <CardHeader className="p-5 border-b border-border/80 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-extrabold text-foreground font-mono">{activeTool.name}</span>
                      <Badge variant="success" className="text-[10px] font-tech font-bold rounded-md">
                        ● READY TO INVOKE
                      </Badge>
                    </div>
                    <p className="text-xs mt-1 font-sans text-muted-foreground leading-relaxed">
                      {activeTool.description}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="glow"
                    onClick={handleExecuteTool}
                    disabled={isExecuting}
                    className="gap-2 text-xs font-bold h-9 px-4 shadow-glow-primary font-tech rounded-xl cursor-pointer"
                  >
                    {isExecuting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Invoking...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Execute Tool</span>
                      </>
                    )}
                  </Button>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Schema Info Preview */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between font-tech">
                      <span>Parameters (JSON Schema Input)</span>
                      <span className="text-[11px] font-mono text-muted-foreground font-normal">JSON Object</span>
                    </label>
                    <Textarea
                      value={inputJson}
                      onChange={(e) => setInputJson(e.target.value)}
                      rows={5}
                      className="font-mono text-xs bg-zinc-950 text-cyan-300 dark:bg-black border-zinc-800 focus:border-primary p-3.5 rounded-xl shadow-inner"
                    />
                  </div>

                  {/* Output Result Window */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-2 font-tech">
                        <span>Execution Response Telemetry</span>
                        {executionDuration !== null && (
                          <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30 rounded-md">
                            <Clock className="w-3 h-3 mr-1 text-primary" />
                            {executionDuration}ms
                          </Badge>
                        )}
                      </label>

                      {outputJson && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={handleCopyOutput}
                          className="h-6 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground font-tech rounded-md"
                        >
                          {copiedOutput ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedOutput ? 'Copied' : 'Copy'}</span>
                        </Button>
                      )}
                    </div>

                    <pre className="p-4 bg-zinc-950 text-emerald-400 dark:bg-black rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800 min-h-[130px] max-h-[240px] shadow-inner leading-relaxed">
                      {outputJson || '// Click "Execute Tool" to trigger runtime WebMCP invocation in Chromium context.'}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebMcpRepl;

