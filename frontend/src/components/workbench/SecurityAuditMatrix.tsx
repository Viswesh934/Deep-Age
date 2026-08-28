import React from 'react';
import { TestDriveRun } from '@deep-age/shared';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface SecurityAuditMatrixProps {
  run: TestDriveRun;
}

export const SecurityAuditMatrix: React.FC<SecurityAuditMatrixProps> = ({ run }) => {
  const privacyScore = run.summary.privacyScore ?? 95;
  const thirdPartyRequests = run.network.filter((n) => n.origin === 'third-party');
  const insecureRequests = run.network.filter(
    (n) => n.url.startsWith('http://') && !n.url.includes('localhost') && !n.url.includes('127.0.0.1')
  );

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in text-foreground">
      {/* Top Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Metric 1: Privacy Score */}
        <Card className="p-4 border-border/80 bg-card/90 shadow-sm flex items-center justify-between rounded-2xl">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Privacy Score
            </span>
            <div className="text-xl font-bold font-mono">
              <span className={privacyScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}>
                {privacyScore}
              </span>
              <span className="text-xs text-muted-foreground font-normal"> / 100</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Card>

        {/* Metric 2: Security Signals */}
        <Card className="p-4 border-border/80 bg-card/90 shadow-sm flex items-center justify-between rounded-2xl">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Security Alerts
            </span>
            <div className="text-xl font-bold font-mono text-foreground">
              {run.securitySignals.length}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </Card>

        {/* Metric 3: Third-Party Surface */}
        <Card className="p-4 border-border/80 bg-card/90 shadow-sm flex items-center justify-between rounded-2xl">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              3rd-Party Endpoints
            </span>
            <div className="text-xl font-bold font-mono text-foreground">
              {thirdPartyRequests.length}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Globe className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Security Findings & Evidence Cards */}
      <Card className="border-border/80 bg-card/90 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-border/70 bg-muted/30 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-semibold text-foreground">
              Boundary & Privacy Audit Log
            </h3>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border/80 rounded-md">
            {run.securitySignals.length} Findings
          </Badge>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {run.securitySignals.length === 0 ? (
            <Alert variant="success" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl p-3.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <AlertTitle className="text-xs font-semibold">Secure Agent Boundary</AlertTitle>
              <AlertDescription className="text-xs mt-0.5">
                No unauthorized data leaks, cleartext HTTP requests, or tracker beacons detected.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2.5">
              {run.securitySignals.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3 rounded-xl bg-background/80 border border-border/70 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={sec.severity === 'alert' ? 'destructive' : 'warning'}
                        className="text-[9px] uppercase font-mono px-1.5 py-0 rounded-md"
                      >
                        {sec.category}
                      </Badge>
                      <h4 className="font-semibold text-foreground text-xs">{sec.title}</h4>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{sec.severity}</span>
                  </div>

                  <p className="text-muted-foreground text-xs">{sec.observation}</p>

                  {sec.evidence && Object.keys(sec.evidence).length > 0 && (
                    <pre className="p-2.5 rounded-lg bg-zinc-950 text-indigo-300 text-[10px] font-mono overflow-x-auto border border-zinc-800">
                      {JSON.stringify(sec.evidence, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Origin Safety & Transport Security Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        <Card className="p-4 border-border/80 bg-card/90 space-y-1.5 rounded-2xl">
          <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>TLS Encryption</span>
          </div>
          <p className="text-muted-foreground text-xs">
            {insecureRequests.length === 0
              ? 'All external network requests used encrypted TLS connections.'
              : `${insecureRequests.length} request(s) transmitted over plaintext HTTP.`}
          </p>
        </Card>

        <Card className="p-4 border-border/80 bg-card/90 space-y-1.5 rounded-2xl">
          <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span>3rd-Party Trackers</span>
          </div>
          <p className="text-muted-foreground text-xs">
            {thirdPartyRequests.length === 0
              ? 'Zero external tracking domains contacted during this session.'
              : `${thirdPartyRequests.length} external third-party domain endpoints contacted.`}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SecurityAuditMatrix;

