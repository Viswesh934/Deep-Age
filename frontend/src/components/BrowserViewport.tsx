import { useState } from 'react';
import { Maximize2, Minimize2, Laptop } from 'lucide-react';

interface BrowserViewportProps {
  screenshot?: string;
  url: string;
  status: string;
  toolsCount: number;
}

export function BrowserViewport({ screenshot, url, status, toolsCount }: BrowserViewportProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-950 border border-zinc-800 flex flex-col font-mono shadow-2xl">
      {/* Top Monitor Bar */}
      <div className="bg-black px-3.5 py-2 border-b border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <span className="font-bold text-zinc-200 text-[11px]">HEADLESS_CHROMIUM_VIEWPORT</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-700 text-zinc-400">
            1280x800
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="text-zinc-500 truncate max-w-[200px]">{url}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand Viewport'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Screen Frame */}
      <div className={`relative bg-black flex items-center justify-center overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[500px]' : 'h-[260px]'
      }`}>
        {screenshot ? (
          <div className="relative w-full h-full group">
            <img
              src={`data:image/jpeg;base64,${screenshot}`}
              alt="Live Headless Chromium Rendering"
              className="w-full h-full object-contain object-top"
            />
            {/* HUD Overlays */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3 opacity-90 group-hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-start">
                <span className="text-[10px] px-2 py-0.5 bg-black/80 border border-zinc-700 text-cyan-400 backdrop-blur">
                  LIVE_DOM_ACTIVE
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-black/80 border border-zinc-700 text-emerald-400 backdrop-blur">
                  WEBMCP_READY ({toolsCount} TOOLS)
                </span>
              </div>
              <div className="flex justify-between items-end text-[10px] text-zinc-400 font-mono">
                <span className="bg-black/90 px-2 py-0.5 border border-zinc-800">
                  STATUS: <strong className="text-zinc-100">{status.toUpperCase()}</strong>
                </span>
                <span className="bg-black/90 px-2 py-0.5 border border-zinc-800 text-zinc-400">
                  REAL CHROMIUM ENGINE
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-600 gap-2 p-6 text-center">
            <Laptop className="w-8 h-8 stroke-1 text-zinc-700 animate-pulse" />
            <p className="text-xs">Live browser viewport initializing...</p>
            <p className="text-[10px] text-zinc-600">Headless Chromium rendering session will stream here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
