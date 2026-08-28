import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';

export const RootLayout: React.FC = () => {
  const { isDark, showMcpModal, setShowMcpModal } = useTestDriveContext();
  const [copiedMcp, setCopiedMcp] = useState<boolean>(false);
  const [mcpTab, setMcpTab] = useState<'remote' | 'cli' | 'tools'>('remote');
  const [dynamicMcpConfig, setDynamicMcpConfig] = useState<any>(null);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

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
    <div className={`min-h-screen flex font-sans ${isDark ? 'dark bg-background text-foreground' : 'bg-[#faf9f5] text-foreground'}`}>
      {/* Persistent Sticky Left Sidebar */}
      <Sidebar />

      {/* Main Total Scroll Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        {/* Full Document Flow Content */}
        <main className={`flex-1 p-4 md:p-6 ${isLandingPage ? 'pb-12' : 'pb-40'} max-w-7xl w-full mx-auto`}>
          <Outlet />
        </main>

        {/* Floating Bottom AI Chat / Command Prompt Bar (Hidden on Landing Page) */}
        {!isLandingPage && (
          <div className="sticky bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none z-30 mt-auto">
            <div className="max-w-5xl mx-auto pointer-events-auto">
              <StartForm />
            </div>
          </div>
        )}
      </div>

      {/* MCP Configuration Dialog */}
      <Dialog open={showMcpModal} onOpenChange={setShowMcpModal}>
        <DialogContent className="max-w-2xl border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl rounded-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2.5 text-sm font-bold">
                <span className="p-1.5 rounded-full bg-primary text-primary-foreground">
                  <Terminal className="w-3.5 h-3.5" />
                </span>
                Agent MCP Configuration (Model Context Protocol)
              </DialogTitle>
              <Badge variant="success" className="font-mono text-[10px] rounded-full">
                ● SSE & Stdio Ready
              </Badge>
            </div>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground mt-1">
              Auto-configured for your deployment environment. Add this block into Claude Desktop, Cursor, Antigravity, or LangChain agents to let them inspect websites via Deep Age.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={mcpTab} onValueChange={(val) => setMcpTab(val as 'remote' | 'cli' | 'tools')} className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-10 p-1 bg-secondary/80 rounded-full border border-border/70">
              <TabsTrigger value="remote" className="gap-1.5 text-xs font-mono font-semibold rounded-full">
                <Globe className="w-3.5 h-3.5" />
                Remote MCP
              </TabsTrigger>
              <TabsTrigger value="cli" className="gap-1.5 text-xs font-mono font-semibold rounded-full">
                <Server className="w-3.5 h-3.5" />
                Local Stdio
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-1.5 text-xs font-mono font-semibold rounded-full">
                <Terminal className="w-3.5 h-3.5" />
                API Endpoints
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative mt-2">
            <pre className="p-4 bg-[#121212] text-[#fafafa] rounded-2xl text-xs font-mono overflow-x-auto border border-border/80 leading-relaxed max-h-64">
              {activeMcpText}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyMcp}
              className="absolute top-3 right-3 h-7 text-xs gap-1.5 shadow-xs font-medium rounded-full bg-secondary/90 hover:bg-secondary"
            >
              {copiedMcp ? <Check className="w-3.5 h-3.5 text-[#5ae561]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMcp ? 'Copied' : 'Copy Config'}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-muted-foreground font-mono">
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/70">
              <span className="font-bold text-foreground block">Claude Desktop</span>
              <span>claude_desktop_config.json</span>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/70">
              <span className="font-bold text-foreground block">Cursor IDE</span>
              <span>.cursor/mcp.json</span>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/70">
              <span className="font-bold text-foreground block">Antigravity</span>
              <span>agy mcp add</span>
            </div>
          </div>

          <Separator className="my-1 border-border/60" />

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full text-xs text-muted-foreground">
            <span>Direct Discovery URL: <code className="text-primary font-mono font-medium px-1.5 py-0.5 rounded-md bg-secondary/80">/mcp.json</code></span>
            <Button
              size="sm"
              onClick={() => setShowMcpModal(false)}
              className="h-8 px-5 text-xs font-semibold rounded-full"
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

