import { SecuritySignal, UserMode } from '@deep-age/shared';
import { ShieldCheck, ShieldAlert, Lock } from 'lucide-react';

interface SecurityTabProps {
  securitySignals: SecuritySignal[];
  mode: UserMode;
  privacyScore?: number;
}

export function SecurityTab({ securitySignals, mode, privacyScore = 95 }: SecurityTabProps) {
  // EXPLORE MODE: Friendly privacy checkup
  if (mode === 'explore') {
    return (
      <div className="space-y-4">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
          Privacy & security report
        </div>
        {securitySignals.length === 0 ? (
          <div className="p-4 bg-black border border-emerald-500/30 text-xs text-zinc-300">
            <div className="font-bold text-emerald-400">✓ No privacy issues observed</div>
            <p className="mt-1 text-zinc-400">This website did not send your data to unencrypted or unusual destinations.</p>
          </div>
        ) : (
          securitySignals.map((sec) => (
            <div key={sec.id} className="p-4 bg-black border border-zinc-800 text-xs">
              <div className="font-bold text-zinc-100">{sec.title}</div>
              <p className="text-zinc-400 mt-1.5 leading-relaxed">{sec.observation}</p>
            </div>
          ))
        )}
      </div>
    );
  }

  // INSPECT MODE: Deep security auditor breakdown with HUD scores
  if (mode === 'inspect') {
    return (
      <div className="space-y-5 font-mono text-xs">
        {/* Threat & Privacy HUD Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 bg-black border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">PRIVACY_AUDIT_SCORE</span>
              <div className={`text-2xl font-bold mt-1 ${
                privacyScore >= 80 ? 'text-emerald-400' : privacyScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {privacyScore} / 100
              </div>
            </div>
            <ShieldCheck className="w-7 h-7 text-zinc-700" />
          </div>

          <div className="p-4 bg-black border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">THREAT_SIGNALS</span>
              <div className="text-2xl font-bold text-zinc-100 mt-1">
                {securitySignals.length}
              </div>
            </div>
            <ShieldAlert className="w-7 h-7 text-zinc-700" />
          </div>

          <div className="p-4 bg-black border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">SANDBOX_BOUNDARY</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">
                CLIENT_ISOLATED
              </div>
            </div>
            <Lock className="w-7 h-7 text-zinc-700" />
          </div>
        </div>

        <div>
          <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
            DETAILED_SECURITY_OBSERVATIONS
          </div>
          <div className="space-y-3">
            {securitySignals.map((sec) => (
              <div key={sec.id} className="p-4 bg-black border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 ${
                      sec.severity === 'warning'
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                        : 'text-zinc-400 bg-zinc-900 border border-zinc-800'
                    }`}>
                      {sec.category}
                    </span>
                    <h5 className="font-bold text-zinc-100">{sec.title}</h5>
                  </div>
                  <span className="text-[10px] text-zinc-600">{sec.severity.toUpperCase()}</span>
                </div>
                <p className="text-zinc-300 text-xs mt-2 font-sans">{sec.observation}</p>
                <div className="mt-2.5 p-2 bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400">
                  <div className="text-zinc-500 font-bold mb-1">EVIDENCE_PAYLOAD:</div>
                  <pre className="overflow-x-auto">{JSON.stringify(sec.evidence, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DEBUG MODE: Telemetry security signals
  return (
    <div className="space-y-4 font-mono text-xs">
      <p className="text-zinc-500">
        Factual observations of contacted domains, unencrypted network paths, and potential payload parameters.
      </p>
      {securitySignals.length === 0 ? (
        <p className="text-zinc-600">No anomalous security signals observed during live session.</p>
      ) : (
        securitySignals.map((sec) => (
          <div key={sec.id} className="p-3.5 bg-black border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-700">
                {sec.category}
              </span>
              <h5 className="font-bold text-zinc-100">{sec.title}</h5>
            </div>
            <p className="text-zinc-300 font-sans text-xs mt-1.5">{sec.observation}</p>
            <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-950 p-2 border border-zinc-800/80">
              <pre className="overflow-x-auto">{JSON.stringify(sec.evidence, null, 2)}</pre>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
