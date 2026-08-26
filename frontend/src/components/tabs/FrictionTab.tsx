import { useState } from 'react';
import { AgentFriction, UserMode } from '@deep-age/shared';
import { Copy, Check, Terminal } from 'lucide-react';

interface FrictionTabProps {
  frictions: AgentFriction[];
  mode: UserMode;
}

export function FrictionTab({ frictions, mode }: FrictionTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // EXPLORE MODE: Plain English explanation for normal users
  if (mode === 'explore') {
    if (frictions.length === 0) {
      return (
        <div className="p-5 bg-black border border-emerald-500/30 text-xs">
          <div className="font-bold text-emerald-400 text-sm">Everything worked smoothly!</div>
          <p className="text-zinc-400 mt-1 leading-relaxed">
            The assistant was able to navigate the website and complete your request without any hiccups.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
          Why your request couldn't finish automatically ({frictions.length})
        </div>
        {frictions.map((f) => (
          <div key={f.id} className="p-4 bg-black border border-amber-500/30">
            <h5 className="font-bold text-zinc-100 text-sm">{f.title}</h5>
            <p className="text-zinc-300 text-xs mt-2 leading-relaxed">
              {f.description}
            </p>
            <div className="mt-3 p-3 bg-zinc-900 border border-zinc-800 text-xs text-zinc-200">
              <strong className="text-zinc-400">What you can do:</strong> You may need to click or perform this step manually on the website since the site hasn't automated it for assistants yet.
            </div>
          </div>
        ))}
      </div>
    );
  }

  // INSPECT MODE: Security user auditing capability gaps
  if (mode === 'inspect') {
    return (
      <div className="space-y-4 font-mono text-xs">
        <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
          AGENT_FRICTION_&_SANDBOX_GAPS ({frictions.length})
        </div>
        {frictions.length === 0 ? (
          <div className="p-4 bg-black border border-zinc-800 text-zinc-400">
            No friction-induced boundary violations detected.
          </div>
        ) : (
          frictions.map((f) => (
            <div key={f.id} className="p-4 bg-black border border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-amber-400">
                  {f.type}
                </span>
                <h5 className="font-bold text-zinc-100">{f.title}</h5>
              </div>
              <p className="text-zinc-400 text-xs mt-2 font-sans">{f.description}</p>
              <div className="mt-3 p-2.5 bg-zinc-950 border border-zinc-800 text-[11px]">
                <span className="text-zinc-500 font-bold">IMPACT: </span>
                <span className="text-zinc-300">
                  Forces agent into fallback DOM emulation instead of declarative WebMCP contracts.
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // DEBUG MODE: Full technical fix with ready-to-copy code snippet
  if (frictions.length === 0) {
    return (
      <div className="p-5 bg-black border border-emerald-500/30 text-emerald-400 font-mono text-xs">
        <div className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400"></span>
          ZERO_AGENT_FRICTION_DETECTED
        </div>
        <p className="text-zinc-400 font-sans text-xs mt-1.5">
          All agent intent was backed by discoverable WebMCP tools and responding HTTP endpoints.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
        DIAGNOSED_FRICTION_POINTS ({frictions.length})
      </div>
      {frictions.map((f) => (
        <div key={f.id} className="p-4 bg-black border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {f.severity}_SEVERITY
              </span>
              <h5 className="font-bold text-zinc-100">{f.title}</h5>
            </div>
            <span className="text-[10px] text-zinc-500">{f.type}</span>
          </div>

          <p className="text-zinc-300 font-sans text-xs mt-2">{f.description}</p>

          <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 text-[11px]">
            <div className="text-zinc-500 font-bold mb-1">RECORDED_EVIDENCE:</div>
            <ul className="list-disc list-inside text-zinc-400 space-y-0.5">
              {f.evidence.toolsDiscovered && (
                <li>Discovered Tools: [{f.evidence.toolsDiscovered.join(', ')}]</li>
              )}
              {f.evidence.relevantApiEndpoint && <li>Observed Endpoint: {f.evidence.relevantApiEndpoint}</li>}
              {f.evidence.domElementDetected && <li>DOM Control: {f.evidence.domElementDetected}</li>}
            </ul>
          </div>

          <div className="mt-3 p-3 bg-zinc-900 border border-zinc-700 text-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-zinc-300 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                1-CLICK CODE FIX (Chrome WebMCP Standard):
              </strong>
              {f.codeSnippet && (
                <button
                  onClick={() => handleCopy(f.id, f.codeSnippet || '')}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-[10px] text-zinc-200 flex items-center gap-1 transition-colors"
                >
                  {copiedId === f.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedId === f.id ? 'COPIED' : 'COPY FIX'}
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-400 mb-2 font-sans">{f.recommendation}</p>
            {f.codeSnippet && (
              <pre className="p-3 bg-black border border-zinc-800 text-cyan-300 text-[11px] overflow-x-auto">
                {f.codeSnippet}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
