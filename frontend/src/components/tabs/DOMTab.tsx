import { DOMInteractionEvent, UserMode } from '@deep-age/shared';

interface DOMTabProps {
  domInteractions: DOMInteractionEvent[];
  mode: UserMode;
}

export function DOMTab({ domInteractions, mode }: DOMTabProps) {
  if (domInteractions.length === 0) {
    return <p className="text-zinc-500 font-mono text-xs">No interactive DOM controls detected.</p>;
  }

  // EXPLORE MODE: Friendly visual list
  if (mode === 'explore') {
    return (
      <div className="space-y-4">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
          Visual buttons & inputs noticed on screen ({domInteractions.length})
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {domInteractions.map((d) => (
            <div key={d.id} className="p-3.5 bg-black border border-zinc-800 text-xs">
              <div className="font-semibold text-zinc-100">{d.text || 'Interactive control'}</div>
              <div className="text-zinc-500 text-[11px] mt-1">
                Type: {d.elementTag.toLowerCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // INSPECT MODE: Input surface inspection
  if (mode === 'inspect') {
    return (
      <div className="space-y-4 font-mono text-xs">
        <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
          DOM_ATTACK_SURFACE_&_INPUT_AUDIT ({domInteractions.length})
        </div>
        <div className="space-y-2">
          {domInteractions.map((d) => (
            <div key={d.id} className="p-3 bg-black border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="font-bold">{d.selector}</span>
                <span className="text-zinc-500 text-[10px]">TAG: {d.elementTag}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                Attributes: {JSON.stringify(d.attributes)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DEBUG MODE: Full technical DOM controls
  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
        CAPTURED_DOM_CONTROLS ({domInteractions.length})
      </div>
      {domInteractions.map((d) => (
        <div key={d.id} className="p-2.5 bg-black border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-zinc-200 font-bold">{d.selector}</span>
            <span className="text-zinc-500 text-[10px]">&lt;{d.elementTag}&gt;</span>
          </div>
          {d.text && <div className="text-zinc-400 mt-1">TEXT: "{d.text}"</div>}
          {d.attributes && Object.keys(d.attributes).length > 0 && (
            <div className="text-zinc-600 text-[10px] mt-1">
              ATTRS: {JSON.stringify(d.attributes)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
