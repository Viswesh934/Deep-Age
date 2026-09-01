import React, { useState, useEffect } from 'react';
import { ScrollText, RotateCcw, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { AuditLedgerEntry } from '@/types';
import { env } from '@/config/env';

export const AuditLedgerTable: React.FC = () => {
  const [entries, setEntries] = useState<AuditLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLedger = () => {
    fetch(`${env.backendUrl}/api/security/audit-ledger`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.entries) {
          setEntries(data.entries);
        }
      })
      .catch((err) => console.error('Failed to fetch audit ledger:', err));
  };

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRollback = async (actionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${env.backendUrl}/api/security/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId })
      });
      const data = await res.json();
      if (data.success) {
        fetchLedger();
      }
    } catch (err) {
      console.error('Rollback failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border/80 rounded-2xl shadow-xs">
      <CardHeader className="px-4 py-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
          <ScrollText className="w-3.5 h-3.5 text-[#ff8527]" />
          <span>Tamper-Evident Action Audit Ledger</span>
        </CardTitle>
        <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground rounded-full">
          SHA-256 Verified
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-2 font-sans text-xs">
        {entries.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">No audit records logged yet.</div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-xl bg-secondary/20 border border-border/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-foreground font-semibold text-xs">{entry.toolName}()</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-mono rounded-full ${
                      entry.status === 'ROLLED_BACK'
                        ? 'text-[#ff8527] border-[#ff8527]/30 bg-[#ff8527]/10'
                        : 'text-[#5ae561] border-[#5ae561]/30 bg-[#5ae561]/10'
                    }`}
                  >
                    {entry.status}
                  </Badge>
                  {entry.biometricSignature && (
                    <Badge variant="outline" className="text-[9px] font-mono text-destructive border-destructive/30 bg-destructive/10 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Passkey Signed
                    </Badge>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground truncate">
                  {entry.outputSummary || JSON.stringify(entry.inputsMasked)}
                </div>

                <div className="text-[10px] text-muted-foreground/70 font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString()} • {entry.durationMs}ms
                </div>
              </div>

              {entry.isReversible && entry.status !== 'ROLLED_BACK' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => handleRollback(entry.id)}
                  className="text-xs h-7 rounded-full border-border/80 hover:bg-secondary text-[#ff8527] gap-1 self-start sm:self-auto shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo Action</span>
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
