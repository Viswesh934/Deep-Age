import { useState } from 'react';
import { TestDriveRun, UserMode } from '@deep-age/shared';
import {
  Eye,
  Bot,
  Columns,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Copy,
  Check,
  Play,
  RotateCw,
} from 'lucide-react';
import { env } from '../config/env.js';

interface ParallelWorldsViewProps {
  run: TestDriveRun;
  mode: UserMode;
}

export function ParallelWorldsView({ run, mode }: ParallelWorldsViewProps) {
  const [viewLayout, setViewLayout] = useState<'split' | 'human' | 'agent'>('split');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedToolIndex, setSelectedToolIndex] = useState<number>(0);
  const [simInput, setSimInput] = useState<string>('{}');
  const [simOutput, setSimOutput] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const isCompleted = run.summary.taskStatus === 'completed';

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToolSelect = (index: number) => {
    setSelectedToolIndex(index);
    const tool = run.tools[index];
    if (tool?.name === 'search_products') setSimInput(JSON.stringify({ query: 'laptop' }, null, 2));
    else if (tool?.name === 'filter_products') setSimInput(JSON.stringify({ ram_gb: 16, max_price: 80000 }, null, 2));
    else if (tool?.name === 'get_product_details') setSimInput(JSON.stringify({ product_id: 'lap-901' }, null, 2));
    else if (tool?.name === 'add_to_cart') setSimInput(JSON.stringify({ product_id: 'lap-901', quantity: 1 }, null, 2));
    else setSimInput(JSON.stringify({}, null, 2));
    setSimOutput(null);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimOutput(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(simInput);
      } catch {
        throw new Error('Invalid JSON format');
      }
      await fetch(`${env.backendUrl}/api/webmcp/tools`);
      await new Promise((r) => setTimeout(r, 300));
      const activeTool = run.tools[selectedToolIndex];
      setSimOutput(
        JSON.stringify(
          {
            status: 'success',
            tool: activeTool?.name,
            injectedArgs: parsed,
            returnValue: {
              success: true,
              timestamp: Date.now(),
              message: `Executed ${activeTool?.name} inside live page context`,
            },
          },
          null,
          2
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSimOutput(JSON.stringify({ error: msg }, null, 2));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 font-sans">
      {/* Top Parallel Controls Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Columns className="w-3.5 h-3.5 text-indigo-400" />
            Parallel Worlds View
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            • Compare human visual reality with agent machine reality
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setViewLayout('split')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              viewLayout === 'split'
                ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Parallel Split (50/50)
          </button>
          <button
            onClick={() => setViewLayout('human')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              viewLayout === 'human'
                ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            Human World Only
          </button>
          <button
            onClick={() => setViewLayout('agent')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              viewLayout === 'agent'
                ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            Agent World Only
          </button>
        </div>
      </div>

      {/* Main Dual Worlds Container (Fixed Height with Internal Scroll to eliminate vertical page scrolling) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ========================================================================= */}
        {/* LEFT: THE HUMAN WORLD */}
        {/* ========================================================================= */}
        {(viewLayout === 'split' || viewLayout === 'human') && (
          <div
            className={`${
              viewLayout === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
            } flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl h-[720px]`}
          >
            {/* World Header */}
            <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  The Human World
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-indigo-300 rounded border border-zinc-700">
                  VISUAL REALITY
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-mono truncate max-w-[200px]">
                {run.url}
              </span>
            </div>

            {/* Scrollable World Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* 1. Live Rendered Screen */}
              <div className="bg-black border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-zinc-900/60 px-3 py-1.5 border-b border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>LIVE_VIEWPORT_RENDER (1280x800)</span>
                  <span className="text-emerald-400 font-bold">● LIVE SCREENSHOT</span>
                </div>
                <div className="relative h-[220px] bg-black flex items-center justify-center">
                  {run.screenshot ? (
                    <img
                      src={`data:image/jpeg;base64,${run.screenshot}`}
                      alt="Live Browser Render"
                      className="w-full h-full object-contain object-top"
                    />
                  ) : (
                    <p className="text-xs text-zinc-500 font-mono">Loading viewport capture...</p>
                  )}
                </div>
              </div>

              {/* 2. Plain English Human Summary */}
              <div className="p-4 rounded-lg bg-black border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>What Happened (Human Perspective):</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {mode === 'explore'
                    ? run.plainExplanation.exploreSummary
                    : run.plainExplanation.whatHappened}
                </p>
                {run.plainExplanation.whyItHappened && (
                  <div className="pt-2 border-t border-zinc-800/80 text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-300">Why it happened: </strong>
                    {run.plainExplanation.whyItHappened}
                  </div>
                )}
              </div>

              {/* 3. Visual DOM Elements Extracted */}
              <div className="p-4 rounded-lg bg-black border border-zinc-800 space-y-2">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>Interactive Elements On Page ({run.domInteractions.length})</span>
                  <span className="text-[10px] text-zinc-500 font-mono">VISIBLE CONTROLS</span>
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {run.domInteractions.slice(0, 10).map((dom, i) => (
                    <div
                      key={dom.id || i}
                      className="px-2.5 py-1.5 bg-zinc-900/70 border border-zinc-800 rounded text-xs flex items-center justify-between"
                    >
                      <span className="text-zinc-300 font-medium truncate max-w-[240px]">
                        {dom.text || `Element <${dom.elementTag}>`}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{dom.selector}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT: THE AGENT WORLD */}
        {/* ========================================================================= */}
        {(viewLayout === 'split' || viewLayout === 'agent') && (
          <div
            className={`${
              viewLayout === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
            } flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl h-[720px]`}
          >
            {/* World Header */}
            <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5 font-mono">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  The Agent World
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-cyan-300 rounded border border-zinc-700">
                  CHROME WEBMCP
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {run.tools.length} Tools Discovered
              </span>
            </div>

            {/* Scrollable World Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
              {/* 1. Diagnosed Friction & 1-Click Code Fix */}
              {run.frictions.length > 0 ? (
                <div className="p-4 rounded-lg bg-black border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase">
                      ⚠️ AGENT_FRICTION_POINT
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {run.frictions[0].type}
                    </span>
                  </div>
                  <h4 className="text-zinc-100 font-bold">{run.frictions[0].title}</h4>
                  <p className="text-zinc-300 font-sans text-xs">{run.frictions[0].description}</p>

                  {run.frictions[0].codeSnippet && (
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-cyan-300">
                          1-CLICK WEBMCP FIX:
                        </span>
                        <button
                          onClick={() =>
                            handleCopyCode(run.frictions[0].id, run.frictions[0].codeSnippet || '')
                          }
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-[10px] text-zinc-200 flex items-center gap-1 transition-colors"
                        >
                          {copiedId === run.frictions[0].id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copiedId === run.frictions[0].id ? 'COPIED' : 'COPY FIX'}
                        </button>
                      </div>
                      <pre className="p-2.5 bg-black border border-zinc-800 text-[10px] text-cyan-300 overflow-x-auto rounded">
                        {run.frictions[0].codeSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-black border border-emerald-500/30 text-emerald-400">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    ZERO AGENT FRICTION
                  </div>
                  <p className="text-zinc-400 text-xs font-sans mt-1">
                    All agent intents matched registered Chrome WebMCP tools with clean execution.
                  </p>
                </div>
              )}

              {/* 2. Discovered WebMCP Tools Matrix & Interactive Simulator */}
              <div className="p-4 rounded-lg bg-black border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    WebMCP Tool Bench ({run.tools.length})
                  </span>
                  <span className="text-[10px] text-zinc-500">document.modelContext</span>
                </div>

                {/* Tool Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {run.tools.map((t, idx) => (
                    <button
                      key={t.name}
                      onClick={() => handleToolSelect(idx)}
                      className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                        selectedToolIndex === idx
                          ? 'bg-zinc-800 border-cyan-500/50 text-cyan-300 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.name}()
                    </button>
                  ))}
                </div>

                {/* Quick Interactive Execution */}
                {run.tools.length > 0 && (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">
                        Simulate {run.tools[selectedToolIndex]?.name}():
                      </span>
                      <button
                        onClick={handleRunSimulation}
                        disabled={isSimulating}
                        className="px-2.5 py-1 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-[10px] rounded flex items-center gap-1 transition-colors"
                      >
                        {isSimulating ? (
                          <RotateCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 fill-current" />
                        )}
                        RUN TOOL
                      </button>
                    </div>

                    <textarea
                      value={simInput}
                      onChange={(e) => setSimInput(e.target.value)}
                      rows={2}
                      className="w-full bg-black border border-zinc-800 p-2 text-[11px] text-cyan-300 font-mono rounded focus:outline-none focus:border-zinc-600"
                    />

                    {simOutput && (
                      <pre className="p-2 bg-black border border-emerald-500/30 text-emerald-400 text-[10px] overflow-x-auto rounded">
                        {simOutput}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Chronological Decision Steps */}
              <div className="p-4 rounded-lg bg-black border border-zinc-800 space-y-2">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>Agent Decision Timeline ({run.timeline.length} Steps)</span>
                  <span className="text-[10px] text-zinc-500">TRACE</span>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {run.timeline.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="p-2 bg-zinc-900/60 border border-zinc-800/80 rounded text-[11px] flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold ${
                            step.status === 'error'
                              ? 'text-red-400'
                              : step.status === 'warning'
                              ? 'text-amber-400'
                              : 'text-zinc-200'
                          }`}
                        >
                          {step.label}
                        </span>
                        {step.durationMs !== undefined && (
                          <span className="text-[10px] text-zinc-500">{step.durationMs}ms</span>
                        )}
                      </div>
                      <span className="text-zinc-400 font-sans text-[11px] leading-tight">
                        {step.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
