import React from 'react';
import { ShieldCheck, Play } from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SecurityAuditMatrix } from '@/components/workbench/SecurityAuditMatrix';

export const InspectPage: React.FC = () => {
  const { activeRun, startTestDrive, isLoading } = useTestDriveContext();

  if (!activeRun) {
    return (
      <Card className="p-10 text-center space-y-4 border-dashed border-border/80 bg-card shadow-xs rounded-3xl font-sans">
        <div className="w-12 h-12 rounded-2xl bg-secondary text-primary mx-auto flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <CardTitle className="text-base font-bold text-foreground">Security & Privacy Audit Ready</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            Start a test-drive above to inspect external tracking endpoints, cleartext transmissions, and security boundary sandboxing.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => startTestDrive(undefined, undefined, 'inspect')}
          disabled={isLoading}
          className="gap-2 font-semibold text-xs rounded-full px-6 h-9 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Security Audit</span>
        </Button>
      </Card>
    );
  }

  return <SecurityAuditMatrix run={activeRun} />;
};

export default InspectPage;

