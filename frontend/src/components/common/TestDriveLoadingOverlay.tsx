import React, { useState, useEffect } from 'react';

interface TestDriveLoadingOverlayProps {
  isLoading: boolean;
  targetUrl?: string;
  targetTask?: string;
}

const PHASES = [
  { title: 'Catching the first raindrops...', hint: 'Landing on the website and scanning the layout' },
  { title: 'Trickling through interactive currents...', hint: 'Finding buttons, menus, and conversion paths' },
  { title: 'Navigating the goal stream...', hint: 'Testing clicks, inputs, and autonomous workflows' },
  { title: 'Distilling the final report...', hint: 'Synthesizing SEO, readability, and instant code fixes' },
];

export const TestDriveLoadingOverlay: React.FC<TestDriveLoadingOverlayProps> = ({
  isLoading,
  targetUrl,
  targetTask,
}) => {
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isLoading) {
      setPhaseIndex(0);
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const phaseTimer = setInterval(() => {
      setPhaseIndex((prev) => (prev < PHASES.length - 1 ? prev + 1 : 0));
    }, 2800);

    return () => {
      clearInterval(timer);
      clearInterval(phaseTimer);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const currentPhase = PHASES[phaseIndex] || PHASES[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl animate-fade-in p-6 select-none overflow-hidden font-sans">
      <style>{`
        @keyframes rainDropFall {
          0% {
            top: 0%;
            transform: scale(0.7, 1.4) translateY(-10px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          85% {
            opacity: 1;
            transform: scale(0.9, 1.2) translateY(0);
          }
          100% {
            top: 100%;
            transform: scale(1.6, 0.4) translateY(6px);
            opacity: 0;
          }
        }

        @keyframes rainRippleWave {
          0% {
            transform: scale(0.8);
            opacity: 0.9;
            border-width: 2px;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes ambientRain {
          0% { transform: translateY(-40px) scaleY(1); opacity: 0; }
          20% { opacity: 0.4; }
          80% { opacity: 0.4; }
          100% { transform: translateY(120px) scaleY(1.3); opacity: 0; }
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.7; filter: blur(20px); }
          50% { transform: scale(1.25); opacity: 1; filter: blur(28px); }
        }

        .drop-1 {
          animation: rainDropFall 2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .drop-2 {
          animation: rainDropFall 2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          animation-delay: 0.65s;
        }
        .drop-3 {
          animation: rainDropFall 2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          animation-delay: 1.3s;
        }

        .ambient-drip-1 { animation: ambientRain 1.4s linear infinite; animation-delay: 0.1s; }
        .ambient-drip-2 { animation: ambientRain 1.8s linear infinite; animation-delay: 0.7s; }
        .ambient-drip-3 { animation: ambientRain 1.2s linear infinite; animation-delay: 0.4s; }
        .ambient-drip-4 { animation: ambientRain 1.6s linear infinite; animation-delay: 1.1s; }

        .ripple-active {
          animation: rainRippleWave 1.6s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
        }
      `}</style>

      {/* Ambient background rain streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute left-[15%] top-1/4 w-0.5 h-10 bg-gradient-to-b from-sky-400 to-transparent ambient-drip-1" />
        <div className="absolute left-[28%] top-1/3 w-0.5 h-14 bg-gradient-to-b from-cyan-400 to-transparent ambient-drip-2" />
        <div className="absolute right-[22%] top-1/4 w-0.5 h-12 bg-gradient-to-b from-teal-400 to-transparent ambient-drip-3" />
        <div className="absolute right-[12%] top-1/3 w-0.5 h-16 bg-gradient-to-b from-emerald-400 to-transparent ambient-drip-4" />
      </div>

      {/* Center Soft Aurora Glow */}
      <div
        className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-sky-500/20 via-cyan-400/20 to-emerald-400/20 pointer-events-none"
        style={{ animation: 'pulseGlow 4s ease-in-out infinite' }}
      />

      {/* MAIN RAIN CASCADE SCULPTURE */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Top Status Capsule */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-white/80 backdrop-blur-md shadow-2xl mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>AUTONOMOUS AGENT PATROL</span>
          <span className="text-white/30">•</span>
          <span className="text-cyan-400 font-bold">{elapsedSeconds}s</span>
        </div>

        {/* 4-TIER RAIN CASCADE TRACK */}
        <div className="relative flex flex-col items-center h-48 justify-between my-2">
          {/* Central Vertical Falling Stream Glass Column */}
          <div className="absolute top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-sky-400/10 via-cyan-400/25 to-emerald-400/10 overflow-hidden">
            {/* Cascading Falling Beads */}
            <div className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-cyan-300 to-white rounded-full drop-1 shadow-[0_0_12px_#38bdf8]" />
            <div className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-sky-400 to-white rounded-full drop-2 shadow-[0_0_12px_#38bdf8]" />
            <div className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-emerald-300 to-white rounded-full drop-3 shadow-[0_0_12px_#34d399]" />
          </div>

          {/* 4 Cascading Glass Rings */}
          {[0, 1, 2, 3].map((idx) => {
            const isCurrent = idx === phaseIndex;
            const isPassed = idx < phaseIndex;

            return (
              <div key={idx} className="relative flex items-center justify-center">
                {/* Outer Ripple Effect */}
                {isCurrent && (
                  <>
                    <div className="absolute w-8 h-8 rounded-full border border-cyan-400/60 ripple-active pointer-events-none" />
                    <div className="absolute w-8 h-8 rounded-full border border-sky-400/40 ripple-active pointer-events-none" style={{ animationDelay: '0.8s' }} />
                  </>
                )}

                {/* Glass Droplet Core */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-md ${
                    isCurrent
                      ? 'bg-cyan-400 text-black scale-125 shadow-[0_0_24px_rgba(34,211,238,0.9)] ring-2 ring-white'
                      : isPassed
                      ? 'bg-emerald-400/80 text-black scale-100 shadow-[0_0_14px_rgba(52,211,153,0.6)]'
                      : 'bg-white/10 text-white/40 border border-white/10 scale-90'
                  }`}
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${isCurrent ? 'animate-bounce' : ''}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* ELEGANT TYPOGRAPHY & HINTS */}
        <div className="text-center space-y-2 max-w-sm mt-8">
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight animate-fade-in transition-all">
            {currentPhase.title}
          </h2>
          <p className="text-xs text-white/60 font-normal leading-relaxed">
            {currentPhase.hint}
          </p>

          {/* Target URL & Task Pill */}
          {(targetUrl || targetTask) && (
            <div className="pt-2 flex flex-col items-center gap-1">
              {targetUrl && (
                <span className="inline-block max-w-[280px] truncate text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300/80">
                  📍 {targetUrl}
                </span>
              )}
              {targetTask && (
                <span className="inline-block max-w-[320px] truncate text-[10px] font-sans px-3 py-0.5 text-white/40">
                  🎯 {targetTask}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
