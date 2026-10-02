import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, Smartphone, Maximize, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { CalculatorMode, AngleUnit } from '../types/calculator';

interface AndroidFrameProps {
  children: React.ReactNode;
  currentMode: CalculatorMode;
  onOpenMenu: () => void;
  angleUnit: AngleUnit;
  onToggleAngleUnit: () => void;
  soundActive: boolean;
  onToggleSound: () => void;
  onReset: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  currentMode,
  onOpenMenu,
  angleUnit,
  onToggleAngleUnit,
  soundActive,
  onToggleSound,
  onReset,
}) => {
  // Live Android status clock
  const [timeStr, setTimeStr] = useState('12:30');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const modeLabels: Record<CalculatorMode, string> = {
    COMP: 'COMP',
    GRAPH: 'GRAPH',
    TABLE: 'TABLE',
    EQUATION: 'EQUA',
    STAT: 'STAT',
    MATRIX: 'MATRIX',
    CONVERT: 'CONV',
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-0 sm:p-4 text-slate-100 font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Top Desktop Utility Bar (Only visible on wide screens to switch frame mode) */}
      <header className="hidden sm:flex items-center justify-between w-full max-w-md mb-2 px-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">
          Casio fx-991EX ClassWiz
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors"
            title="Toggle Phone Frame"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isPhoneFrame ? 'Phone Frame' : 'Full Width'}</span>
          </button>
        </div>
      </header>

      {/* Android Device Shell Container */}
      <main
        className={`w-full transition-all duration-300 relative flex flex-col bg-[#0b101b] overflow-hidden ${
          isPhoneFrame
            ? 'sm:max-w-[430px] sm:h-[900px] sm:rounded-[44px] sm:border-[9px] sm:border-[#1e293b] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)]'
            : 'max-w-2xl min-h-screen sm:rounded-2xl sm:border sm:border-slate-800'
        } h-screen sm:h-auto`}
      >
        {/* Android Status Bar with Camera Punch-Hole */}
        <div className="h-10 px-5 pt-2 pb-1 flex items-center justify-between text-xs text-slate-300 select-none shrink-0 relative bg-[#0b101b] z-20">
          {/* Left: Clock */}
          <span className="font-semibold font-mono text-[11px] tracking-tight">{timeStr}</span>

          {/* Center: Camera Punch-Hole (Android styling) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 bg-black rounded-full border border-neutral-800/80 shadow-inner flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 bg-neutral-900 rounded-full" />
          </div>

          {/* Right: Signal, Wi-Fi, Battery */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <div className="flex items-center gap-0.5 font-mono text-[10px]">
              <span>98%</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Casio App Header Bar (Casio fx-991EX ClassWiz styling) */}
        <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0d1422] z-20">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-white font-mono text-xs">
              CASIO
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-tighter">
              fx-ClassWiz
            </span>
          </div>

          {/* Mode Pill & Quick Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenMenu}
              className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
            >
              <span>MODE:</span>
              <strong className="text-white">{modeLabels[currentMode]}</strong>
            </button>

            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-full border transition-colors ${
                soundActive
                  ? 'bg-slate-800 text-amber-400 border-slate-700'
                  : 'bg-slate-900 text-slate-600 border-slate-800'
              }`}
              title={soundActive ? 'Sound Muted' : 'Sound Enabled'}
            >
              {soundActive ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Main Content Area (Calculator Display + Keypad or Graph or Table) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* Android Bottom Navigation Pill Bar (Gesture Home Indicator) */}
        <div className="h-6 w-full flex items-center justify-center shrink-0 bg-[#0b101b] z-20">
          <div className="w-32 h-1 bg-slate-600/70 rounded-full" />
        </div>
      </main>
    </div>
  );
};
