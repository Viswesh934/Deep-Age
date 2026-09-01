import React, { useState } from 'react';
import { AgentStateDump, DOMTreeNode, TestDriveRun, TimelineStep } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Check,
  Search,
  Code2,
  Sparkles,
  FileText,
  Download,
} from 'lucide-react';

interface BrowserViewportWithScrubberProps {
  run: TestDriveRun;
}

// Generate ASCII/Unicode Text Tree Diagram
function generateAsciiTreeDiagram(node: DOMTreeNode, prefix = '', isLast = true): string {
  const marker = isLast ? '└── ' : '├── ';
  const tagStr = `<${node.tag}${node.idAttr ? `#${node.idAttr}` : ''}${node.className ? `.${node.className.split(' ')[0]}` : ''}>`;
  const roleStr = node.role ? ` [role="${node.role}"]` : '';
  const actionStr = node.isInteractive ? ' [ACTION]' : '';
  const textStr = node.text ? ` "${node.text}"` : '';

  let output = `${prefix}${marker}${tagStr}${roleStr}${actionStr}${textStr}\n`;

  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  const validChildren = (node.children || []).filter((c) => c && c.tag);

  validChildren.forEach((child, index) => {
    const isChildLast = index === validChildren.length - 1;
    output += generateAsciiTreeDiagram(child, childPrefix, isChildLast);
  });

  return output;
}

export const BrowserViewportWithScrubber: React.FC<BrowserViewportWithScrubberProps> = ({ run }) => {
  const [activeSubTab, setActiveSubTab] = useState<'state_dump' | 'timeline' | 'dom_tree'>('state_dump');

  // State Dump State
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
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedFullJson, setCopiedFullJson] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const activeState = stateDumps[activeStateIndex] || stateDumps[0];

  // Timeline State
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(() =>
    run.timeline && run.timeline.length > 0 ? run.timeline.length - 1 : 0
  );
  const activeStep: TimelineStep | undefined = run.timeline?.[selectedStepIndex];

  // DOM Tree State
  const domTree: DOMTreeNode = run.domTree || {
    id: 'node-root',
    tag: 'BODY',
    selector: 'body',
    isInteractive: false,
    text: 'Root Container',
    children: (run.domInteractions || []).map((c, i) => ({
      id: `node-${i + 1}`,
      tag: c.elementTag,
      selector: c.selector,
      text: c.text,
      isInteractive: true,
      children: [],
    })),
  };
  const [domSearchQuery, setDomSearchQuery] = useState('');
  const [copiedDomText, setCopiedDomText] = useState(false);

  const asciiTree = generateAsciiTreeDiagram(domTree);

  // Helper for Human-Readable State Labels
  const getStateReadableLabel = (dump: AgentStateDump, idx: number): string => {
    if (dump.label) return `Step ${idx + 1}: ${dump.label}`;
    if (idx === 0) return `Step 1: Page Loaded`;
    if (idx === 1) return `Step 2: Filter Applied`;
    if (idx === 2) return `Step 3: Cart Action`;
    return `Step ${idx + 1}: State`;
  };

  // Handlers
  const handleCopyAgentPrompt = () => {
    const prompt = `# Agent Browser State Snapshot (${getStateReadableLabel(activeState, activeStateIndex)})
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
    setCopiedFullJson(true);
    setTimeout(() => setCopiedFullJson(false), 2000);
  };

  const handleCopyDomText = () => {
    navigator.clipboard.writeText(asciiTree);
    setCopiedDomText(true);
    setTimeout(() => setCopiedDomText(false), 2000);
  };

  const handleDownloadDomJson = () => {
    const payload = {
      siteUrl: run.url,
      generatedAt: Date.now(),
      tools: run.tools,
      domTree: domTree,
      interactiveControls: run.domInteractions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dom_tree_${new URL(run.url.startsWith('http') ? run.url : `https://${run.url}`).hostname}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredInteractions = activeState.interactionState.filter((el) =>
    stateSearchQuery
      ? el.ref.toLowerCase().includes(stateSearchQuery.toLowerCase()) ||
        el.name.toLowerCase().includes(stateSearchQuery.toLowerCase()) ||
        el.role.toLowerCase().includes(stateSearchQuery.toLowerCase()) ||
        el.selector.toLowerCase().includes(stateSearchQuery.toLowerCase())
      : true
  );

  const filteredAsciiLines = domSearchQuery
    ? asciiTree.split('\n').filter((line) => line.toLowerCase().includes(domSearchQuery.toLowerCase())).join('\n')
    : asciiTree;

  const getStepColor = (status?: string, isSelected?: boolean) => {
    if (isSelected) return 'bg-[#ff8527] text-white border-[#ff8527] shadow-sm font-bold scale-[1.02]';
    if (status === 'success') return 'bg-secondary/80 border-[#5ae561]/40 text-foreground hover:border-[#5ae561]';
    if (status === 'warning') return 'bg-secondary/80 border-[#ff8527]/40 text-foreground hover:border-[#ff8527]';
    if (status === 'error') return 'bg-secondary/80 border-destructive/50 text-foreground hover:border-destructive';
    return 'bg-secondary/60 border-border/80 text-muted-foreground hover:border-border';
  };

  return (
    <Card className="border-border/80 bg-card rounded-2xl shadow-xs overflow-hidden font-sans text-left">
      {/* 1. SUB-TABS ON TOP */}
      <div className="p-2.5 bg-secondary/50 border-b border-border/70 flex items-center justify-start text-left">
        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/70 text-xs font-mono text-left">
          <button
            onClick={() => setActiveSubTab('state_dump')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-left ${
              activeSubTab === 'state_dump'
                ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            State Dump
          </button>
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-left ${
              activeSubTab === 'timeline'
                ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Timeline Trace ({run.timeline?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('dom_tree')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-left ${
              activeSubTab === 'dom_tree'
                ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            DOM Tree
          </button>
        </div>
      </div>

      {/* 2. HEADER UNDER THE SUB-TABS: Left title/description, Right action buttons */}
      <div className="p-4 bg-muted/15 border-b border-border/60 flex flex-wrap items-center justify-between text-left gap-3">
        <div className="text-left flex-1 min-w-[280px]">
          <h3 className="text-sm font-bold text-foreground text-left">
            {activeSubTab === 'state_dump' && 'Agent Browser State Snapshot'}
            {activeSubTab === 'timeline' && 'Autonomous Execution Timeline'}
            {activeSubTab === 'dom_tree' && 'DOM Component Tree Diagram'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans text-left">
            {activeSubTab === 'state_dump' && `${getStateReadableLabel(activeState, activeStateIndex)} • 5-layer machine snapshot for agent reasoning`}
            {activeSubTab === 'timeline' && 'Step-by-step progression of agent milestones and tool calls'}
            {activeSubTab === 'dom_tree' && 'Structured connection tree of page components and interactive controls'}
          </p>
        </div>

        {/* Buttons to the right with standard colors & icons */}
        <div className="flex items-center gap-2 shrink-0">
          {activeSubTab === 'state_dump' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAgentPrompt}
                className="text-xs font-mono rounded-full h-8 px-3.5 gap-1.5 cursor-pointer hover:border-[#ff8527]/50"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-[#5ae561]" /> : <Sparkles className="w-3.5 h-3.5 text-[#ff8527]" />}
                <span>{copiedPrompt ? 'Copied Prompt' : 'Copy Agent Snapshot'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFullJson}
                className="text-xs font-mono rounded-full h-8 px-3.5 gap-1.5 cursor-pointer hover:border-indigo-400/50"
              >
                {copiedFullJson ? <Check className="w-3.5 h-3.5 text-[#5ae561]" /> : <Code2 className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{copiedFullJson ? 'Copied JSON' : 'Copy Full JSON'}</span>
              </Button>
            </>
          )}

          {activeSubTab === 'dom_tree' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyDomText}
                className="text-xs font-mono rounded-full h-8 px-3.5 gap-1.5 cursor-pointer"
              >
                {copiedDomText ? <Check className="w-3.5 h-3.5 text-[#5ae561]" /> : <FileText className="w-3.5 h-3.5 text-primary" />}
                <span>{copiedDomText ? 'Copied Tree' : 'Copy Tree'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDomJson}
                className="text-xs font-mono rounded-full h-8 px-3.5 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 3. FILTERS BAR (STYLED SHADCN DROPDOWNS & VISIBLE SEARCH) */}
      <div className="p-3 bg-secondary/25 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 text-left">
        {activeSubTab === 'state_dump' && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full text-left">
            <div className="flex flex-wrap items-center gap-2.5 text-left">
              {/* Shadcn Milestone Select */}
              <div className="flex items-center gap-1.5 text-xs font-mono text-left">
                <span className="text-muted-foreground font-sans text-xs shrink-0">Milestone:</span>
                <Select
                  value={String(activeStateIndex)}
                  onValueChange={(val) => {
                    setActiveStateIndex(Number(val));
                    setSelectedRef(null);
                  }}
                >
                  <SelectTrigger className="h-8 w-[190px] text-xs font-mono bg-background">
                    <SelectValue placeholder="Select Milestone" />
                  </SelectTrigger>
                  <SelectContent className="text-xs font-mono">
                    {stateDumps.map((dump, idx) => (
                      <SelectItem key={dump.id || idx} value={String(idx)}>
                        {getStateReadableLabel(dump, idx)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shadcn Layer Select */}
              <div className="flex items-center gap-1.5 text-xs font-mono text-left">
                <span className="text-muted-foreground font-sans text-xs shrink-0">Layer:</span>
                <Select
                  value={activeLayer}
                  onValueChange={(val) => setActiveLayer(val as 'all' | 'interaction')}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs font-mono bg-background">
                    <SelectValue placeholder="Select Layer" />
                  </SelectTrigger>
                  <SelectContent className="text-xs font-mono">
                    <SelectItem value="all">All 5 Machine Layers</SelectItem>
                    <SelectItem value="interaction">
                      Refs ({activeState.interactionState.length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ref Search Input */}
            <div className="flex items-center bg-background border border-border/70 rounded-xl px-3 py-1 text-xs flex-1 max-w-[280px] min-w-[190px] h-8 shadow-xs">
              <Search className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0" />
              <input
                type="text"
                placeholder="Search refs (e.g. e17, button)..."
                value={stateSearchQuery}
                onChange={(e) => setStateSearchQuery(e.target.value)}
                className="bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-xs font-mono w-full"
              />
              {stateSearchQuery && (
                <button
                  onClick={() => setStateSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground text-[10px] ml-1 shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'timeline' && (
          <div className="flex items-center justify-between w-full text-xs font-mono">
            <span className="text-muted-foreground font-sans">
              Step-by-step sequential timeline of agent actions and tool calls.
            </span>
            <Badge variant="outline" className="text-[11px] font-mono border-border/80 h-7 px-2.5 flex items-center">
              {run.timeline?.length || 0} Steps Executed
            </Badge>
          </div>
        )}

        {activeSubTab === 'dom_tree' && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full text-left">
            <span className="text-muted-foreground font-sans text-xs">
              Hierarchical connection tree of page components and interactive controls.
            </span>

            {/* DOM Filter Input */}
            <div className="flex items-center bg-background border border-border/70 rounded-xl px-3 py-1 text-xs flex-1 max-w-[280px] min-w-[190px] h-8 shadow-xs">
              <Search className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0" />
              <input
                type="text"
                placeholder="Filter tag, class, or text..."
                value={domSearchQuery}
                onChange={(e) => setDomSearchQuery(e.target.value)}
                className="bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-xs font-mono w-full"
              />
              {domSearchQuery && (
                <button
                  onClick={() => setDomSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground text-[10px] ml-1 shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. SUB-TAB BODY CONTENT */}
      {activeSubTab === 'state_dump' && (
        <CardContent className="p-4 space-y-4 text-left">
          {/* Page & UI State */}
          {activeLayer === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-left">
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 space-y-1 text-left">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block text-left">
                  Page Layer
                </span>
                <p className="text-foreground truncate text-left">
                  <span className="text-muted-foreground">Title:</span> {activeState.page.title || 'Untitled'}
                </p>
                <p className="text-muted-foreground truncate text-left">
                  <span className="text-muted-foreground">URL:</span> {activeState.page.url}
                </p>
                <p className="text-muted-foreground text-left">
                  <span className="text-muted-foreground">Viewport:</span> {activeState.page.viewport.width} × {activeState.page.viewport.height}px
                </p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 space-y-1 text-left">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block text-left">
                  UI State Layer
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-left">
                  <p className="text-foreground text-left">
                    <span className="text-muted-foreground">Scroll:</span> x={activeState.uiState.scroll.x}, y={activeState.uiState.scroll.y}
                  </p>
                  <p className="text-foreground text-left">
                    <span className="text-muted-foreground">Focused:</span>{' '}
                    <span className="font-bold text-[#ff8527]">{activeState.uiState.focusedRef || 'None'}</span>
                  </p>
                  <p className="text-foreground text-left">
                    <span className="text-muted-foreground">Dialogs:</span> {activeState.uiState.dialogs.length} Open
                  </p>
                  <p className="text-foreground text-left">
                    <span className="text-muted-foreground">Status:</span> {activeState.uiState.loading ? 'Loading' : 'Ready'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actionable Element Refs Grid */}
          <div className="space-y-2 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block text-left">
              Actionable Element Refs ({filteredInteractions.length})
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-left">
              {filteredInteractions.map((el) => {
                const isFocused = activeState.uiState.focusedRef === el.ref;
                const isSelected = selectedRef === el.ref;

                return (
                  <div
                    key={el.ref}
                    onClick={() => setSelectedRef(el.ref)}
                    className={`p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer space-y-1 text-left ${
                      isSelected
                        ? 'border-[#ff8527] bg-secondary ring-1 ring-[#ff8527]'
                        : isFocused
                        ? 'border-[#ff8527]/60 bg-[#ff8527]/5'
                        : 'border-border/60 bg-secondary/20 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-left">
                      <div className="flex items-center gap-1.5 text-left">
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

                    <p className="text-foreground font-sans text-xs truncate font-medium text-left">
                      {el.name}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 text-left">
                      <span className="truncate max-w-[140px] text-left">{el.selector}</span>
                      <span>{el.enabled ? 'enabled' : 'disabled'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Ref Action Playground */}
          {selectedRef && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-[#ff8527]/40 text-xs font-mono space-y-2 text-left">
              <div className="flex items-center justify-between text-left">
                <div className="flex items-center gap-2 text-left">
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

              <div className="bg-background/80 p-2 rounded-lg border border-border/60 text-neutral-300 text-[11px] space-y-1 text-left">
                <p className="text-left">
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
      )}

      {activeSubTab === 'timeline' && (
        <CardContent className="p-4 space-y-3 text-left">
          {/* Horizontal Timeline Flow */}
          <div className="flex flex-wrap items-center gap-2 text-left">
            {run.timeline?.map((step, idx) => {
              const isSelected = selectedStepIndex === idx;
              const isLast = idx === (run.timeline?.length || 0) - 1;

              return (
                <React.Fragment key={step.id || idx}>
                  <button
                    type="button"
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all cursor-pointer text-left ${getStepColor(
                      step.status,
                      isSelected
                    )}`}
                  >
                    <span className="font-mono font-bold text-[11px]">#{idx + 1}</span>
                    <span className="truncate max-w-[140px] font-sans">{step.label}</span>
                    {step.durationMs && (
                      <span className={`text-[9px] font-mono px-1 py-0 rounded ${isSelected ? 'bg-black/20 text-white' : 'text-muted-foreground'}`}>
                        +{step.durationMs}ms
                      </span>
                    )}
                  </button>

                  {!isLast && (
                    <span className="text-muted-foreground/40 text-xs select-none">➔</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Active Step Details */}
          {activeStep && (
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3 text-xs font-mono text-left">
              <div className="flex items-center gap-2 overflow-hidden text-left">
                <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-border/80 shrink-0">
                  {activeStep.phase}
                </Badge>
                <span className="font-bold text-foreground truncate">{activeStep.label}:</span>
                <span className="text-muted-foreground truncate font-sans text-[11px]">{activeStep.detail}</span>
              </div>

              <div className="text-[10px] text-muted-foreground shrink-0">
                {new Date(activeStep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          )}
        </CardContent>
      )}

      {activeSubTab === 'dom_tree' && (
        <CardContent className="p-4 text-left">
          <div className="p-4 bg-zinc-950 text-neutral-200 font-mono text-xs overflow-x-auto max-h-[460px] rounded-xl leading-relaxed select-text text-left border border-border/60">
            <pre className="whitespace-pre font-mono text-[11px] text-left text-neutral-300">
              {filteredAsciiLines || 'No matching elements found.'}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default BrowserViewportWithScrubber;
