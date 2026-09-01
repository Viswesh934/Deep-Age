import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Check,
  Play,
  Bug,
  Globe,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { env } from '@/config/env';

export const LandingPage: React.FC = () => {
  const { url, setUrl, task, setTask, isLoading, startTestDrive, runDemoScenario, setShowMcpModal } =
    useTestDriveContext();
  const navigate = useNavigate();

  const [agentTab, setAgentTab] = useState<'cursor' | 'claude' | 'antigravity' | 'python'>('cursor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunchTestDrive = (customUrl?: string, customTask?: string) => {
    const targetUrl = customUrl || url || 'http://127.0.0.1:3002';
    const targetTask = customTask || task || 'Inspect WebMCP tools and explore state graph transitions';
    startTestDrive(targetUrl, targetTask, 'explore');
    navigate('/explore');
  };

  const handleRunPresetScenario = (enableAddToCart: boolean) => {
    runDemoScenario(enableAddToCart, 'explore');
    navigate('/explore');
  };

  const backendHost =
    env.backendUrl ||
    (window.location.origin.includes('5173')
      ? window.location.origin.replace('5173', '3001')
      : window.location.origin);

  const mcpConfigs = {
    cursor: JSON.stringify(
      {
        mcpServers: {
          'deep-age': {
            url: `${backendHost}/mcp`,
            type: 'sse',
            description: 'Deep Age AI Agent Observability & WebMCP Diagnostics Engine',
          },
        },
      },
      null,
      2
    ),
    claude: JSON.stringify(
      {
        mcpServers: {
          'deep-age': {
            command: 'npx',
            args: ['-y', '@deep-age/mcp-server', '--endpoint', `${backendHost}/mcp`],
          },
        },
      },
      null,
      2
    ),
    antigravity: `# Add Deep Age to your Antigravity (agy) agent:
agy mcp add deep-age --url ${backendHost}/mcp --type sse`,
    python: `# Python / LangChain / LangGraph Agent Integration
from langchain_mcp_adapters import MultiServerMCPClient

client = MultiServerMCPClient({
    "deep_age": {
        "url": "${backendHost}/mcp",
        "transport": "sse"
    }
})
tools = client.get_tools() # ['run_test_drive', 'inspect_url', 'generate_patch']`,
  };

  return (
    <div className="flex flex-col gap-10 font-sans animate-fade-in text-foreground max-w-6xl mx-auto pb-12">
      {/* HERO SECTION */}
      <section className="text-center space-y-6 pt-4 md:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/80 text-xs font-mono shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#5ae561] animate-pulse"></span>
          <span className="text-muted-foreground">Universal Coding Agent Gateway</span>
        </div>

        <div className="space-y-3 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
            Test Any Website with <span className="text-primary underline decoration-border/80">Autonomous AI Agents</span>.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
            Simulate how AI assistants, autonomous bots, and coding agents browse and interact with your website. Pinpoint missing actions, uncover navigation friction, and get instant code fixes.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => handleLaunchTestDrive()}
            className="h-11 px-6 text-sm font-bold gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Live Test-Drive</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowMcpModal(true)}
            className="h-11 px-6 text-sm font-semibold gap-2 rounded-full border-border/80 hover:bg-secondary shadow-2xs transition-all cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-primary" />
            <span>Connect Agent via MCP</span>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/debug')}
            className="h-11 px-5 text-sm font-medium gap-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 cursor-pointer"
          >
            <Bug className="w-4 h-4" />
            <span>Developer Workbench</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>
      </section>

      {/* INTERACTIVE TEST-DRIVE QUICK LAUNCHER */}
      <section className="bg-card border border-border/80 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <h2 className="text-sm font-bold text-foreground">Interactive Website Test-Drive</h2>
            <p className="text-[11px] text-muted-foreground font-mono">Live Browser Simulation • Action & Button Discovery • AI Diagnosis</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider hidden sm:inline">
              Quick Presets:
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRunPresetScenario(false)}
              className="h-7 px-3 text-xs font-medium rounded-full bg-secondary/80 hover:bg-secondary border border-border/60 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#ff8527] mr-1.5"></span>
              Simulate Friction
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRunPresetScenario(true)}
              className="h-7 px-3 text-xs font-medium rounded-full bg-secondary/80 hover:bg-secondary border border-border/60 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#5ae561] mr-1.5"></span>
              Simulate Smooth Pass
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4 flex items-center gap-2 bg-secondary/40 rounded-full px-4 py-2 border border-border/70 focus-within:border-primary/50">
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://your-website.com"
              className="bg-transparent text-xs font-mono outline-none w-full text-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="md:col-span-6 flex items-center gap-2 bg-secondary/40 rounded-full px-4 py-2 border border-border/70 focus-within:border-primary/50">
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Test checkout flow, find documentation, or verify controls"
              className="bg-transparent text-xs outline-none w-full text-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              onClick={() => handleLaunchTestDrive()}
              disabled={isLoading}
              className="w-full h-9 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current mr-1" />
              <span>Run Drive</span>
            </Button>
          </div>
        </div>
      </section>

      {/* CONNECT YOUR CODING AGENT MCP SECTION */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold rounded-full border-border/80">
            MCP Integration Ready
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Connect Deep Age to Your Coding Agent
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Give Cursor, Claude Desktop, Antigravity, or LangChain the power to autonomously test-drive and inspect any URL.
          </p>
        </div>

        <Card className="border-border/80 shadow-lg rounded-3xl p-5 md:p-6 bg-card space-y-4">
          <Tabs value={agentTab} onValueChange={(v) => setAgentTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-10 p-1 bg-secondary/80 rounded-full border border-border/70">
              <TabsTrigger value="cursor" className="text-xs font-semibold rounded-full">
                Cursor / Windsurf
              </TabsTrigger>
              <TabsTrigger value="claude" className="text-xs font-semibold rounded-full">
                Claude Desktop
              </TabsTrigger>
              <TabsTrigger value="antigravity" className="text-xs font-semibold rounded-full">
                Antigravity (agy)
              </TabsTrigger>
              <TabsTrigger value="python" className="text-xs font-semibold rounded-full">
                Python SDK
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <pre className="p-4 bg-[#121212] text-[#fafafa] rounded-2xl text-xs font-mono overflow-x-auto border border-border/80 leading-relaxed">
              {mcpConfigs[agentTab]}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCopy(agentTab, mcpConfigs[agentTab])}
              className="absolute top-3 right-3 h-7 text-xs gap-1.5 shadow-xs font-medium rounded-full bg-secondary/90 hover:bg-secondary cursor-pointer"
            >
              {copiedKey === agentTab ? <Check className="w-3.5 h-3.5 text-[#5ae561]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === agentTab ? 'Copied' : 'Copy Config'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-secondary/30 rounded-2xl border border-border/60 text-xs">
              <span className="font-mono font-bold text-foreground block mb-0.5">run_test_drive</span>
              <p className="text-muted-foreground text-[11px]">Launches browser sandbox on any target URL and returns live diagnostics.</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-2xl border border-border/60 text-xs">
              <span className="font-mono font-bold text-foreground block mb-0.5">inspect_url</span>
              <p className="text-muted-foreground text-[11px]">Discovers registered WebMCP tools, DOM action nodes, and security signals.</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-2xl border border-border/60 text-xs">
              <span className="font-mono font-bold text-foreground block mb-0.5">generate_patch</span>
              <p className="text-muted-foreground text-[11px]">Outputs drop-in WebMCP JavaScript fixes for diagnosed friction.</p>
            </div>
          </div>
        </Card>
      </section>

      {/* 3-STEP PIPELINE */}
      <section className="space-y-6 pt-2">
        <div className="text-center space-y-1">
          <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold rounded-full border-border/80">
            Architecture
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            How Deep Age Test-Drive Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 space-y-2.5 border-border/70 shadow-xs rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs font-mono">
              1
            </div>
            <h3 className="text-sm font-bold text-foreground">Simulate & Observe</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter any URL or staging environment. Deep Age launches a real headless browser session to observe how autonomous agents navigate and interact.
            </p>
          </Card>

          <Card className="p-5 space-y-2.5 border-border/70 shadow-xs rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs font-mono">
              2
            </div>
            <h3 className="text-sm font-bold text-foreground">Diagnose Gaps & Friction</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Discovers interactive controls, evaluates conversion paths, and pinpoints exactly where autonomous AI agents encounter roadblocks.
            </p>
          </Card>

          <Card className="p-5 space-y-2.5 border-border/70 shadow-xs rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs font-mono">
              3
            </div>
            <h3 className="text-sm font-bold text-foreground">Instant Fixes & Exports</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generates drop-in TypeScript code snippets, exports portable state transition models, and connects directly to coding assistants via MCP.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
