import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Sidebar } from '@/components/Sidebar';
import { StartForm } from '@/components/StartForm';
import { Terminal, Copy, Check, Globe, Server } from 'lucide-react';
import { env } from '@/config/env';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const RootLayout: React.FC = () => {
  const { isDark, showMcpModal, setShowMcpModal } = useTestDriveContext();
  const [copiedMcp, setCopiedMcp] = useState<boolean>(false);
  const [mcpTab, setMcpTab] = useState<'remote' | 'cli' | 'tools'>('remote');
  const [dynamicMcpConfig, setDynamicMcpConfig] = useState<any>(null);

  useEffect(() => {
    if (showMcpModal) {
      fetch(`${env.backendUrl}/api/mcp/config`)
        .then((res) => res.json())
        .then((data) => setDynamicMcpConfig(data))
        .catch(() => {
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

  return (
    <div className={`min-h-screen flex font-sans ${isDark ? 'dark bg-background text-foreground' : 'bg-slate-50/50 text-foreground'}`}>
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
          {/* Top Control Bench */}
          <StartForm />

          {/* Active Route Page */}
          <Outlet />
        </main>

        {/* Persistent Footer */}
        <footer className="border-t border-border py-3.5 px-6 text-center text-xs text-muted-foreground bg-card font-sans">
          Deep Age • 100% Real Headless Chromium Execution • Chrome WebMCP Specification
        </footer>
      </div>

      {/* MCP Configuration Dialog */}
      <Dialog open={showMcpModal} onOpenChange={setShowMcpModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4 text-primary" />
              Agent MCP Configuration (Deployment Ready)
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Auto-configured for your deployment environment. Add this block into Claude Desktop, Cursor, Antigravity, or LangChain agents to let them inspect websites via Deep Age.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={mcpTab} onValueChange={(val) => setMcpTab(val as 'remote' | 'cli' | 'tools')} className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-9">
              <TabsTrigger value="remote" className="gap-1.5 text-xs">
                <Globe className="w-3.5 h-3.5" />
                Remote MCP (HTTP / SSE)
              </TabsTrigger>
              <TabsTrigger value="cli" className="gap-1.5 text-xs">
                <Server className="w-3.5 h-3.5" />
                Local Stdio (Node CLI)
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-1.5 text-xs">
                <Terminal className="w-3.5 h-3.5" />
                API Endpoints
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative mt-1">
            <pre className="p-4 bg-slate-950 text-slate-200 dark:bg-black rounded-lg text-xs font-mono overflow-x-auto border border-border">
              {activeMcpText}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyMcp}
              className="absolute top-2.5 right-2.5 h-7 text-xs gap-1 shadow-sm font-medium"
            >
              {copiedMcp ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMcp ? 'Copied' : 'Copy Config'}
            </Button>
          </div>

          <Separator className="my-1" />

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full text-xs text-muted-foreground">
            <span>Direct Discovery URL: <code className="text-primary font-mono">/mcp.json</code></span>
            <Button
              size="sm"
              onClick={() => setShowMcpModal(false)}
              className="h-8 px-4 text-xs font-bold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RootLayout;
