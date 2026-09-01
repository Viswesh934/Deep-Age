import React, { useState } from 'react';
import { DOMTreeNode, TestDriveRun } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DOMFamilyTreeProps {
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

// Generate Mermaid Tree Diagram
function generateMermaidTree(node: DOMTreeNode): string {
  const lines: string[] = ['graph TD', '  %% DOM Connection Tree'];
  let count = 0;

  function traverse(n: DOMTreeNode, parentId?: string) {
    count++;
    const currentId = `node_${count}`;
    const cleanTag = n.tag + (n.idAttr ? `#${n.idAttr}` : '');
    const cleanText = n.text ? ` (${n.text.slice(0, 25)})` : '';
    const label = `${cleanTag}${cleanText}`.replace(/"/g, "'");

    lines.push(`  ${currentId}["${label}"]`);
    if (parentId) {
      lines.push(`  ${parentId} --> ${currentId}`);
    }

    if (n.children && n.children.length > 0) {
      n.children.forEach((child) => traverse(child, currentId));
    }
  }

  traverse(node);
  return lines.join('\n');
}

export const DOMFamilyTree: React.FC<DOMFamilyTreeProps> = ({ run }) => {
  const [diagramMode, setDiagramMode] = useState<'text_tree' | 'mermaid'>('text_tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedMermaid, setCopiedMermaid] = useState(false);

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

  const asciiTree = generateAsciiTreeDiagram(domTree);
  const mermaidTree = generateMermaidTree(domTree);

  const handleCopyTextTree = () => {
    navigator.clipboard.writeText(asciiTree);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidTree);
    setCopiedMermaid(true);
    setTimeout(() => setCopiedMermaid(false), 2000);
  };

  const handleDownloadJson = () => {
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

  // Filter lines if search query is active
  const filteredAsciiLines = searchQuery
    ? asciiTree.split('\n').filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase())).join('\n')
    : asciiTree;

  return (
    <Card className="border-border/80 bg-card rounded-2xl shadow-xs overflow-hidden font-sans text-left">
      {/* 1. Left-Aligned Header */}
      <CardHeader className="p-4 bg-muted/20 border-b border-border/60 flex flex-wrap items-center justify-between text-left space-y-0">
        <div className="text-left">
          <CardTitle className="text-sm font-semibold text-foreground text-left">
            DOM Tree Diagram
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans text-left">
            Structured connection tree of page components and interactive controls
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTextTree}
            className="text-xs font-mono rounded-full h-7 px-3.5"
          >
            {copiedText ? 'Copied Tree!' : 'Copy Tree'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMermaid}
            className="text-xs font-mono rounded-full h-7 px-3.5"
          >
            {copiedMermaid ? 'Copied Mermaid!' : 'Copy Mermaid'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJson}
            className="text-xs font-mono rounded-full h-7 px-3.5"
          >
            Download JSON
          </Button>
        </div>
      </CardHeader>

      {/* 2. Left Sub-Tabs and Right Search */}
      <div className="p-3 bg-secondary/30 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 text-left">
        {/* Left Sub-Tabs */}
        <div className="flex items-center bg-background p-1 rounded-xl border border-border/70 text-xs font-mono">
          <button
            onClick={() => setDiagramMode('text_tree')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              diagramMode === 'text_tree'
                ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tree Diagram
          </button>
          <button
            onClick={() => setDiagramMode('mermaid')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              diagramMode === 'mermaid'
                ? 'bg-[#ff8527] text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mermaid Diagram
          </button>
        </div>

        {/* Right Search Box */}
        <div className="flex items-center bg-background border border-border/70 rounded-full px-3 py-1 text-xs">
          <input
            type="text"
            placeholder="Filter elements, tags, selectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-xs font-mono w-48"
          />
        </div>
      </div>

      {/* 3. Text Diagram Content Box */}
      <CardContent className="p-0 text-left">
        {diagramMode === 'text_tree' ? (
          <div className="p-4 bg-zinc-950 text-neutral-200 font-mono text-xs overflow-x-auto max-h-[420px] leading-relaxed select-text text-left">
            <pre className="whitespace-pre font-mono text-[11px] text-left text-neutral-300">
              {filteredAsciiLines || 'No matching elements found.'}
            </pre>
          </div>
        ) : (
          <div className="p-4 bg-zinc-950 text-neutral-200 font-mono text-xs overflow-x-auto max-h-[420px] leading-relaxed select-text text-left">
            <pre className="whitespace-pre font-mono text-[11px] text-left text-[#5ae561]">
              {mermaidTree}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DOMFamilyTree;
