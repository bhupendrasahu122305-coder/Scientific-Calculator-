import React from 'react';
import { CalculatorMode } from '../types/calculator';
import {
  Calculator,
  LineChart,
  Table,
  Hash,
  BarChart3,
  Grid,
  Atom,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/audioFeedback';

interface ModeSelectorModalProps {
  currentMode: CalculatorMode;
  onSelectMode: (mode: CalculatorMode) => void;
  onClose: () => void;
  soundActive: boolean;
  onToggleSound: () => void;
}

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  currentMode,
  onSelectMode,
  onClose,
  soundActive,
  onToggleSound,
}) => {
  const modes: Array<{
    id: CalculatorMode;
    num: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'COMP',
      num: 1,
      title: 'Calculate (COMP)',
      subtitle: 'Arithmetic, trig, calculus, powers & roots',
      icon: <Calculator className="w-5 h-5" />,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    },
    {
      id: 'GRAPH',
      num: 2,
      title: 'Advanced Graphing',
      subtitle: 'Multi-curve plot, G-Solve, roots, extrema, area',
      icon: <LineChart className="w-5 h-5" />,
      color: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
    },
    {
      id: 'TABLE',
      num: 3,
      title: 'Table Generator',
      subtitle: 'Generate f(x) & g(x) value spreadsheets',
      icon: <Table className="w-5 h-5" />,
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    },
    {
      id: 'EQUATION',
      num: 4,
      title: 'Equation Solver',
      subtitle: 'Quadratic, cubic & simultaneous linear systems',
      icon: <Hash className="w-5 h-5" />,
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    },
    {
      id: 'STAT',
      num: 5,
      title: 'Statistics (1-VAR)',
      subtitle: 'Data frequencies, mean, standard dev, quartiles',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
    },
    {
      id: 'MATRIX',
      num: 6,
      title: 'Matrix Algebra',
      subtitle: '2×2 and 3×3 determinants, inverse, multiplication',
      icon: <Grid className="w-5 h-5" />,
      color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
    },
    {
      id: 'CONVERT',
      num: 7,
      title: 'Constants & Units',
      subtitle: 'Physics constants & imperial/metric converter',
      icon: <Atom className="w-5 h-5" />,
      color: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
    },
  ];

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end p-3 animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl p-4 shadow-2xl space-y-3 max-h-[90%] overflow-y-auto">
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              CASIO CLASSWIZ MAIN MENU
            </h3>
            <p className="text-[11px] text-slate-400">Select calculation mode or setting</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border ${
                soundActive
                  ? 'bg-slate-800 text-amber-400 border-slate-700'
                  : 'bg-slate-800/50 text-slate-500 border-slate-800'
              }`}
              title="Key Click Sound"
            >
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {modes.map(m => {
            const isCurrent = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelectMode(m.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all active:scale-[0.98] ${
                  isCurrent
                    ? 'bg-slate-800/90 border-amber-400/60 ring-1 ring-amber-400/40 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border font-mono font-bold shrink-0 ${m.color}`}
                >
                  {m.icon}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-bold">{m.num}:</span>
                    <span className="text-xs font-bold text-white">{m.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{m.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
