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

      {/* Compact, Non-overflowing MCP Dialog */}
      <Dialog open={showMcpModal} onOpenChange={setShowMcpModal}>
        <DialogContent className="max-w-lg border-border/80 bg-card text-foreground shadow-xl rounded-2xl p-5 font-sans">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#ff8527]" />
              <span>Connect Agent (MCP)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add this configuration to Cursor, Claude Desktop, or Antigravity.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={mcpTab} onValueChange={(val) => setMcpTab(val as 'remote' | 'cli' | 'tools')} className="w-full space-y-2.5 my-1">
            <TabsList className="grid grid-cols-3 w-full h-8 p-0.5 bg-secondary/80 rounded-full border border-border/70">
              <TabsTrigger value="remote" className="text-xs font-medium rounded-full h-7">
                Remote SSE
              </TabsTrigger>
              <TabsTrigger value="cli" className="text-xs font-medium rounded-full h-7">
                Local Stdio
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs font-medium rounded-full h-7">
                Endpoints
              </TabsTrigger>
            </TabsList>

            <div className="relative">
              <pre className="p-3 bg-secondary/30 text-foreground rounded-xl text-[11px] font-mono overflow-x-auto border border-border/70 max-h-48 leading-relaxed">
                {activeMcpText}
              </pre>
              <Button
                size="xs"
                variant="outline"
                onClick={handleCopyMcp}
                className="absolute top-2 right-2 h-6 text-[10px] px-2.5 gap-1 font-medium rounded-full bg-card/90 hover:bg-card border-border/80 cursor-pointer shadow-xs"
              >
                {copiedMcp ? <Check className="w-3 h-3 text-[#5ae561]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMcp ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </Tabs>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-1 text-xs text-muted-foreground border-t border-border/60">
            <span className="text-[11px] font-mono">
              Manifest: <code className="text-foreground font-semibold px-1 py-0.5 rounded bg-secondary/80">/mcp.json</code>
            </span>
            <Button
              size="sm"
              onClick={() => setShowMcpModal(false)}
              className="h-7 px-4 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RootLayout;
