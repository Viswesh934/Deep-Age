import React, { useState, useEffect } from 'react';

interface TestDriveLoadingOverlayProps {
  isLoading: boolean;
  targetUrl?: string;
  targetTask?: string;
}

const PHASES = [
  {
    step: '01 / INITIALIZE',
    title: 'Sandboxing Browser Runtime',
    hint: 'Establishing isolated Chromium session and intercepting network streams',
  },
  {
    step: '02 / DISCOVER',
    title: 'Mapping Interactive DOM Canvas',
    hint: 'Extracting clickable controls, navigation routes, and form listeners',
  },
  {
    step: '03 / TRAVERSE',
    title: 'Executing Autonomous Agent Drive',
    hint: 'Simulating user intent, step-by-step clicks, and state transitions',
  },
  {
    step: '04 / COMPILE',
    title: 'Synthesizing Intelligence Ledger',
    hint: 'Generating OpenRouter AI diagnosis, SEO audit, and WebMCP patch code',
  },
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-2xl animate-fade-in p-6 select-none overflow-hidden font-sans text-foreground">
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
            opacity: 0.8;
            border-width: 1.5px;
          }
          100% {
            transform: scale(2.6);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes ambientRain {
          0% { transform: translateY(-30px) scaleY(1); opacity: 0; }
          20% { opacity: 0.25; }
          80% { opacity: 0.25; }
          100% { transform: translateY(100px) scaleY(1.3); opacity: 0; }
        }

        @keyframes warmHalo {
          0%, 100% { transform: scale(1); opacity: 0.4; filter: blur(32px); }
          50% { transform: scale(1.2); opacity: 0.7; filter: blur(40px); }
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

      {/* Ambient background trickle streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute left-[18%] top-1/4 w-0.5 h-10 bg-gradient-to-b from-[#ff8527] to-transparent ambient-drip-1" />
        <div className="absolute left-[30%] top-1/3 w-0.5 h-14 bg-gradient-to-b from-[#f3c83d] to-transparent ambient-drip-2" />
        <div className="absolute right-[25%] top-1/4 w-0.5 h-12 bg-gradient-to-b from-[#5ae561] to-transparent ambient-drip-3" />
        <div className="absolute right-[15%] top-1/3 w-0.5 h-16 bg-gradient-to-b from-[#ff8527] to-transparent ambient-drip-4" />
      </div>

      {/* Soft Center Warm Brand Glow */}
      <div
        className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-[#ff8527]/15 via-[#f3c83d]/10 to-[#5ae561]/15 pointer-events-none"
        style={{ animation: 'warmHalo 4s ease-in-out infinite' }}
      />

      {/* MAIN RAIN CASCADE SCULPTURE */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Top Status Capsule */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/80 text-[11px] font-mono text-muted-foreground backdrop-blur-md shadow-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-[#ff8527] animate-pulse" />
          <span className="tracking-wider uppercase font-semibold text-foreground">Autonomous Runtime Engine</span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-[#ff8527] font-bold">{elapsedSeconds}s</span>
        </div>

        {/* 4-TIER RAIN CASCADE TRACK */}
        <div className="relative flex flex-col items-center h-48 justify-between my-2">
          {/* Central Vertical Falling Stream Glass Column */}
          <div className="absolute top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-[#ff8527]/20 via-[#f3c83d]/30 to-[#5ae561]/20 overflow-hidden">
            {/* Cascading Falling Beads */}
            <div className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-[#ff8527] to-white rounded-full drop-1 shadow-[0_0_8px_#ff8527]" />
            <div className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-[#f3c83d] to-white rounded-full drop-2 shadow-[0_0_8px_#f3c83d]" />
            <div className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-[#5ae561] to-white rounded-full drop-3 shadow-[0_0_8px_#5ae561]" />
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
                    <div className="absolute w-8 h-8 rounded-full border border-[#ff8527]/60 ripple-active pointer-events-none" />
                    <div className="absolute w-8 h-8 rounded-full border border-[#f3c83d]/40 ripple-active pointer-events-none" style={{ animationDelay: '0.8s' }} />
                  </>
                )}

                {/* Droplet Core */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-md ${
                    isCurrent
                      ? 'bg-[#ff8527] text-white scale-125 shadow-[0_0_16px_rgba(255,133,39,0.5)] ring-2 ring-background'
                      : isPassed
                      ? 'bg-[#5ae561] text-black scale-100 shadow-[0_0_10px_rgba(90,229,97,0.4)]'
                      : 'bg-secondary text-muted-foreground border border-border/80 scale-90'
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

        {/* CRISP TYPOGRAPHY & HINTS */}
        <div className="text-center space-y-2 max-w-sm mt-8">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#ff8527]/10 border border-[#ff8527]/25 text-[10px] font-mono font-bold tracking-widest text-[#ff8527] uppercase mb-1">
            {currentPhase.step}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight animate-fade-in transition-all">
            {currentPhase.title}
          </h2>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            {currentPhase.hint}
          </p>

          {/* Target URL & Task Pill */}
          {(targetUrl || targetTask) && (
            <div className="pt-2 flex flex-col items-center gap-1">
              {targetUrl && (
                <span className="inline-block max-w-[280px] truncate text-[11px] font-mono px-3 py-1 rounded-full bg-secondary/70 border border-border/70 text-foreground font-medium">
                  📍 {targetUrl}
                </span>
              )}
              {targetTask && (
                <span className="inline-block max-w-[320px] truncate text-[10px] font-sans px-3 py-0.5 text-muted-foreground">
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
