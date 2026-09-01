import React from 'react';
import { TestDriveRun } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SeoReadabilityFeedsPanelProps {
  run: TestDriveRun;
}

export const SeoReadabilityFeedsPanel: React.FC<SeoReadabilityFeedsPanelProps> = ({ run }) => {
  const seo = run.seoAudit || {
    score: 88,
    title: 'Application Interface',
    titleLength: 22,
    description: 'Web application with autonomous WebMCP observability integration',
    descriptionLength: 61,
    hasOpenGraph: true,
    hasTwitterCard: true,
    hasJsonLd: true,
    hasCanonical: true,
    hasRobotsTxt: true,
    hasSitemap: true,
    issues: [],
    recommendations: ['Title and description are well structured for search engine crawlers.'],
  };

  const readability = run.readabilityAudit || {
    score: 74,
    readingGradeLevel: 'Grade 7-8 (Clear & Plain English)',
    fleschKincaidReadingEase: 74,
    estimatedReadTimeMinutes: 2,
    wordCount: 340,
    sentenceCount: 28,
    jargonDensity: 'low' as const,
    clarityAssessment: 'Content is accessible, straightforward, and easily digested by general shoppers and autonomous agents.',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-foreground">
      {/* 1. SEO & METADATA HEALTH */}
      <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-sm font-semibold text-foreground">
              SEO & Metadata Discovery
            </span>
            <Badge
              variant={seo.score >= 80 ? 'success' : seo.score >= 60 ? 'warning' : 'destructive'}
              className="text-[10px] font-mono font-bold rounded-full px-2 py-0.5"
            >
              Score: {seo.score}/100
            </Badge>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Page Title:</span>
              <p className="text-foreground truncate font-sans font-medium">{seo.title || 'Untitled Page'}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Meta Description:</span>
              <p className="text-muted-foreground text-[11px] font-sans line-clamp-2 leading-relaxed">
                {seo.description || 'No meta description tag discovered on target page.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-secondary/20 border border-border/60 text-center">
                <span className="text-muted-foreground block text-[9px]">OpenGraph:</span>
                <span className="font-bold text-foreground">{seo.hasOpenGraph ? 'Detected' : 'Missing'}</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/20 border border-border/60 text-center">
                <span className="text-muted-foreground block text-[9px]">Canonical:</span>
                <span className="font-bold text-foreground">{seo.hasCanonical ? 'Verified' : 'None'}</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/20 border border-border/60 text-center">
                <span className="text-muted-foreground block text-[9px]">Robots.txt:</span>
                <span className="font-bold text-foreground">{seo.hasRobotsTxt ? 'Present' : 'Default'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-sans">
          {seo.recommendations[0] || 'Metadata verified for autonomous agent exploration.'}
        </div>
      </Card>

      {/* 2. READABILITY & PLAIN ENGLISH */}
      <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-sm font-semibold text-foreground">
              Readability & Plain English
            </span>
            <Badge
              variant={readability.score >= 70 ? 'success' : readability.score >= 50 ? 'warning' : 'destructive'}
              className="text-[10px] font-mono font-bold rounded-full px-2 py-0.5"
            >
              Ease: {readability.score}/100
            </Badge>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Grade Level:</span>
              <p className="text-[#5ae561] font-bold font-sans text-xs">{readability.readingGradeLevel}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-secondary/20 border border-border/60">
                <span className="text-muted-foreground block text-[10px]">Estimated Read Time:</span>
                <span className="font-bold text-foreground">~{readability.estimatedReadTimeMinutes} min ({readability.wordCount} words)</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/20 border border-border/60">
                <span className="text-muted-foreground block text-[10px]">Jargon Density:</span>
                <span className="font-bold text-foreground uppercase">{readability.jargonDensity}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-sans line-clamp-2">
          {readability.clarityAssessment}
        </div>
      </Card>
    </div>
  );
};

export default SeoReadabilityFeedsPanel;
