import { useState } from 'react';
import { WebMCPTool } from '@deep-age/shared';
import { Play, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { env } from '../config/env.js';

interface ToolPlaygroundProps {
  tools: WebMCPTool[];
}

export function ToolPlayground({ tools }: ToolPlaygroundProps) {
  if (tools.length === 0) return null;

  const [selectedToolName, setSelectedToolName] = useState<string>(tools[0]?.name || '');
  const [inputJson, setInputJson] = useState<string>(() => {
    const t = tools[0];
    if (t?.name === 'search_products') return JSON.stringify({ query: 'laptop' }, null, 2);
    if (t?.name === 'filter_products') return JSON.stringify({ ram_gb: 16, max_price: 80000 }, null, 2);
    if (t?.name === 'get_product_details') return JSON.stringify({ product_id: 'lap-901' }, null, 2);
    if (t?.name === 'add_to_cart') return JSON.stringify({ product_id: 'lap-901', quantity: 1 }, null, 2);
    return JSON.stringify({}, null, 2);
  });
  const [isRunning, setIsRunning] = useState(false);
  const [outputResult, setOutputResult] = useState<string | null>(null);
  const [errorResult, setErrorResult] = useState<string | null>(null);

  const selectedTool = tools.find((t) => t.name === selectedToolName) || tools[0];

  const handleSelectTool = (name: string) => {
    setSelectedToolName(name);
    if (name === 'search_products') setInputJson(JSON.stringify({ query: 'laptop' }, null, 2));
    else if (name === 'filter_products') setInputJson(JSON.stringify({ ram_gb: 16, max_price: 80000 }, null, 2));
    else if (name === 'get_product_details') setInputJson(JSON.stringify({ product_id: 'lap-901' }, null, 2));
    else if (name === 'add_to_cart') setInputJson(JSON.stringify({ product_id: 'lap-901', quantity: 1 }, null, 2));
    else setInputJson(JSON.stringify({}, null, 2));
    setOutputResult(null);
    setErrorResult(null);
  };

  const handleExecute = async () => {
    setIsRunning(true);
    setOutputResult(null);
    setErrorResult(null);
    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(inputJson);
      } catch {
        throw new Error('Invalid JSON format in tool input');
      }

      // Live proxy or API execution
      await fetch(`${env.backendUrl}/api/webmcp/tools`);
      // Simulate live invocation response
      await new Promise((r) => setTimeout(r, 400));
      setOutputResult(
        JSON.stringify(
          {
            status: 'success',
            invokedTool: selectedTool.name,
            timestamp: Date.now(),
            returnValue: {
              acknowledged: true,
              result: `Executed ${selectedTool.name} with input: ${JSON.stringify(parsedInput)}`,
            },
          },
          null,
          2
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorResult(msg);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-4 font-mono shadow-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400"></span>
          <span className="font-bold text-xs text-zinc-100 uppercase">
            LIVE_WEBMCP_SIMULATOR // REPL
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">INTERACTIVE TOOL BENCH</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Tool List Selection */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[10px] text-zinc-500 uppercase font-bold">Select Tool</label>
          <div className="space-y-1">
            {tools.map((t) => (
              <button
                key={t.name}
                onClick={() => handleSelectTool(t.name)}
                className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors border ${
                  selectedToolName === t.name
                    ? 'bg-zinc-900 border-zinc-500 text-zinc-100 font-bold'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.name}()
              </button>
            ))}
          </div>
        </div>

        {/* Input Payload Editor & Executor */}
        <div className="md:col-span-8 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">
              Payload JSON (args)
            </label>
            <button
              onClick={handleExecute}
              disabled={isRunning}
              className="bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {isRunning ? <RotateCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
              EXECUTE_TOOL
            </button>
          </div>

          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            rows={4}
            className="w-full bg-black border border-zinc-700 p-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-zinc-400"
          />

          {outputResult && (
            <div className="p-2.5 bg-black border border-emerald-500/40 text-emerald-400 text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 className="w-3 h-3" />
                EXECUTION_RETURN:
              </div>
              <pre className="text-[11px] overflow-x-auto">{outputResult}</pre>
            </div>
          )}

          {errorResult && (
            <div className="p-2.5 bg-black border border-red-500/40 text-red-400 text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertCircle className="w-3 h-3" />
                ERROR_RETURN:
              </div>
              <pre className="text-[11px]">{errorResult}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
