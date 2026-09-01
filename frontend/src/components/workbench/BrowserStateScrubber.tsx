import React, { useState } from 'react';
import { AgentStateDump, TestDriveRun } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface BrowserStateScrubberProps {
  run: TestDriveRun;
}

export const BrowserStateScrubber: React.FC<BrowserStateScrubberProps> = ({ run }) => {
  // Fallback state dump if run.stateDumps is not yet populated
  const stateDumps: AgentStateDump[] = run.stateDumps && run.stateDumps.length > 0
    ? run.stateDumps
    : [
        {
          id: 'state_001',
          stateIndex: 1,
          timestamp: run.createdAt,
          label: 'Initial Page Loaded',
          page: {
            url: run.url,
            title: 'Storefront',
            viewport: { width: 1440, height: 900 },
          },
          uiState: {
            scroll: { x: 0, y: 0 },
            focusedRef: 'e4',
            dialogs: [],
            loading: false,
          },
          semanticTree: [
            { ref: 'e1', role: 'banner', name: 'Header Navigation', level: 1, visible: true },
            { ref: 'e2', role: 'heading', name: 'Product Catalog', level: 1, visible: true },
            { ref: 'e3', role: 'region', name: 'Filter Bar', visible: true },
            { ref: 'e4', role: 'main', name: 'Product Grid', visible: true },
          ],
          interactionState: (run.domInteractions || []).slice(0, 8).map((c, i) => ({
            ref: `e${i + 5}`,
            role: c.elementTag === 'INPUT' ? 'textbox' : 'button',
            name: c.text || c.selector,
            value: '',
            visible: true,
            enabled: true,
            actions: c.elementTag === 'INPUT' ? ['fill', 'focus'] : ['click'],
            selector: c.selector,
          })),
          environment: {
            cookieCount: 2,
            localStorageKeys: ['session_id'],
            online: true,
            discoveredTools: run.tools.map((t) => t.name),
          },
        },
      ];

  const [activeStateIndex, setActiveStateIndex] = useState<number>(stateDumps.length - 1);
  const [activeLayer, setActiveLayer] = useState<'all' | 'interaction'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const activeState = stateDumps[activeStateIndex] || stateDumps[0];

  const handleCopyAgentPrompt = () => {
    const prompt = `# Agent Browser State Snapshot (${activeState.id.toUpperCase()})
Goal: ${run.task}
Target URL: ${activeState.page.url}

\`\`\`json
${JSON.stringify(
  {
    page: activeState.page,
    state: activeState.uiState,
    elements: activeState.interactionState.map((el) => ({
      ref: el.ref,
      role: el.role,
      name: el.name,
      value: el.value || undefined,
      enabled: el.enabled,
      visible: el.visible,
      actions: el.actions,
    })),
    tools: activeState.environment.discoveredTools,
  },
  null,
  2
)}
\`\`\`
`;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyFullJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeState, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const filteredInteractions = activeState.interactionState.filter((el) =>
    searchQuery
      ? el.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.selector.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <Card className="border-border/80 bg-card rounded-2xl shadow-xs overflow-hidden font-sans text-left">
      {/* 1. Left-Aligned Header */}
      <CardHeader className="p-4 bg-muted/20 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 space-y-0 text-left">
        <div>
          <CardTitle className="text-sm font-semibold text-foreground text-left">
            Agent Browser State Dump
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans text-left">
            Compact 5-layer machine snapshot ({activeState.id}) for agent pathfinding and ref actions
          </p>
        </div>

        {/* Right-Aligned Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAgentPrompt}
            className="text-xs font-mono rounded-full h-7 px-3.5"
          >
            {copiedPrompt ? 'Copied Prompt!' : 'Copy Agent Snapshot'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFullJson}
            className="text-xs font-mono rounded-full h-7 px-3.5"
          >
            {copiedJson ? 'Copied JSON!' : 'Copy Full JSON'}
          </Button>
        </div>
      </CardHeader>

      {/* 2. Sub-Tabs & Filter Toolbar (Sub-tabs on left, filters/actions on right) */}
      <div className="p-3 bg-secondary/30 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 text-left">
        {/* Left State & Layer Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* State Timeline Stepper */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/70 text-xs font-mono">
            {stateDumps.map((dump, idx) => {
              const isSelected = activeStateIndex === idx;
              return (
                <button
                  key={dump.id || idx}
                  onClick={() => {
                    setActiveStateIndex(idx);
                    setSelectedRef(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {dump.id.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Layer Switcher */}
          <div className="flex items-center bg-background p-1 rounded-xl border border-border/70 text-xs font-mono">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeLayer === 'all' ? 'bg-[#ff8527] text-white font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Layers
            </button>
            <button
              onClick={() => setActiveLayer('interaction')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeLayer === 'interaction' ? 'bg-[#ff8527] text-white font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Refs ({activeState.interactionState.length})
            </button>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="flex items-center bg-background border border-border/70 rounded-full px-3 py-1 text-xs">
          <input
            type="text"
            placeholder="Filter refs (e.g. e17, pay, input)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-xs font-mono w-44"
          />
        </div>
      </div>

      {/* 3. Main State Content */}
      <CardContent className="p-4 space-y-4 text-left">
        {/* Layer 1 & 2: Page and UI State */}
        {activeLayer === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Page Box */}
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Page Layer
              </span>
              <p className="text-foreground truncate">
                <span className="text-muted-foreground">Title:</span> {activeState.page.title || 'Untitled'}
              </p>
              <p className="text-muted-foreground truncate">
                <span className="text-muted-foreground">URL:</span> {activeState.page.url}
              </p>
              <p className="text-muted-foreground">
                <span className="text-muted-foreground">Viewport:</span> {activeState.page.viewport.width} × {activeState.page.viewport.height}px
              </p>
            </div>

            {/* UI State Box */}
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                UI State Layer
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <p className="text-foreground">
                  <span className="text-muted-foreground">Scroll:</span> x={activeState.uiState.scroll.x}, y={activeState.uiState.scroll.y}
                </p>
                <p className="text-foreground">
                  <span className="text-muted-foreground">Focused:</span>{' '}
                  <span className="font-bold text-[#ff8527]">{activeState.uiState.focusedRef || 'None'}</span>
                </p>
                <p className="text-foreground">
                  <span className="text-muted-foreground">Dialogs:</span> {activeState.uiState.dialogs.length} Open
                </p>
                <p className="text-foreground">
                  <span className="text-muted-foreground">Status:</span> {activeState.uiState.loading ? 'Loading' : 'Ready'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layer 4: Interaction Elements (The core ref-based table) */}
        {(activeLayer === 'all' || activeLayer === 'interaction') && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">
              Actionable Element Refs
            </span>

            {/* Elements Table / Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredInteractions.map((el) => {
                const isFocused = activeState.uiState.focusedRef === el.ref;
                const isSelected = selectedRef === el.ref;

                return (
                  <div
                    key={el.ref}
                    onClick={() => setSelectedRef(el.ref)}
                    className={`p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'border-[#ff8527] bg-secondary ring-1 ring-[#ff8527]'
                        : isFocused
                        ? 'border-[#ff8527]/60 bg-[#ff8527]/5'
                        : 'border-border/60 bg-secondary/20 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold px-1.5 py-0.2 rounded bg-background border border-border text-[#ff8527] text-[10px]">
                          {el.ref}
                        </span>
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">
                          {el.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {el.actions.map((act) => (
                          <span
                            key={act}
                            className="text-[9px] px-1 py-0 rounded bg-background border border-border text-muted-foreground font-sans uppercase"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-foreground font-sans text-xs truncate font-medium">
                      {el.name}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <span className="truncate max-w-[140px]">{el.selector}</span>
                      <span>{el.enabled ? 'enabled' : 'disabled'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Ref Reasoning Playground */}
        {selectedRef && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-[#ff8527]/40 text-xs font-mono space-y-2 text-left">
            <div className="flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#ff8527]">Action Syntax for {selectedRef}:</span>
                <span className="text-muted-foreground text-[11px]">
                  {activeState.interactionState.find((e) => e.ref === selectedRef)?.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedRef(null)}
                className="text-muted-foreground hover:text-foreground text-[11px] cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-background/80 p-2 rounded-lg border border-border/60 text-neutral-300 text-[11px] space-y-1">
              <p>
                <span className="text-[#5ae561]">Agent Action:</span>{' '}
                <code className="text-foreground">
                  {activeState.interactionState.find((e) => e.ref === selectedRef)?.actions.includes('fill')
                    ? `fill("${selectedRef}", "value")`
                    : `click("${selectedRef}")`}
                </code>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrowserStateScrubber;
