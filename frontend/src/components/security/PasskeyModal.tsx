import React, { useState } from 'react';
import { Fingerprint, XCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { WebAuthnVerificationChallenge } from '@/types';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (signature: string) => void;
  challenge?: WebAuthnVerificationChallenge;
}

export const PasskeyModal: React.FC<PasskeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  challenge
}) => {
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);

  const handleBiometricAuth = async () => {
    setVerifying(true);
    try {
      const mockSignature = `sig_${Date.now()}_sha256_${Math.random().toString(36).substring(2, 10)}`;
      
      const res = await fetch('/api/security/webauthn/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: challenge?.actionName || 'complete_checkout',
          params: challenge?.paramsSummary || {},
          proof: {
            challengeId: challenge?.challengeId || 'chal_demo',
            credentialId: 'cred_passkey_yubikey_01',
            clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0=',
            signature: mockSignature,
            userVerified: true
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setVerified(true);
        setTimeout(() => {
          onSuccess(mockSignature);
          onClose();
          setVerified(false);
          setVerifying(false);
        }, 1000);
      }
    } catch (err) {
      console.error('Biometric confirmation failed:', err);
      setVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border/80 text-foreground max-w-md rounded-3xl p-6 font-sans">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-full bg-[#ff8527]/10 text-[#ff8527] flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
            <DialogTitle className="text-sm font-bold">Biometric Passkey Approval</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            An autonomous AI agent requested authorization to execute a critical/financial action.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 p-3.5 rounded-2xl bg-secondary/30 border border-border/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Action Tool:</span>
            <code className="font-mono text-[11px] text-[#ff8527] bg-[#ff8527]/10 px-2 py-0.5 rounded-md border border-[#ff8527]/20">
              {challenge?.actionName || 'complete_checkout'}()
            </code>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">SHA-256 Digest:</span>
            <code className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">
              {challenge?.payloadDigest || 'a8b3f2e1c940d99824c0fa31b264e59a88371ef3b019b78a94628f41cd859012'}
            </code>
          </div>

          <div className="mt-2 pt-2 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground block mb-1">Payload Parameters:</span>
            <pre className="p-2.5 bg-card rounded-xl font-mono text-[10px] text-foreground overflow-x-auto border border-border/60">
              {JSON.stringify(challenge?.paramsSummary || { orderId: 'ORD-9042', total: '₹74,999' }, null, 2)}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-border/80 text-muted-foreground hover:text-foreground rounded-full text-xs h-8 px-4"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            <span>Cancel</span>
          </Button>

          <Button
            size="sm"
            onClick={handleBiometricAuth}
            disabled={verifying || verified}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-full h-8 px-4 gap-1.5"
          >
            {verified ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5ae561]" />
                <span>Verified</span>
              </>
            ) : verifying ? (
              <>
                <Fingerprint className="w-3.5 h-3.5 animate-pulse text-[#ff8527]" />
                <span>Awaiting Touch ID...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Authorize Passkey</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
