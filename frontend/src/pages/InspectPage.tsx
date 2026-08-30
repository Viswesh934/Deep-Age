import React, { useState } from 'react';
import { ShieldCheck, Play, Fingerprint } from 'lucide-react';
import { useTestDriveContext } from '@/context/TestDriveContext';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SecurityAuditMatrix } from '@/components/workbench/SecurityAuditMatrix';
import { PIIFirewallPanel } from '@/components/security/PIIFirewallPanel';
import { InjectionShieldPanel } from '@/components/security/InjectionShieldPanel';
import { AuditLedgerTable } from '@/components/security/AuditLedgerTable';
import { PasskeyModal } from '@/components/security/PasskeyModal';

export const InspectPage: React.FC = () => {
  const { activeRun, startTestDrive, isLoading } = useTestDriveContext();
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState<boolean>(false);

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

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in text-foreground pb-12">
      {/* 1. Standard Network & Transport Audit */}
      <SecurityAuditMatrix run={activeRun} />

      {/* 2. WebMCP Security & Governance Layer */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ff8527]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              WebMCP Enterprise Guardrails & Privacy Suite
            </h2>
          </div>

          <Button
            size="sm"
            onClick={() => setIsPasskeyModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 rounded-full h-8 px-4"
          >
            <Fingerprint className="w-3.5 h-3.5 text-[#ff8527]" />
            <span>Test Passkey Gate</span>
          </Button>
        </div>

        {/* Modular Security Testing Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PIIFirewallPanel />
          <InjectionShieldPanel />
        </div>

        {/* Tamper-Proof Audit Ledger with Rollback */}
        <AuditLedgerTable />
      </div>

      {/* Biometric Passkey Modal */}
      <PasskeyModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        onSuccess={(sig) => {
          console.log('Biometric Passkey Verified:', sig);
        }}
        challenge={{
          challengeId: 'chal_demo_checkout',
          actionName: 'complete_checkout',
          payloadDigest: 'a8b3f2e1c940d99824c0fa31b264e59a88371ef3b019b78a94628f41cd859012',
          rpId: window.location.hostname || 'localhost',
          timestamp: Date.now(),
          safetyTier: 'critical_destructive',
          paramsSummary: {
            orderId: 'ORD-9042',
            items: ['UltraBook Pro 14 (16GB RAM)'],
            totalAmount: '₹74,999',
            deliveryAddress: '221B Baker St, Tech District'
          }
        }}
      />
    </div>
  );
};

export default InspectPage;
