import React from 'react';
import { TestDriveRun } from '@deep-age/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface SecurityAuditMatrixProps {
  run: TestDriveRun;
}

export const SecurityAuditMatrix: React.FC<SecurityAuditMatrixProps> = ({ run }) => {
  const privacyScore = run.summary.privacyScore ?? 95;
  const thirdPartyRequests = run.network.filter((n) => n.origin === 'third-party');

  const botProtection = run.botProtection || {
    botProtectionDetected: false,
    provider: 'None' as const,
    challengeType: 'none' as const,
    agentPassable: true,
    fingerprintsDetected: [],
  };

  const headerSecurity = run.headerSecurity || {
    score: 85,
    exposedHeaders: [],
    missingHeaders: [
      { header: 'Content-Security-Policy', importance: 'high' as const, fixSnippet: "Content-Security-Policy: default-src 'self';" },
      { header: 'Strict-Transport-Security', importance: 'high' as const, fixSnippet: 'Strict-Transport-Security: max-age=31536000;' },
    ],
    corsStatus: { isWildcard: true, allowCredentials: false, risk: 'permissive' as const },
  };

  return (
    <div className="flex flex-col gap-4 font-sans animate-fade-in text-foreground">
      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Privacy Score */}
        <Card className="p-3.5 border-border/80 bg-card shadow-xs rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Privacy Score
          </span>
          <div className="text-xl font-bold font-mono mt-1">
            <span className={privacyScore >= 80 ? 'text-[#5ae561]' : 'text-[#ff8527]'}>
              {privacyScore}
            </span>
            <span className="text-xs text-muted-foreground font-normal"> / 100</span>
          </div>
        </Card>

        {/* Metric 2: Bot / CAPTCHA Status */}
        <Card className="p-3.5 border-border/80 bg-card shadow-xs rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Bot / WAF Shield
          </span>
          <div className="mt-1">
            <span className={`text-xs font-bold font-mono ${botProtection.botProtectionDetected ? 'text-[#ff8527]' : 'text-[#5ae561]'}`}>
              {botProtection.provider}
            </span>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {botProtection.agentPassable ? 'Agent Passable' : 'Blocks Automated Agents'}
            </p>
          </div>
        </Card>

        {/* Metric 3: Header Hygiene */}
        <Card className="p-3.5 border-border/80 bg-card shadow-xs rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Header Hygiene
          </span>
          <div className="text-xl font-bold font-mono mt-1">
            <span className={headerSecurity.score >= 80 ? 'text-[#5ae561]' : headerSecurity.score >= 50 ? 'text-[#f3c83d]' : 'text-destructive'}>
              {headerSecurity.score}
            </span>
            <span className="text-xs text-muted-foreground font-normal"> / 100</span>
          </div>
        </Card>

        {/* Metric 4: 3rd-Party Surface */}
        <Card className="p-3.5 border-border/80 bg-card shadow-xs rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
            3rd-Party Endpoints
          </span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {thirdPartyRequests.length}{' '}
            <span className="text-[10px] font-normal text-muted-foreground">Contacted</span>
          </div>
        </Card>
      </div>

      {/* 2. BOT PROTECTION & CAPTCHA RADAR */}
      <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Bot Protection & CAPTCHA
            </h3>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Anti-bot challenges, Turnstile, and Cloudflare interstitial detection
            </p>
          </div>
          <Badge
            variant={botProtection.botProtectionDetected ? (botProtection.agentPassable ? 'warning' : 'destructive') : 'success'}
            className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full"
          >
            {botProtection.botProtectionDetected ? botProtection.challengeType.replace('_', ' ') : 'No Interstitials'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Detected Challenge Provider:</span>
            <p className="text-foreground font-bold">{botProtection.provider}</p>
            <p className="text-[11px] text-muted-foreground font-sans">
              {botProtection.botProtectionDetected
                ? `Fingerprints: [${botProtection.fingerprintsDetected.join(', ')}]`
                : 'Zero intrusive challenge scripts or iframe challenges discovered.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Agent Recommendation:</span>
            <p className="text-[#5ae561] font-sans text-xs">
              {botProtection.bypassRecommendation || 'Website allows direct agent execution and WebMCP standard tool dispatching.'}
            </p>
          </div>
        </div>
      </Card>

      {/* 3. EXPOSED HEADERS & SERVER FINGERPRINT HYGIENE */}
      <Card className="p-4 border-border/80 bg-card shadow-xs rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Header Security & Leaks
            </h3>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Response header leakage, CORS boundaries, and security policies
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs font-bold rounded-full">
            Score: {headerSecurity.score}%
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Exposed Leaks */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">
              Server Fingerprinting Leaks ({headerSecurity.exposedHeaders.length})
            </span>
            {headerSecurity.exposedHeaders.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#5ae561]/5 border border-[#5ae561]/20 text-[11px] font-mono text-[#5ae561]">
                ✓ Zero backend server or runtime framework headers leaked.
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px]">
                {headerSecurity.exposedHeaders.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-0.5">
                    <div className="flex justify-between font-bold text-destructive">
                      <span>{h.header}: {h.value}</span>
                      <Badge variant="destructive" className="text-[9px] px-1 py-0">{h.risk}</Badge>
                    </div>
                    <p className="text-muted-foreground text-[10px] font-sans">{h.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Security Headers */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">
              Recommended Security Headers ({headerSecurity.missingHeaders.length})
            </span>
            <div className="space-y-1.5 font-mono text-[11px] max-h-40 overflow-y-auto pr-1">
              {headerSecurity.missingHeaders.map((m, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>{m.header}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">{m.importance}</Badge>
                  </div>
                  <code className="block text-[10px] text-muted-foreground bg-background p-1 rounded overflow-x-auto">
                    {m.fixSnippet}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 4. SECURITY SIGNALS & BOUNDARY LOG */}
      <Card className="border-border/80 bg-card shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="p-3.5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between space-y-0">
          <h3 className="text-sm font-semibold text-foreground">
            Observed Security Findings
          </h3>
          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground rounded-full">
            {run.securitySignals.length} Findings
          </Badge>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {run.securitySignals.length === 0 ? (
            <Alert variant="success" className="bg-[#5ae561]/5 border-[#5ae561]/20 text-[#5ae561] rounded-xl p-3">
              <AlertTitle className="text-xs font-bold font-mono">Zero Boundary Violations</AlertTitle>
              <AlertDescription className="text-xs mt-0.5 text-muted-foreground font-sans">
                No unauthorized data leaks, cleartext HTTP transmissions, or third-party tracking beacons observed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {run.securitySignals.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3 rounded-xl bg-secondary/30 border border-border/60 space-y-1.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={sec.severity === 'alert' ? 'destructive' : sec.severity === 'warning' ? 'warning' : 'outline'}
                        className="text-[9px] uppercase px-1.5 py-0 rounded-full"
                      >
                        {sec.category.replace(/_/g, ' ')}
                      </Badge>
                      <h4 className="font-bold text-foreground text-xs">{sec.title}</h4>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{sec.severity}</span>
                  </div>

                  <p className="text-muted-foreground text-xs font-sans">{sec.observation}</p>

                  {sec.evidence && Object.keys(sec.evidence).length > 0 && (
                    <div className="pt-1">
                      {Array.isArray(sec.evidence.contactedDomains) ? (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">External Hosts:</span>
                          {(sec.evidence.contactedDomains as string[]).map((dom, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-secondary/80 border border-border/80 text-foreground font-mono text-[11px] flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ff8527]"></span>
                              <span>{dom}</span>
                              <span className="text-[9px] text-muted-foreground">({(sec.evidence.requestCount as number) || 1} req)</span>
                            </span>
                          ))}
                        </div>
                      ) : Array.isArray(sec.evidence.urls) ? (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Target URLs:</span>
                          {(sec.evidence.urls as string[]).map((u, i) => (
                            <div key={i} className="p-1.5 rounded-lg bg-background border border-border/60 text-[11px] font-mono text-muted-foreground truncate">
                              {u}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Object.entries(sec.evidence).map(([k, v], i) => (
                            <div key={i} className="px-2 py-1 rounded-lg bg-background border border-border/60 text-[10px] font-mono">
                              <span className="text-muted-foreground">{k}: </span>
                              <span className="text-foreground font-medium">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditMatrix;


