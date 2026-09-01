import React, { useState } from 'react';
import { DOMTreeNode, TestDriveRun } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  Code2,
  FileText,
} from 'lucide-react';

interface DOMTreeViewerProps {
  run: TestDriveRun;
}

function generateMarkdownWireframe(node: DOMTreeNode, indent = 0): string {
  const pad = '  '.repeat(indent);
  const tagInfo = `<${node.tag}${node.idAttr ? `#${node.idAttr}` : ''}${node.className ? `.${node.className.replace(/\s+/g, '.')}` : ''}>`;
  const roleInfo = node.role ? ` [role="${node.role}"]` : '';
  const interactiveInfo = node.isInteractive ? ' [INTERACTIVE]' : '';
  const textInfo = node.text ? ` "${node.text}"` : '';
  const ariaInfo = node.ariaLabel ? ` (aria: "${node.ariaLabel}")` : '';

  let line = `${pad}- ${tagInfo}${roleInfo}${interactiveInfo}${textInfo}${ariaInfo}`;
  if (node.children && node.children.length > 0) {
    const childLines = node.children.map(c => generateMarkdownWireframe(c, indent + 1)).join('\n');
    return `${line}\n${childLines}`;
  }
  return line;
}

export const DOMTreeViewer: React.FC<DOMTreeViewerProps> = ({ run }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'node-root': true,
    'node-1': true,
    'node-2': true,
    'node-3': true,
  });

  const domTree: DOMTreeNode = run.domTree || {
    id: 'node-root',
    tag: 'BODY',
    selector: 'body',
    isInteractive: false,
    text: 'Body container',
    children: (run.domInteractions || []).map((c, i) => ({
      id: `node-${i + 1}`,
      tag: c.elementTag,
      selector: c.selector,
      text: c.text,
      isInteractive: true,
      children: [],
    })),
  };

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    function collect(n: DOMTreeNode) {
      all[n.id] = true;
      if (n.children) n.children.forEach(collect);
    }
    collect(domTree);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({ [domTree.id]: true });
  };

  const handleCopyAgentPrompt = () => {
    const wireframe = generateMarkdownWireframe(domTree);
    const agentPrompt = `# AI Agent Accessibility & DOM Tree Context
Website: ${run.url}
Discovered Tools: ${run.tools.map(t => t.name).join(', ') || 'None'}
Timestamp: ${new Date().toISOString()}

Use this hierarchical DOM connection tree to locate actionable selectors, understand parent-child relationships, and execute browser actions:

\`\`\`markdown
${wireframe}
\`\`\`

## JSON Hierarchy Schema:
\`\`\`json
${JSON.stringify(domTree, null, 2)}
\`\`\`
`;
    navigator.clipboard.writeText(agentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const payload = {
      siteUrl: run.url,
      generatedAt: Date.now(),
      tools: run.tools,
      domHierarchy: domTree,
      domInteractiveControls: run.domInteractions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_dom_tree_${new URL(run.url.startsWith('http') ? run.url : `https://${run.url}`).hostname}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const wireframe = generateMarkdownWireframe(domTree);
    const doc = `# Hierarchical DOM Wireframe for AI Agents
Target URL: ${run.url}
Generated: ${new Date().toISOString()}

${wireframe}
`;
    const blob = new Blob([doc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dom_wireframe_${new URL(run.url.startsWith('http') ? run.url : `https://${run.url}`).hostname}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderNode = (node: DOMTreeNode, depth = 0): React.ReactNode => {
    const isExpanded = expandedNodes[node.id] !== false;
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = searchQuery
      ? (node.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (node.text && node.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
         (node.selector && node.selector.toLowerCase().includes(searchQuery.toLowerCase())))
      : true;

    return (
      <div key={node.id} className="font-mono text-xs select-none">
        <div
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer ${
            node.isInteractive ? 'bg-[#ff8527]/5 border-l-2 border-[#ff8527]' : ''
          } ${!matchesSearch ? 'opacity-30' : ''}`}
          style={{ paddingLeft: `${depth * 18 + 8}px` }}
        >
          {hasChildren ? (
            <button className="text-muted-foreground hover:text-foreground">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5 h-3.5 inline-block text-muted-foreground/30 text-center">•</span>
          )}

          {/* Node Tag */}
          <span className={`font-bold uppercase text-[11px] ${node.isInteractive ? 'text-[#ff8527]' : 'text-neutral-200'}`}>
            &lt;{node.tag}&gt;
          </span>

          {/* Selector / ID / Class Badge */}
          {node.idAttr && (
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
              #{node.idAttr}
            </span>
          )}

          {node.role && (
            <span className="text-[9px] text-[#5ae561] bg-[#5ae561]/10 px-1.5 py-0.2 rounded font-sans uppercase">
              role="{node.role}"
            </span>
          )}

          {node.isInteractive && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#ff8527]/40 text-[#ff8527]">
              interactive
            </Badge>
          )}

          {/* Direct Text snippet */}
          {node.text && (
            <span className="text-[11px] text-muted-foreground truncate max-w-xs italic">
              "{node.text}"
            </span>
          )}
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5 border-l border-border/40 ml-3">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border/80 bg-card shadow-xs rounded-2xl overflow-hidden font-sans">
      {/* Header & Export Controls */}
      <div className="p-4 bg-muted/20 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#ff8527]" />
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              Hierarchical DOM Tree & Connections
            </h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              Structured parent-child connection graph designed for LLM prompts and autonomous browser agents
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAgentPrompt}
            className="text-xs font-mono gap-1.5 rounded-full h-8 px-3.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#5ae561]" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
            <span>{copied ? 'Copied for AI Agent!' : 'Copy for AI Agent'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJson}
            className="text-xs font-mono gap-1.5 rounded-full h-8 px-3.5"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="text-xs font-mono gap-1.5 rounded-full h-8 px-3.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#5ae561]" />
            <span>Download MD</span>
          </Button>
        </div>
      </div>

      {/* Search & Collapse Controls */}
      <div className="p-3 border-b border-border/60 bg-secondary/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-background border border-border/70 rounded-full px-3 py-1 text-xs max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tags, text, selectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-xs font-mono w-full"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button onClick={expandAll} className="text-muted-foreground hover:text-foreground underline cursor-pointer text-[11px]">
            Expand All
          </button>
          <span className="text-muted-foreground">•</span>
          <button onClick={collapseAll} className="text-muted-foreground hover:text-foreground underline cursor-pointer text-[11px]">
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree Content Container */}
      <div className="p-4 max-h-[460px] overflow-y-auto bg-background/80">
        {renderNode(domTree)}
      </div>
    </Card>
  );
};

export default DOMTreeViewer;
