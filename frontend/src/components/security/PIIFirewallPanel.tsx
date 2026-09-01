import React, { useState } from 'react';
import { ShieldCheck, EyeOff, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { PIIScanResult } from '@/types';
import { env } from '@/config/env';

export const PIIFirewallPanel: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    'User john.doe@acme.com ordered with Card 4532-8901-2345-6789 and Phone +1-555-0199.'
  );
  const [scanResult, setScanResult] = useState<PIIScanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleScanAndRedact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${env.backendUrl}/api/security/redact-pii`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data.result);
      }
    } catch (err) {
      console.error('PII redaction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border/80 rounded-2xl shadow-xs">
      <CardHeader className="px-4 py-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#ff8527]" />
          <span>Client-Side PII Masking Firewall</span>
        </CardTitle>
        <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground rounded-full">
          Zero Leakage
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-3 font-sans text-xs">
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">
            Raw Form / Web Context:
          </label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={2}
            className="bg-secondary/30 border-border/70 text-xs font-mono text-foreground rounded-xl"
          />
        </div>

        <Button
          onClick={handleScanAndRedact}
          disabled={loading || !inputText}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-semibold h-8 px-4 gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{loading ? 'Redacting...' : 'Sanitize & Mask PII'}</span>
        </Button>

        {scanResult && (
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                Sanitized Agent Prompt (Zero Plaintext Secrets)
              </span>
              <Badge variant="outline" className="text-[10px] font-mono text-[#ff8527] border-[#ff8527]/30 bg-[#ff8527]/10 rounded-full">
                {scanResult.detectedCount} Masked
              </Badge>
            </div>

            <pre className="p-2.5 bg-secondary/50 rounded-lg font-mono text-foreground text-[11px] whitespace-pre-wrap border border-border/60">
              {scanResult.maskedText}
            </pre>

            <div className="flex flex-wrap gap-1 mt-1">
              {scanResult.tokens.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[9px] font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/60"
                >
                  {t.token} ({t.type})
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
