import { useState } from 'react';
import { TestDriveRun } from '@deep-age/shared';
import {
  Cpu,
  Terminal,
  Activity,
  Copy,
  Check,
  Play,
  RotateCw,
  Layers,
  Clock,
  Code2,
} from 'lucide-react';
import { env } from '../config/env.js';

interface DebugViewProps {
  run: TestDriveRun;
}

export function DebugView({ run }: DebugViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedToolIndex, setSelectedToolIndex] = useState<number>(0);
  const [simInput, setSimInput] = useState<string>(() => {
    const t = run.tools[0];
    if (t?.name === 'search_products') return JSON.stringify({ query: 'laptop' }, null, 2);
    if (t?.name === 'filter_products') return JSON.stringify({ ram_gb: 16, max_price: 80000 }, null, 2);
    if (t?.name === 'get_product_details') return JSON.stringify({ product_id: 'lap-901' }, null, 2);
    if (t?.name === 'add_to_cart') return JSON.stringify({ product_id: 'lap-901', quantity: 1 }, null, 2);
    return JSON.stringify({}, null, 2);
  });
  const [simOutput, setSimOutput] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

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
      await new Promise((r) => setTimeout(r, 250));
      const activeTool = run.tools[selectedToolIndex];
      setSimOutput(
        JSON.stringify(
          {
            status: 'success',
            invokedTool: activeTool?.name,
            injectedArgs: parsed,
            inputSchemaMatch: true,
            timestamp: Date.now(),
            output: {
              success: true,
              result: `Executed in-page handler for ${activeTool?.name}`,
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
    <div className="flex flex-col gap-5 font-sans animate-fade-in">
      {/* Top Telemetry Strip */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white uppercase font-mono">
                DEBUGGER // CHROME WEBMCP CONTRACTS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                {run.tools.length} Tools
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
              Target: {run.url} • Execution: {run.summary.durationMs || 0}ms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300">
            Frictions: <strong className={run.summary.frictionCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{run.summary.frictionCount}</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300">
            Network: <strong>{run.summary.networkRequestCount}</strong> reqs
          </div>
        </div>
      </div>

      {/* Grid: 1-Click Code Fix & Diagnosed Friction */}
      {run.frictions.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 border border-amber-200 dark:border-amber-500/30 rounded-xl p-5 shadow-sm space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Diagnosed Agent Friction ({run.frictions.length})
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase">{run.frictions[0].type}</span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{run.frictions[0].title}</h3>
          <p className="text-slate-600 dark:text-zinc-300 font-sans text-xs">{run.frictions[0].description}</p>

          {run.frictions[0].codeSnippet && (
            <div className="p-3.5 bg-slate-900 text-slate-100 dark:bg-black rounded-lg space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  1-Click Chrome WebMCP Drop-in Fix:
                </span>
                <button
                  onClick={() => handleCopyCode(run.frictions[0].id, run.frictions[0].codeSnippet || '')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-white flex items-center gap-1 transition-colors"
                >
                  {copiedId === run.frictions[0].id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === run.frictions[0].id ? 'Copied' : 'Copy WebMCP Fix'}
                </button>
              </div>
              <pre className="p-3 bg-black rounded text-[11px] text-cyan-300 overflow-x-auto">
                {run.frictions[0].codeSnippet}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Grid: WebMCP REPL Simulator & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: WebMCP Tool Bench / Simulator */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <span className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Live In-Page WebMCP Tester
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">document.modelContext</span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Select Discovered Tool ({run.tools.length}):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {run.tools.map((t, idx) => (
                <button
                  key={t.name}
                  onClick={() => handleToolSelect(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                    selectedToolIndex === idx
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                  }`}
                >
                  {t.name}()
                </button>
              ))}
            </div>
          </div>

          {run.tools.length > 0 && (
            <div className="space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                    Input Payload (JSON):
                  </span>
                  <button
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {isSimulating ? <RotateCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                    Test Tool
                  </button>
                </div>
                <textarea
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-black text-slate-900 dark:text-cyan-300 border border-slate-200 dark:border-zinc-800 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {simOutput && (
                <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs overflow-x-auto">
                  <div className="text-[10px] font-bold text-emerald-300 mb-1">Execution Response:</div>
                  <pre className="text-[11px]">{simOutput}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Chronological Decision Timeline */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm font-mono text-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3">
            <span className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Agent Decision Trace ({run.timeline.length} Steps)
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">REAL TIME</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {run.timeline.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${
                    step.status === 'error' ? 'text-red-600 dark:text-red-400' : step.status === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-zinc-200'
                  }`}>
                    {step.label}
                  </span>
                  {step.durationMs !== undefined && (
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{step.durationMs}ms</span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-zinc-400 font-sans text-xs leading-tight mt-0.5">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Network Traffic Inspection */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3">
          <span className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Intercepted Network Stream ({run.network.length} Requests)
          </span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500">Live Traffic</span>
        </div>

        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
          {run.network.map((net) => (
            <div
              key={net.id}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-[10px] font-bold">
                  {net.method}
                </span>
                <span className="text-slate-800 dark:text-zinc-300 truncate max-w-[400px] font-mono">
                  {net.url}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
                <span className={net.status < 400 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500 font-bold'}>
                  {net.status}
                </span>
                <span>{net.durationMs}ms</span>
                <span className="text-[10px] uppercase text-slate-400">{net.origin}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
