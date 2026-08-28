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
      <Card className="p-8 text-center space-y-4 border-dashed font-sans">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <CardTitle className="text-base font-bold">Security & Privacy Audit Ready</CardTitle>
          <CardDescription className="text-xs">
            Start a test-drive above to inspect external tracking endpoints, cleartext transmissions, and security boundary sandboxing.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => startTestDrive(undefined, undefined, 'inspect')}
          disabled={isLoading}
          className="gap-2 font-bold text-xs"
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
    <div className="flex flex-col gap-5 font-sans animate-fade-in">
      {/* Top Security HUD Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Privacy Audit Score
            </span>
            <div
              className={`text-3xl font-extrabold mt-1 ${
                privacyScore >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : privacyScore >= 60
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-destructive'
              }`}
            >
              {privacyScore} <span className="text-sm font-normal text-muted-foreground">/ 100</span>
            </div>
          </div>
          <ShieldCheck className="w-8 h-8 text-muted-foreground/40" />
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Security Signals
            </span>
            <div className="text-3xl font-extrabold text-foreground mt-1">
              {activeRun.securitySignals.length}
            </div>
          </div>
          <ShieldAlert className="w-8 h-8 text-muted-foreground/40" />
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Third-Party Endpoints
            </span>
            <div className="text-3xl font-extrabold text-foreground mt-1">
              {thirdPartyRequests.length}
            </div>
          </div>
          <Globe className="w-8 h-8 text-muted-foreground/40" />
        </Card>
      </div>

      {/* Security Signals List */}
      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">
              Security & Privacy Audit Findings ({activeRun.securitySignals.length})
            </CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            AUTOMATED AUDIT
          </Badge>
        </CardHeader>
        <Separator />

        <CardContent className="pt-5 space-y-4">
          {activeRun.securitySignals.length === 0 ? (
            <Alert variant="success">
              <ShieldCheck className="w-4 h-4" />
              <AlertTitle>All clear</AlertTitle>
              <AlertDescription>
                No unauthorized data transmission or high-risk privacy signals observed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {activeRun.securitySignals.map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 rounded-lg bg-muted/40 border border-border space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={sec.severity === 'warning' ? 'warning' : 'secondary'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {sec.category}
                      </Badge>
                      <h4 className="font-bold text-foreground">{sec.title}</h4>
                    </div>
                    <span className="text-[11px] text-muted-foreground uppercase font-mono">{sec.severity}</span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{sec.observation}</p>

                  <div className="p-2.5 rounded-lg bg-slate-950 dark:bg-black border border-border text-cyan-300 text-[11px] font-mono overflow-x-auto">
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
        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Transport Encryption
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {insecureRequests.length === 0
              ? 'All external network transmissions used TLS encryption.'
              : `Warning: ${insecureRequests.length} request(s) transmitted over plaintext HTTP.`}
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Globe className="w-4 h-4 text-primary" />
            Third-Party Surface Area
          </div>
          <p className="text-muted-foreground leading-relaxed">
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
