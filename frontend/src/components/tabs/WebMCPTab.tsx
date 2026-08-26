import { WebMCPTool, WebMCPToolCall, UserMode } from '@deep-age/shared';

interface WebMCPTabProps {
  tools: WebMCPTool[];
  toolCalls: WebMCPToolCall[];
  mode: UserMode;
}

export function WebMCPTab({ tools, toolCalls, mode }: WebMCPTabProps) {
  // EXPLORE MODE: Plain English, non-technical human representation
  if (mode === 'explore') {
    return (
      <div className="space-y-5">
        <div>
          <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-2">
            What the assistant can do on this website ({tools.length})
          </h4>
          {tools.length === 0 ? (
            <p className="text-sm text-zinc-400">This website hasn't enabled any smart assistant actions.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tools.map((t) => (
                <div key={t.name} className="p-4 bg-black border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {t.name.includes('search') ? '🔍' : t.name.includes('filter') ? '⚡' : t.name.includes('cart') ? '🛒' : '📦'}
                    </span>
                    <span className="font-bold text-zinc-100 capitalize text-sm">
                      {t.name.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-2">
            What the assistant did during your test
          </h4>
          {toolCalls.length === 0 ? (
            <p className="text-sm text-zinc-500">No automated actions were performed.</p>
          ) : (
            <div className="space-y-2">
              {toolCalls.map((call) => (
                <div key={call.id} className="p-3 bg-black border border-zinc-800 text-xs">
                  <div className="flex items-center justify-between text-zinc-200">
                    <span className="font-semibold capitalize">
                      Checked "{call.toolName.replace(/_/g, ' ')}"
                    </span>
                    <span className="text-zinc-500 text-[11px]">{call.durationMs}ms</span>
                  </div>
                  {call.output !== undefined && (
                    <p className="text-emerald-400 mt-1 text-xs">
                      ✓ Successfully retrieved information from the store.
                    </p>
                  )}
                  {Boolean(call.error) && (
                    <p className="text-red-400 mt-1 text-xs">
                      ✗ Could not complete this action: {call.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // INSPECT MODE: Security & permissions perspective
  if (mode === 'inspect') {
    return (
      <div className="space-y-5 font-mono text-xs">
        <div>
          <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
            WEBMCP_CAPABILITY_SANDBOX_AUDIT ({tools.length})
          </div>
          <div className="space-y-2.5">
            {tools.map((t) => (
              <div key={t.name} className="p-3 bg-black border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">{t.name}()</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800">
                    SCOPE: CLIENT_WINDOW
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] mt-1 font-sans">{t.description}</p>
                <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-4 border-t border-zinc-900 pt-2">
                  <span>Input Fields: {Object.keys(t.inputSchema || {}).length}</span>
                  <span>Execution Boundary: In-Page JavaScript</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
            INVOCATION_AUDIT_LOG ({toolCalls.length})
          </div>
          <div className="space-y-2">
            {toolCalls.map((call) => (
              <div key={call.id} className="p-3 bg-black border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>TOOL_CALL: {call.toolName}</span>
                  <span className="text-zinc-500">{call.durationMs}ms</span>
                </div>
                <div className="text-zinc-500 text-[10px] mt-1">PAYLOAD: {JSON.stringify(call.input)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DEBUG MODE: Full technical schema & developer trace
  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-3">
          DISCOVERED_WEBMCP_TOOLS ({tools.length})
        </div>
        {tools.length === 0 ? (
          <p className="text-zinc-500">No WebMCP tools exposed by target page context.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tools.map((t) => (
              <div key={t.name} className="p-3.5 bg-black border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">{t.name}()</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {t.source || 'modelContext'}
                  </span>
                </div>
                <p className="text-zinc-300 font-sans text-xs mt-1.5">{t.description}</p>
                <div className="mt-2.5 text-[10px] text-zinc-400 bg-zinc-950 p-2 border border-zinc-800/80 overflow-x-auto">
                  {JSON.stringify(t.inputSchema, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Tool Execution Trace */}
      <div>
        <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-3">
          LIVE_EXECUTION_TRACE ({toolCalls.length})
        </div>
        {toolCalls.length === 0 ? (
          <p className="text-zinc-500">No tool execution calls recorded.</p>
        ) : (
          <div className="space-y-2">
            {toolCalls.map((call) => (
              <div key={call.id} className="p-3 bg-black border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-zinc-100 font-bold">{call.toolName}()</span>
                  <span className="text-zinc-500">{call.durationMs}ms</span>
                </div>
                <div className="text-zinc-400">
                  <span className="text-zinc-600">INPUT:</span> {JSON.stringify(call.input)}
                </div>
                {call.output !== undefined && (
                  <div className="text-emerald-400 mt-1">
                    <span className="text-zinc-600">OUTPUT:</span> {JSON.stringify(call.output)}
                  </div>
                )}
                {Boolean(call.error) && (
                  <div className="text-red-400 mt-1">
                    <span className="text-zinc-600">ERROR:</span> {call.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
