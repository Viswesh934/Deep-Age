import { NetworkEvent, UserMode } from '@deep-age/shared';

interface NetworkTabProps {
  network: NetworkEvent[];
  mode: UserMode;
}

export function NetworkTab({ network, mode }: NetworkTabProps) {
  if (network.length === 0) {
    return <p className="text-zinc-500 font-mono text-xs">No network packets recorded.</p>;
  }

  // EXPLORE MODE: Friendly conversational activity summary
  if (mode === 'explore') {
    return (
      <div className="space-y-4">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
          Website network activity ({network.length} interactions)
        </div>
        <div className="space-y-2">
          {network.map((net) => {
            let label = 'Loaded website content';
            if (net.url.includes('/api/products')) label = 'Retrieved product catalog & prices';
            else if (net.url.includes('/api/cart')) label = 'Attempted shopping bag update';
            else if (net.origin === 'third-party') label = 'Sent telemetry to external partner';

            return (
              <div key={net.id} className="p-3.5 bg-black border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-zinc-100">{label}</div>
                  <div className="text-zinc-500 text-[11px] font-mono mt-0.5">{net.url}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 text-[10px] font-bold ${net.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {net.status < 400 ? '✓ Success' : '✗ Failed'}
                  </span>
                  <div className="text-zinc-500 text-[10px]">{net.durationMs}ms</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // INSPECT MODE: Security focus (third-party tracking, cleartext, query params)
  if (mode === 'inspect') {
    const thirdParty = network.filter((n) => n.origin === 'third-party');
    const cleartext = network.filter((n) => n.url.startsWith('http://') && !n.url.includes('127.0.0.1') && !n.url.includes('localhost'));

    return (
      <div className="space-y-5 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-black border border-zinc-800">
            <span className="text-zinc-500 text-[10px]">EXTERNAL_ORIGINS:</span>
            <div className="text-sm font-bold text-amber-400 mt-0.5">{thirdParty.length} Requests</div>
          </div>
          <div className="p-3 bg-black border border-zinc-800">
            <span className="text-zinc-500 text-[10px]">CLEARTEXT_HTTP_CALLS:</span>
            <div className="text-sm font-bold text-zinc-100 mt-0.5">{cleartext.length} Requests</div>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
            DETAILED_NETWORK_STREAM_AUDIT
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-800 text-zinc-500 bg-black text-[11px]">
                <tr>
                  <th className="p-2">METHOD</th>
                  <th className="p-2">ORIGIN</th>
                  <th className="p-2">STATUS</th>
                  <th className="p-2">HOST_&_ENDPOINT</th>
                  <th className="p-2">QUERY_PARAMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {network.map((net) => (
                  <tr key={net.id} className="hover:bg-zinc-900/50">
                    <td className="p-2 font-bold text-zinc-200">{net.method}</td>
                    <td className="p-2">
                      <span className={`text-[10px] px-1.5 py-0.5 ${net.origin === 'first-party' ? 'text-zinc-400' : 'text-amber-400 font-bold'}`}>
                        {net.origin.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`text-[10px] ${net.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {net.status}
                      </span>
                    </td>
                    <td className="p-2 truncate max-w-xs text-zinc-300" title={net.url}>{net.url}</td>
                    <td className="p-2 text-zinc-500 text-[10px]">
                      {net.queryParams ? JSON.stringify(net.queryParams) : 'none'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // DEBUG MODE: Full technical HTTP trace
  return (
    <div className="overflow-x-auto font-mono text-xs">
      <table className="w-full text-left">
        <thead className="border-b border-zinc-800 text-zinc-500 bg-black text-[11px]">
          <tr>
            <th className="p-2">METHOD</th>
            <th className="p-2">STATUS</th>
            <th className="p-2">TARGET_URL</th>
            <th className="p-2">ORIGIN</th>
            <th className="p-2">LATENCY</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {network.map((net) => (
            <tr key={net.id} className="hover:bg-zinc-900/50">
              <td className="p-2 font-bold text-zinc-200">{net.method}</td>
              <td className="p-2">
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold ${
                    net.status < 400
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {net.status}
                </span>
              </td>
              <td className="p-2 truncate max-w-sm text-zinc-300" title={net.url}>
                {net.url}
              </td>
              <td className="p-2">
                <span
                  className={`text-[10px] px-1.5 py-0.5 ${
                    net.origin === 'first-party'
                      ? 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {net.origin}
                </span>
              </td>
              <td className="p-2 text-zinc-500">{net.durationMs}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
