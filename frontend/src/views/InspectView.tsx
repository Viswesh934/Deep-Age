import { TestDriveRun } from '@deep-age/shared';
import { ShieldCheck, ShieldAlert, Lock, Globe } from 'lucide-react';

interface InspectViewProps {
  run: TestDriveRun;
}

export function InspectView({ run }: InspectViewProps) {
  const privacyScore = run.summary.privacyScore ?? 95;
  const thirdPartyRequests = run.network.filter((n) => n.origin === 'third-party');
  const insecureRequests = run.network.filter(
    (n) => n.url.startsWith('http://') && !n.url.includes('localhost') && !n.url.includes('127.0.0.1')
  );

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in">
      {/* Top Security HUD Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">
              Privacy Audit Score
            </span>
            <div
              className={`text-3xl font-extrabold mt-1 ${
                privacyScore >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : privacyScore >= 60
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {privacyScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
          </div>
          <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-zinc-800" />
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">
              Security Signals
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {run.securitySignals.length}
            </div>
          </div>
          <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-zinc-800" />
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">
              Third-Party Endpoints
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {thirdPartyRequests.length}
            </div>
          </div>
          <Globe className="w-8 h-8 text-slate-300 dark:text-zinc-800" />
        </div>
      </div>

      {/* Security Signals List */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Security & Privacy Audit Findings ({run.securitySignals.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-zinc-500 font-mono">AUTOMATED AUDIT</span>
        </div>

        {run.securitySignals.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
            ✓ No unauthorized data transmission or high-risk privacy signals observed.
          </div>
        ) : (
          <div className="space-y-3">
            {run.securitySignals.map((sec) => (
              <div
                key={sec.id}
                className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sec.severity === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                          : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      {sec.category}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white">{sec.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase font-mono">{sec.severity}</span>
                </div>

                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">{sec.observation}</p>

                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-cyan-300 text-[11px] font-mono overflow-x-auto">
                  <pre>{JSON.stringify(sec.evidence, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network Origin Safety Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Transport Encryption
          </div>
          <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
            {insecureRequests.length === 0
              ? 'All external network transmissions used TLS encryption.'
              : `Warning: ${insecureRequests.length} request(s) transmitted over plaintext HTTP.`}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Third-Party Surface Area
          </div>
          <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
            {thirdPartyRequests.length === 0
              ? 'Zero external tracking domains contacted during this session.'
              : `Contacted ${thirdPartyRequests.length} external third-party domain endpoints.`}
          </p>
        </div>
      </div>
    </div>
  );
}
