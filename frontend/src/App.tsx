import { useState, useEffect } from 'react';
import { useTestDrive } from './hooks/useTestDrive.js';
import { Sidebar } from './components/Sidebar.js';
import { StartForm } from './components/StartForm.js';
import { ExploreView } from './views/ExploreView.js';
import { DebugView } from './views/DebugView.js';
import { InspectView } from './views/InspectView.js';
import { Terminal, X, Copy, Check, Globe, Server } from 'lucide-react';
import { env } from './config/env.js';

export default function App() {
  const {
    mode,
    setMode,
    url,
    setUrl,
    task,
    setTask,
    isLoading,
    activeRun,
    startTestDrive,
    runDemoScenario,
  } = useTestDrive();

  // Default to Light Mode
  const [isDark, setIsDark] = useState<boolean>(false);
  const [showMcpModal, setShowMcpModal] = useState<boolean>(false);
  const [copiedMcp, setCopiedMcp] = useState<boolean>(false);
  const [mcpTab, setMcpTab] = useState<'remote' | 'cli' | 'tools'>('remote');
  const [dynamicMcpConfig, setDynamicMcpConfig] = useState<any>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (showMcpModal) {
      fetch(`${env.backendUrl}/api/mcp/config`)
        .then((res) => res.json())
        .then((data) => setDynamicMcpConfig(data))
        .catch(() => {
          // Fallback to local origin
          const host = window.location.origin;
          setDynamicMcpConfig({
            mcpServers: {
              'deep-age': {
                url: `${host}/mcp`,
                type: 'sse',
                description: 'Deep Age — AI Agent Website Observability & Chrome WebMCP Diagnostics',
                toolsEndpoint: `${host}/api/webmcp/tools`,
              },
            },
          });
        });
    }
  }, [showMcpModal]);

  const activeMcpText = dynamicMcpConfig
    ? mcpTab === 'remote'
      ? JSON.stringify(dynamicMcpConfig.mcpServers, null, 2)
      : mcpTab === 'cli'
      ? JSON.stringify(dynamicMcpConfig.cliConfig, null, 2)
      : JSON.stringify(dynamicMcpConfig.endpoints, null, 2)
    : JSON.stringify(
        {
          mcpServers: {
            'deep-age': {
              url: `${window.location.origin}/mcp`,
              description: 'Deep Age — AI Agent Website Observability & Chrome WebMCP Diagnostics',
            },
          },
        },
        null,
        2
      );

  const handleCopyMcp = () => {
    navigator.clipboard.writeText(activeMcpText);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const handleSelectPreset = (question: string) => {
    setTask(question);
    if (question.includes('checkout') || question.includes('cart')) {
      runDemoScenario(false);
    }
  };

  return (
    <div className={`min-h-screen flex font-sans ${isDark ? 'dark bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Left Sidebar Navigation */}
      <Sidebar
        mode={mode}
        onModeChange={setMode}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onSelectPreset={handleSelectPreset}
        onOpenMcpModal={() => setShowMcpModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
          {/* Top Control Bench */}
          <StartForm
            url={url}
            setUrl={setUrl}
            task={task}
            setTask={setTask}
            mode={mode}
            isLoading={isLoading}
            onStart={() => startTestDrive()}
            onRunDemoPreset={runDemoScenario}
          />

          {/* Mode-Specific Presentation Stage */}
          {activeRun && (
            <section className="flex flex-col gap-6">
              {mode === 'explore' && <ExploreView run={activeRun} />}
              {mode === 'debug' && <DebugView run={activeRun} />}
              {mode === 'inspect' && <InspectView run={activeRun} />}
            </section>
          )}
        </main>

        {/* Clean Footer */}
        <footer className="border-t border-slate-200 dark:border-zinc-800/80 py-3.5 px-6 text-center text-xs text-slate-500 dark:text-zinc-500 bg-white dark:bg-zinc-950 font-sans">
          Deep Age • 100% Real Headless Chromium Execution • Chrome WebMCP Specification
        </footer>
      </div>

      {/* MCP Configuration Modal (Dynamic Env-Backed) */}
      {showMcpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 max-w-2xl w-full p-6 rounded-xl font-sans shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Agent MCP Configuration (Deployment Ready)
                </h3>
              </div>
              <button
                onClick={() => setShowMcpModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-3 leading-relaxed">
              Auto-configured for your deployment environment. Add this block into Claude Desktop, Cursor, Antigravity, or LangChain agents to let them inspect websites via Deep Age.
            </p>

            {/* Protocol Tabs */}
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg mt-3 text-xs font-medium border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setMcpTab('remote')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  mcpTab === 'remote'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Remote MCP (HTTP / SSE)
              </button>
              <button
                onClick={() => setMcpTab('cli')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  mcpTab === 'cli'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Local Stdio (Node CLI)
              </button>
              <button
                onClick={() => setMcpTab('tools')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  mcpTab === 'tools'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                API Endpoints
              </button>
            </div>

            {/* JSON Code Snippet */}
            <div className="relative mt-3">
              <pre className="p-4 bg-slate-900 text-slate-200 dark:bg-black rounded-lg text-xs font-mono overflow-x-auto border border-slate-800">
                {activeMcpText}
              </pre>
              <button
                onClick={handleCopyMcp}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-white flex items-center gap-1 transition-colors"
              >
                {copiedMcp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedMcp ? 'Copied' : 'Copy Config'}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500 flex justify-between items-center">
              <span>Direct Discovery URL: <code className="text-indigo-600 dark:text-cyan-400 font-mono">/mcp.json</code></span>
              <button
                onClick={() => setShowMcpModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold rounded-lg text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
