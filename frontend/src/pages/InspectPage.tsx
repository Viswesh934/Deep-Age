import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Globe, Play } from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export const InspectPage: React.FC = () => {
  const { activeRun, startTestDrive, isLoading } = useTestDriveContext();

  if (!activeRun) {
    return (
      <Card className="p-8 text-center space-y-4 border-dashed border-border/80 font-sans shadow-xs rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-secondary text-primary mx-auto flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <CardTitle className="text-base font-bold">Security & Privacy Audit Ready</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Start a test-drive above to inspect external tracking endpoints, cleartext transmissions, and security boundary sandboxing.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => startTestDrive(undefined, undefined, 'inspect')}
          disabled={isLoading}
          className="gap-2 font-semibold text-xs rounded-full px-5 h-9"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Run Security Audit
        </Button>
      </Card>
    );
  }

  const privacyScore = activeRun.summary.privacyScore ?? 95;
  const thirdPartyRequests = activeRun.network.filter((n) => n.origin === 'third-party');
  const insecureRequests = activeRun.network.filter(
    (n) => n.url.startsWith('http://') && !n.url.includes('localhost') && !n.url.includes('127.0.0.1')
  );

  return (
    <div className="flex flex-col gap-4 font-sans animate-fade-in">
      {/* Top Security HUD Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center justify-between border-border/70 shadow-xs rounded-2xl">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Privacy Audit Score
            </span>
            <div
              className={`text-2xl font-extrabold mt-0.5 font-mono ${
                privacyScore >= 80
                  ? 'text-emerald-700 dark:text-[#5ae561]'
                  : privacyScore >= 60
                  ? 'text-amber-700 dark:text-[#f3c83d]'
                  : 'text-destructive'
              }`}
            >
              {privacyScore} <span className="text-xs font-normal text-muted-foreground font-sans">/ 100</span>
            </div>
          </div>
          <span className="p-2 rounded-xl bg-secondary text-primary">
            <ShieldCheck className="w-5 h-5" />
          </span>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/70 shadow-xs rounded-2xl">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Security Signals
            </span>
            <div className="text-2xl font-extrabold text-foreground mt-0.5 font-mono">
              {activeRun.securitySignals.length}
            </div>
          </div>
          <span className="p-2 rounded-xl bg-secondary text-primary">
            <ShieldAlert className="w-5 h-5" />
          </span>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/70 shadow-xs rounded-2xl">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Third-Party Endpoints
            </span>
            <div className="text-2xl font-extrabold text-foreground mt-0.5 font-mono">
              {thirdPartyRequests.length}
            </div>
          </div>
          <span className="p-2 rounded-xl bg-secondary text-primary">
            <Globe className="w-5 h-5" />
          </span>
        </Card>
      </div>

      {/* Security Signals List */}
      <Card className="border-border/70 shadow-xs rounded-2xl">
        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold">
              Security & Privacy Audit Findings ({activeRun.securitySignals.length})
            </CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] rounded-full">
            AUTOMATED AUDIT
          </Badge>
        </CardHeader>
        <Separator className="border-border/60" />

        <CardContent className="pt-5 space-y-4">
          {activeRun.securitySignals.length === 0 ? (
            <Alert variant="success" className="rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-[#5ae561]" />
              <AlertTitle className="text-sm font-bold">All clear</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                No unauthorized data transmission or high-risk privacy signals observed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {activeRun.securitySignals.map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/70 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={sec.severity === 'warning' ? 'warning' : 'secondary'}
                        className="text-[10px] uppercase font-bold rounded-full"
                      >
                        {sec.category}
                      </Badge>
                      <h4 className="font-bold text-foreground">{sec.title}</h4>
                    </div>
                    <span className="text-[11px] text-muted-foreground uppercase font-mono">{sec.severity}</span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{sec.observation}</p>

                  <div className="p-2.5 rounded-xl bg-[#121212] border border-border/80 text-[#74b684] text-[11px] font-mono overflow-x-auto">
                    <pre>{JSON.stringify(sec.evidence, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Origin Safety Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
        <Card className="p-5 space-y-2 border-border/70 shadow-xs rounded-2xl">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Lock className="w-4 h-4 text-emerald-700 dark:text-[#5ae561]" />
            Transport Encryption
          </div>
          <p className="text-muted-foreground leading-relaxed text-xs">
            {insecureRequests.length === 0
              ? 'All external network transmissions used TLS encryption.'
              : `Warning: ${insecureRequests.length} request(s) transmitted over plaintext HTTP.`}
          </p>
        </Card>

        <Card className="p-5 space-y-2 border-border/70 shadow-xs rounded-2xl">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Globe className="w-4 h-4 text-primary" />
            Third-Party Surface Area
          </div>
          <p className="text-muted-foreground leading-relaxed text-xs">
            {thirdPartyRequests.length === 0
              ? 'Zero external tracking domains contacted during this session.'
              : `Contacted ${thirdPartyRequests.length} external third-party domain endpoints.`}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default InspectPage;
