import { useState } from 'react';
import { UserMode } from '@deep-age/shared';
import { Compass, Bug, ShieldCheck, Terminal, X, Copy, Check } from 'lucide-react';

interface HeaderProps {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        'deep-age': {
          command: 'node',
          args: ['/workspaces/Deep-dream/backend/dist/index.js'],
          env: {
            PORT: '3001',
            HEADLESS_BROWSER: 'true',
            NODE_ENV: 'production',
          },
          description: 'Deep Age — AI Agent Website Observability & Chrome WebMCP Inspector',
        },
      },
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(mcpConfigJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="border-b border-zinc-800/80 bg-zinc-950 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100 font-bold text-sm shadow-inner">
            DA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white font-sans">
                Deep Age
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                Agent Observability
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">Understand what actually happens when an AI agent uses a website</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* MCP Config Button */}
          <button
            onClick={() => setShowMcpModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs transition-colors font-medium"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>MCP Config</span>
          </button>

          {/* User Mode Selector */}
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-medium">
            <button
              onClick={() => onModeChange('explore')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                mode === 'explore'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Explore
            </button>
            <button
              onClick={() => onModeChange('debug')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                mode === 'debug'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              Debug
            </button>
            <button
              onClick={() => onModeChange('inspect')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                mode === 'inspect'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Inspect
            </button>
          </div>
        </div>
      </header>

      {/* MCP Configuration Modal */}
      {showMcpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-700 max-w-xl w-full p-6 rounded-xl font-sans shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-zinc-100">MCP Server Configuration</h3>
              </div>
              <button
                onClick={() => setShowMcpModal(false)}
                className="text-zinc-500 hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              Add this configuration to your Claude Desktop (<code className="text-cyan-300 font-mono">claude_desktop_config.json</code>), Cursor, or Antigravity settings to let agents test-drive websites through Deep Age.
            </p>

            <div className="relative mt-3">
              <pre className="p-3.5 bg-black border border-zinc-800 text-xs text-zinc-300 font-mono rounded-lg overflow-x-auto">
                {mcpConfigJson}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-xs text-zinc-200 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between items-center">
              <span>Tool Discovery: <code className="text-zinc-400 font-mono">/api/webmcp/tools</code></span>
              <button
                onClick={() => setShowMcpModal(false)}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-lg text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
