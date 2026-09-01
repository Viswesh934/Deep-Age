import React, { useState, useEffect } from 'react';
import { StateTransitionGraph } from '@/types';
import { ArrowRight, Lock, CheckCircle2, Download } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface StateGraphViewerProps {
  graph?: StateTransitionGraph;
}

export const StateGraphViewer: React.FC<StateGraphViewerProps> = ({ graph }) => {
  const initialKey = graph?.initialState || (graph?.states ? Object.keys(graph.states)[0] : 'ENTRY_HUB');
  const [selectedState, setSelectedState] = useState<string>(initialKey);

  useEffect(() => {
    if (graph?.states) {
      const keys = Object.keys(graph.states);
      if (graph.initialState && graph.states[graph.initialState]) {
        setSelectedState(graph.initialState);
      } else if (keys.length > 0 && !graph.states[selectedState]) {
        setSelectedState(keys[0]);
      }
    }
  }, [graph]);

  const handleDownloadGraph = () => {
    if (!graph) return;
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state_graph_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!graph || !graph.states || Object.keys(graph.states).length === 0) {
    return (
      <Card className="bg-card border-border/80 text-muted-foreground p-6 text-center rounded-2xl text-xs">
        No state transition graph generated for this site.
      </Card>
    );
  }

  const activeNode = graph.states[selectedState] || Object.values(graph.states)[0];

  return (
    <div className="space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            State Transition Graph
          </h3>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            Finite-state transition model mapping site capabilities and guards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={handleDownloadGraph}
            className="text-[11px] font-semibold h-7 rounded-full gap-1 border-border/80 hover:bg-secondary cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Graph (.json)</span>
          </Button>
          <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground rounded-full">
            FSM v{graph.version || '2.0'}
          </Badge>
        </div>
      </div>

      {/* State Node Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(graph.states).map(([stateId, node]) => {
          const isSelected = stateId === selectedState;
          return (
            <button
              key={stateId}
              onClick={() => setSelectedState(stateId)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-secondary/90 border-[#ff8527]/50 text-foreground shadow-xs'
                  : 'bg-card border-border/70 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              <div className="text-xs font-semibold truncate">{node.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{node.availableTools.length} tool(s) active</div>
            </button>
          );
        })}
      </div>

      {/* Detailed Node View */}
      {activeNode && (
        <Card className="bg-card border-border/80 rounded-2xl shadow-xs">
          <CardHeader className="px-4 py-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span>{activeNode.label}</span>
                  <code className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                    {activeNode.routePath || '/'}
                  </code>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">{activeNode.description}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            {/* Active Tools on this state */}
            <div>
              <div className="text-[11px] font-semibold text-[#5ae561] flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Available Tools in this State ({activeNode.availableTools.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeNode.availableTools.map((tool) => (
                  <span
                    key={tool}
                    className="text-[11px] font-mono bg-secondary/50 border border-border/70 text-foreground px-2 py-0.5 rounded-md"
                  >
                    {tool}()
                  </span>
                ))}
              </div>
            </div>

            {/* Blocked Tools / Prerequisites */}
            {activeNode.blockedTools && activeNode.blockedTools.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-[#ff8527] flex items-center gap-1.5 mb-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Blocked Actions (Requires Progression)</span>
                </div>
                <div className="space-y-1">
                  {activeNode.blockedTools.map((b) => (
                    <div
                      key={b.name}
                      className="text-xs bg-secondary/30 border border-border/60 text-foreground px-3 py-1.5 rounded-lg flex items-center justify-between"
                    >
                      <span className="font-mono text-[11px]">{b.name}()</span>
                      <span className="text-[10px] text-muted-foreground">{b.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Transitions */}
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-[#ff8527]" />
                <span>Available Transitions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(activeNode.transitions).map(([tName, edge]) => (
                  <div
                    key={tName}
                    className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">{tName}</span>
                      <span className="text-[10px] text-[#ff8527] font-mono">→ {edge.targetState}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{edge.description}</p>
                    {edge.guard && (
                      <div className="mt-1.5 text-[10px] text-[#ff8527] bg-[#ff8527]/10 px-1.5 py-0.5 rounded font-mono border border-[#ff8527]/20">
                        Guard: {edge.guard}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
