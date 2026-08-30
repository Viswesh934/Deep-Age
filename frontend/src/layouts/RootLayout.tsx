import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Sidebar } from '@/components/Sidebar';
import { StartForm } from '@/components/StartForm';
import { Terminal, Copy, Check } from 'lucide-react';
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
        <DialogContent className="max-w-xl border-border/80 bg-card text-foreground shadow-2xl rounded-3xl p-6 font-sans">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#ff8527]" />
                <span>Connect Agent via MCP</span>
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground rounded-full">
                JSON-RPC 2.0
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Add Deep Age to Claude Desktop, Cursor, Antigravity, or LangChain to test-drive web applications.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={mcpTab} onValueChange={(val) => setMcpTab(val as 'remote' | 'cli' | 'tools')} className="w-full space-y-3">
            <TabsList className="grid grid-cols-3 w-full h-9 p-1 bg-secondary/80 rounded-full border border-border/70">
              <TabsTrigger value="remote" className="text-xs font-semibold rounded-full">
                Remote SSE
              </TabsTrigger>
              <TabsTrigger value="cli" className="text-xs font-semibold rounded-full">
                Local Stdio
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs font-semibold rounded-full">
                API Endpoints
              </TabsTrigger>
            </TabsList>

            <div className="relative">
              <pre className="p-3.5 bg-secondary/30 text-foreground rounded-2xl text-[11px] font-mono overflow-x-auto border border-border/80 leading-relaxed max-h-56">
                {activeMcpText}
              </pre>
              <Button
                size="xs"
                variant="outline"
                onClick={handleCopyMcp}
                className="absolute top-2.5 right-2.5 h-7 text-[11px] gap-1 font-medium rounded-full bg-card/90 hover:bg-card border-border/80 cursor-pointer"
              >
                {copiedMcp ? <Check className="w-3 h-3 text-[#5ae561]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMcp ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </Tabs>

          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-muted-foreground font-mono">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60">
              <span className="font-bold text-foreground block text-xs">Cursor IDE</span>
              <span className="text-[10px]">.cursor/mcp.json</span>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60">
              <span className="font-bold text-foreground block text-xs">Claude</span>
              <span className="text-[10px]">claude_desktop_config.json</span>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60">
              <span className="font-bold text-foreground block text-xs">Antigravity</span>
              <span className="text-[10px]">agy mcp add</span>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2 text-xs text-muted-foreground border-t border-border/60">
            <span className="text-[11px]">Direct manifest: <code className="text-foreground font-mono font-medium px-1.5 py-0.5 rounded bg-secondary/80">/mcp.json</code></span>
            <Button
              size="sm"
              onClick={() => setShowMcpModal(false)}
              className="h-8 px-4 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
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
