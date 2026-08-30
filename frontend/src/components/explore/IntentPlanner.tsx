import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, CornerDownLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { IntentResolutionResult } from '@deep-age/shared';

interface IntentPlannerProps {
  siteUrl: string;
}

export const IntentPlanner: React.FC<IntentPlannerProps> = ({ siteUrl }) => {
  const [goal, setGoal] = useState<string>('Find a laptop with 16GB RAM under 80,000 and add it to cart');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<IntentResolutionResult | null>(null);

  const handlePlanIntent = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/explore/resolve-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          userGoal: goal,
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      }
    } catch (err) {
      console.error('Failed to resolve intent:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'public_read':
        return (
          <Badge variant="outline" className="text-[10px] font-mono text-[#5ae561] border-[#5ae561]/30 bg-[#5ae561]/10 rounded-full">
            Safe Read
          </Badge>
        );
      case 'context_read':
        return (
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/80 rounded-full">
            Context Read
          </Badge>
        );
      case 'reversible_write':
        return (
          <Badge variant="outline" className="text-[10px] font-mono text-[#ff8527] border-[#ff8527]/30 bg-[#ff8527]/10 rounded-full">
            Reversible
          </Badge>
        );
      case 'critical_destructive':
        return (
          <Badge variant="outline" className="text-[10px] font-mono text-destructive border-destructive/30 bg-destructive/10 rounded-full">
            Passkey Required
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px] font-mono rounded-full">{tier}</Badge>;
    }
  };

  return (
    <Card className="bg-card border-border/80 shadow-xs rounded-2xl">
      <CardHeader className="px-4 py-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#ff8527]" />
          <span>Intent & Action Planner</span>
        </CardTitle>
        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/80 rounded-full">
          AI Engine
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-3 font-sans text-xs">
        <div className="flex gap-2">
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlanIntent()}
            placeholder="e.g. Find shoes under $100 and add to cart..."
            className="bg-secondary/30 border-border/70 text-xs text-foreground placeholder:text-muted-foreground rounded-full px-4 h-9 flex-1"
          />
          <Button
            onClick={handlePlanIntent}
            disabled={loading || !goal.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-semibold px-4 h-9 gap-1.5"
          >
            {loading ? 'Planning...' : (
              <>
                <span>Plan</span>
                <CornerDownLeft className="w-3 h-3" />
              </>
            )}
          </Button>
        </div>

        {/* Resolved Plan Output */}
        {result && (
          <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {result.feasible ? (
                  <CheckCircle2 className="w-4 h-4 text-[#5ae561]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#ff8527]" />
                )}
                <span className="text-xs font-semibold text-foreground">
                  {result.feasible ? 'Action Path Generated' : 'Missing Prerequisite Capabilities'}
                </span>
              </div>
              <div>{getTierBadge(result.estimatedRiskTier)}</div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">{result.reasoning}</p>

            {result.plan && result.plan.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {result.plan.map((step) => (
                  <div
                    key={step.step}
                    className="p-2.5 rounded-lg bg-card/80 border border-border/60 flex items-start justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-secondary text-foreground font-mono font-bold flex items-center justify-center text-[10px]">
                          {step.step}
                        </span>
                        <code className="font-mono text-[#ff8527] font-semibold text-[11px]">{step.toolName}()</code>
                      </div>
                      <p className="text-[11px] text-muted-foreground pl-5.5">{step.explanation}</p>
                    </div>
                    <div className="shrink-0">{getTierBadge(step.safetyTier)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
