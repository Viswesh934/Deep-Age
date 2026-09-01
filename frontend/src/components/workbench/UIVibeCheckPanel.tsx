import React from 'react';
import { TestDriveRun } from '@deep-age/shared';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Eye, Check } from 'lucide-react';

interface UIVibeCheckPanelProps {
  run: TestDriveRun;
}

export const UIVibeCheckPanel: React.FC<UIVibeCheckPanelProps> = ({ run }) => {
  const vibeAudit = run.uiVibeAudit || {
    vibeScore: 88,
    aestheticProfile: {
      primaryTone: 'Custom Obsidian Minimalist (Distinctive Human Craft)',
      colorPalette: [
        { hex: '#0f0f0f', role: 'Canvas / Background', usageCount: 48, isAiCliche: false },
        { hex: '#ff8527', role: 'Warm Orange Accent', usageCount: 16, isAiCliche: false },
        { hex: '#5ae561', role: 'Success Status', usageCount: 12, isAiCliche: false },
        { hex: '#f4f4f5', role: 'Primary Typography', usageCount: 36, isAiCliche: false },
      ],
      fontFamilies: ['Inter', 'Geist Mono'],
      aiClicheRisk: 'low' as const,
    },
    aiClichesDetected: [],
    uiFlaws: [
      {
        id: 'flaw-demo-1',
        category: 'accessibility' as const,
        title: 'Icon-only Button Tap Target',
        description: 'Cart delete buttons have 28x28px tap boundaries without explicit aria-label.',
        selector: '.btn-remove-cart',
        impact: 'medium' as const,
        fixSuggestion: 'Add aria-label="Remove item" and increase padding to min-h-[36px].',
      }
    ],
    overallVerdict: 'UI demonstrates human design intention with warm obsidian surfaces and crisp typography without generic AI template purple gradients.',
  };

  const { vibeScore, aestheticProfile, aiClichesDetected, uiFlaws, overallVerdict } = vibeAudit;

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* 1. COCKPIT SCORE HEADER */}
      <Card className="border-border/80 bg-card shadow-xs rounded-2xl overflow-hidden text-left">
        <div className="p-4 bg-muted/20 border-b border-border/60 flex flex-wrap items-center justify-between text-left gap-3">
          <div className="text-left">
            <div className="flex items-center gap-2 text-left">
              <h3 className="text-sm font-semibold text-foreground text-left">
                UI Vibe Audit
              </h3>
              <Badge
                variant={aestheticProfile.aiClicheRisk === 'low' ? 'success' : aestheticProfile.aiClicheRisk === 'moderate' ? 'warning' : 'destructive'}
                className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
              >
                Risk: {aestheticProfile.aiClicheRisk}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans text-left">
              Aesthetic fingerprinting, color palette audit, and UI flaw diagnostics
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-right">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Vibe Score</span>
              <span
                className={`text-xl font-extrabold ${
                  vibeScore >= 80 ? 'text-[#5ae561]' : vibeScore >= 60 ? 'text-[#f3c83d]' : 'text-destructive'
                }`}
              >
                {vibeScore} / 100
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 text-left">
          <div className="p-3.5 bg-secondary/30 border border-border/60 rounded-xl flex items-start gap-3 text-xs text-left">
            <CheckCircle2 className="w-4 h-4 text-[#5ae561] shrink-0 mt-0.5" />
            <div className="text-left">
              <span className="font-bold text-foreground font-mono block mb-0.5 text-left">{aestheticProfile.primaryTone}</span>
              <p className="text-muted-foreground leading-relaxed text-left">{overallVerdict}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. COLOR PALETTE & AI CLICHÉ RADAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Extracted Palette */}
        <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">
              Extracted Color Palette
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Fonts: {aestheticProfile.fontFamilies.join(', ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {aestheticProfile.colorPalette.map((col, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 flex flex-col justify-between space-y-2 font-mono text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-lg border border-white/20 shadow-xs shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span className="font-bold text-foreground truncate">{col.hex}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">{col.role}</span>
                  {col.isAiCliche ? (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 rounded">AI Purple</Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Clichés Radar */}
        <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">
              AI Design Tropes & Smells
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {aiClichesDetected.length} Detected
            </span>
          </div>

          {aiClichesDetected.length === 0 ? (
            <div className="p-4 bg-[#5ae561]/5 border border-[#5ae561]/20 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#5ae561]">
                <Check className="w-4 h-4" />
                <span>Zero AI Clichés Detected</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Site avoids standard AI cliché indicators (gratuitous purple/indigo gradients, neon glow drop-shadows, and generic filler buzzwords).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {aiClichesDetected.map((cliche) => (
                <div
                  key={cliche.id}
                  className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-purple-300">
                    <span>⚠️ {cliche.label}</span>
                    <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-purple-400 text-purple-300">
                      {cliche.severity}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] font-sans">{cliche.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 3. UI FLAWS & ACCESSIBILITY DIAGNOSTICS */}
      <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#ff8527]" />
            UI & Accessibility Flaw Triage ({uiFlaws.length})
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Inspected across live DOM tree
          </span>
        </div>

        {uiFlaws.length === 0 ? (
          <div className="p-4 bg-secondary/30 rounded-xl text-left text-xs text-muted-foreground font-mono">
            No critical UI or accessibility defects detected on inspected controls.
          </div>
        ) : (
          <div className="space-y-2.5">
            {uiFlaws.map((flaw) => (
              <div
                key={flaw.id}
                className="p-3.5 bg-secondary/30 border border-border/60 hover:border-border rounded-xl text-xs space-y-2 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground font-mono text-xs">{flaw.title}</span>
                    {flaw.selector ? (
                      <code className="text-[10px] bg-secondary px-2 py-0.5 rounded font-mono text-primary">
                        {flaw.selector}
                      </code>
                    ) : null}
                  </div>
                  <Badge
                    variant={flaw.impact === 'high' ? 'destructive' : flaw.impact === 'medium' ? 'warning' : 'outline'}
                    className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full"
                  >
                    {flaw.impact} Impact
                  </Badge>
                </div>

                <p className="text-muted-foreground text-xs leading-relaxed">{flaw.description}</p>

                <div className="pt-1.5 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#5ae561] flex items-center gap-1">
                    <span>💡 Recommendation:</span> {flaw.fixSuggestion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UIVibeCheckPanel;
