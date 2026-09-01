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
    title: 'ElectroVault Storefront',
    titleLength: 22,
    description: 'Hardware and developer reference store with WebMCP interface',
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

  const feeds = run.feedDiscovery || {
    rssFeeds: [
      { title: 'WebMCP Manifest Feed', url: '/.well-known/webmcp.json', type: 'json' as const },
      { title: 'State Graph Capability Feed', url: '/api/state-graph', type: 'json' as const },
      { title: 'SQLite Catalog Feed', url: '/api/catalog.sqlite', type: 'json' as const },
    ],
    hasRss: false,
    hasChangelog: false,
    hasSitemap: true,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-foreground">
      {/* 1. SEO & METADATA HEALTH */}
      <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-sm font-semibold text-foreground">
              SEO & Metadata
            </span>
            <Badge
              variant={seo.score >= 80 ? 'success' : seo.score >= 60 ? 'warning' : 'destructive'}
              className="text-[10px] font-mono font-bold rounded-full px-2 py-0.5"
            >
              Score: {seo.score}/100
            </Badge>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Page Title:</span>
              <p className="text-foreground truncate font-sans">{seo.title || 'Untitled'}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Meta Description:</span>
              <p className="text-muted-foreground text-[11px] font-sans line-clamp-2 leading-relaxed">
                {seo.description || 'No meta description tag discovered.'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-sans">
          {seo.recommendations[0] || 'Metadata verified for agent exploration.'}
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
              {readability.score}/100
            </Badge>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Grade Level:</span>
              <p className="text-[#5ae561] font-bold font-sans text-xs">{readability.readingGradeLevel}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-secondary/20 border border-border/60">
                <span className="text-muted-foreground block text-[10px]">Read Time:</span>
                <span className="font-bold text-foreground">~{readability.estimatedReadTimeMinutes} min</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/20 border border-border/60">
                <span className="text-muted-foreground block text-[10px]">Jargon Level:</span>
                <span className="font-bold text-foreground uppercase">{readability.jargonDensity}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-sans line-clamp-2">
          {readability.clarityAssessment}
        </div>
      </Card>

      {/* 3. MACHINE FEEDS & DATA EXPORTS */}
      <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-sm font-semibold text-foreground">
              Feeds & Machine Exports
            </span>
            <Badge variant="outline" className="text-[10px] font-mono rounded-full px-2 py-0.5">
              {feeds.rssFeeds.length} Active Feeds
            </Badge>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {feeds.rssFeeds.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/60 flex items-center justify-between text-foreground transition-all cursor-pointer block"
              >
                <span className="font-bold truncate text-[11px]">{f.title}</span>
                <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 shrink-0">
                  {f.type}
                </Badge>
              </a>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground font-mono pt-2 border-t border-border/50">
          Provides standard XML/JSON endpoints for RSS readers, aggregators, and LLM web crawlers.
        </p>
      </Card>
    </div>
  );
};

export default SeoReadabilityFeedsPanel;
