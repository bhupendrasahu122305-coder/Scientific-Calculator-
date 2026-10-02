import React from 'react';
import { playKeyClick } from '../utils/audioFeedback';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface CasioKeypadProps {
  onKeyPress: (action: string, isShift: boolean, isAlpha: boolean) => void;
  isShift: boolean;
  isAlpha: boolean;
  onToggleShift: () => void;
  onToggleAlpha: () => void;
  onOpenMenu: () => void;
  onCursorMove: (dir: 'left' | 'right') => void;
  onHistoryStep: (dir: 'up' | 'down') => void;
  onClearAll: () => void;
  onDeleteChar: () => void;
  onCalculate: () => void;
}

export const CasioKeypad: React.FC<CasioKeypadProps> = ({
  onKeyPress,
  isShift,
  isAlpha,
  onToggleShift,
  onToggleAlpha,
  onOpenMenu,
  onCursorMove,
  onHistoryStep,
  onClearAll,
  onDeleteChar,
  onCalculate,
}) => {
  const handleKey = (primary: string, shiftVal?: string, alphaVal?: string, type: 'num' | 'op' | 'func' | 'action' = 'func') => {
    playKeyClick(type);
    if (isShift && shiftVal) {
      onKeyPress(shiftVal, true, false);
    } else if (isAlpha && alphaVal) {
      onKeyPress(alphaVal, false, true);
    } else {
      onKeyPress(primary, false, false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-[#121824] rounded-2xl border border-slate-800 shadow-xl select-none">
      {/* Top Deck: SHIFT, ALPHA, D-PAD, MENU, ON */}
      <div className="grid grid-cols-5 gap-1.5 items-center pb-1">
        {/* SHIFT KEY (Gold) */}
        <button
          onClick={() => {
            playKeyClick('action');
            onToggleShift();
          }}
          className={`h-10 rounded-xl flex flex-col items-center justify-center font-mono text-[11px] font-bold transition-all active:scale-95 shadow-sm border ${
            isShift
              ? 'bg-amber-400 text-neutral-950 border-amber-300 ring-2 ring-amber-400/50'
              : 'bg-slate-800/90 text-amber-400 border-amber-500/30 hover:bg-slate-700/90'
          }`}
        >
          <span>SHIFT</span>
        </button>

        {/* ALPHA KEY (Red) */}
        <button
          onClick={() => {
            playKeyClick('action');
            onToggleAlpha();
          }}
          className={`h-10 rounded-xl flex flex-col items-center justify-center font-mono text-[11px] font-bold transition-all active:scale-95 shadow-sm border ${
            isAlpha
              ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-500/50'
              : 'bg-slate-800/90 text-rose-400 border-rose-500/30 hover:bg-slate-700/90'
          }`}
        >
          <span>ALPHA</span>
        </button>

        {/* 4-Way Replay D-Pad (Center Controller) */}
        <div className="relative w-full h-11 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center shadow-inner">
          <button
            onClick={() => {
              playKeyClick('action');
              onHistoryStep('up');
            }}
            className="absolute top-0 w-8 h-4 flex items-center justify-center text-slate-400 hover:text-white"
            title="History Up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              playKeyClick('action');
              onHistoryStep('down');
            }}
            className="absolute bottom-0 w-8 h-4 flex items-center justify-center text-slate-400 hover:text-white"
            title="History Down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              playKeyClick('action');
              onCursorMove('left');
            }}
            className="absolute left-0 h-8 w-4 flex items-center justify-center text-slate-400 hover:text-white"
            title="Cursor Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              playKeyClick('action');
              onCursorMove('right');
            }}
            className="absolute right-0 h-8 w-4 flex items-center justify-center text-slate-400 hover:text-white"
            title="Cursor Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] font-mono text-slate-500 font-bold pointer-events-none">
            REPLAY
          </span>
        </div>

        {/* MENU / MODE */}
        <button
          onClick={() => {
            playKeyClick('action');
            onOpenMenu();
          }}
          className="h-10 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex flex-col items-center justify-center font-mono text-[10px] font-semibold text-sky-300 transition-all active:scale-95"
        >
          <span className="text-[8px] text-slate-400">SET UP</span>
          <span>MENU</span>
        </button>

        {/* ON / AC */}
        <button
          onClick={() => {
            playKeyClick('action');
            onClearAll();
          }}
          className="h-10 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex flex-col items-center justify-center font-mono text-[11px] font-bold text-slate-200 transition-all active:scale-95"
        >
          <span>ON</span>
        </button>
      </div>

      {/* Row 1: Function Keys */}
      <div className="grid grid-cols-6 gap-1">
        {[
          { label: 'x⁻¹', shift: 'x!', alpha: 'A', id: 'pow_neg1' },
          { label: '√', shift: '³√', alpha: 'B', id: 'sqrt' },
          { label: 'x²', shift: 'x³', alpha: 'C', id: 'sqr' },
          { label: 'x^■', shift: '■√', alpha: 'D', id: 'pow' },
          { label: 'log', shift: '10^x', alpha: 'E', id: 'log' },
          { label: 'ln', shift: 'e^x', alpha: 'F', id: 'ln' },
        ].map(k => (
          <button
            key={k.id}
            onClick={() => handleKey(k.label, k.shift, k.alpha, 'func')}
            className="h-9 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg flex flex-col items-center justify-center relative active:scale-95 transition-transform"
          >
            <div className="absolute -top-1 w-full flex justify-between px-1 text-[8px] font-mono leading-none">
              <span className="text-amber-400 font-bold">{k.shift}</span>
              <span className="text-rose-400 font-bold">{k.alpha}</span>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-200 mt-1">{k.label}</span>
          </button>
        ))}
      </div>

      {/* Row 2: Calculus, Trig & Variables */}
      <div className="grid grid-cols-6 gap-1">
        {[
          { label: '(-)', shift: 'Ran#', alpha: 'X', id: 'neg' },
          { label: '° \' "', shift: '←', alpha: 'Y', id: 'deg_min' },
          { label: 'd/dx', shift: '∫dx', alpha: 'M', id: 'calculus' },
          { label: 'sin', shift: 'sin⁻¹', alpha: '', id: 'sin' },
          { label: 'cos', shift: 'cos⁻¹', alpha: '', id: 'cos' },
          { label: 'tan', shift: 'tan⁻¹', alpha: '', id: 'tan' },
        ].map(k => (
          <button
            key={k.id}
            onClick={() => handleKey(k.label, k.shift, k.alpha, 'func')}
            className="h-9 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg flex flex-col items-center justify-center relative active:scale-95 transition-transform"
          >
            <div className="absolute -top-1 w-full flex justify-between px-1 text-[8px] font-mono leading-none">
              <span className="text-amber-400 font-bold">{k.shift}</span>
              <span className="text-rose-400 font-bold">{k.alpha}</span>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-200 mt-1">{k.label}</span>
          </button>
        ))}
      </div>

      {/* Row 3: Memory, Engineering & S<=>D */}
      <div className="grid grid-cols-6 gap-1">
        {[
          { label: 'STO', shift: 'RCL', alpha: '', id: 'sto' },
          { label: 'ENG', shift: '←', alpha: 'i', id: 'eng' },
          { label: '(', shift: '%', alpha: '', id: 'lparen' },
          { label: ')', shift: ',', alpha: '', id: 'rparen' },
          { label: 'S⇔D', shift: 'a b/c', alpha: '', id: 'sd' },
          { label: 'M+', shift: 'M-', alpha: 'M', id: 'mplus' },
        ].map(k => (
          <button
            key={k.id}
            onClick={() => handleKey(k.label, k.shift, k.alpha, 'func')}
            className="h-9 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg flex flex-col items-center justify-center relative active:scale-95 transition-transform"
          >
            <div className="absolute -top-1 w-full flex justify-between px-1 text-[8px] font-mono leading-none">
              <span className="text-amber-400 font-bold">{k.shift}</span>
              <span className="text-rose-400 font-bold">{k.alpha}</span>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-200 mt-1">{k.label}</span>
          </button>
        ))}
      </div>

      {/* Primary Keypad Divider */}
      <div className="h-0.5 bg-slate-800/80 my-0.5" />

      {/* Row 4: 7, 8, 9, DEL, AC */}
      <div className="grid grid-cols-5 gap-1.5">
        <button
          onClick={() => handleKey('7', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          7
        </button>
        <button
          onClick={() => handleKey('8', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          8
        </button>
        <button
          onClick={() => handleKey('9', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          9
        </button>

        {/* DEL Key (Casio blue/purple or accent) */}
        <button
          onClick={() => {
            playKeyClick('action');
            onDeleteChar();
          }}
          className="h-11 bg-sky-900/40 hover:bg-sky-900/60 border border-sky-600/50 rounded-xl font-mono text-sm font-bold text-sky-300 shadow-sm active:scale-95 transition-transform flex flex-col items-center justify-center"
        >
          <span className="text-[8px] text-amber-400">INS</span>
          <span>DEL</span>
        </button>

        {/* AC Key (Orange / Coral Red) */}
        <button
          onClick={() => {
            playKeyClick('action');
            onClearAll();
          }}
          className="h-11 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/60 rounded-xl font-mono text-sm font-bold text-rose-300 shadow-sm active:scale-95 transition-transform flex flex-col items-center justify-center"
        >
          <span className="text-[8px] text-amber-400">OFF</span>
          <span>AC</span>
        </button>
      </div>

      {/* Row 5: 4, 5, 6, ×, ÷ */}
      <div className="grid grid-cols-5 gap-1.5">
        <button
          onClick={() => handleKey('4', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          4
        </button>
        <button
          onClick={() => handleKey('5', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          5
        </button>
        <button
          onClick={() => handleKey('6', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          6
        </button>
        <button
          onClick={() => handleKey('×', 'nPr', undefined, 'op')}
          className="h-11 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-base font-bold text-slate-200 shadow-sm active:scale-95 transition-transform relative flex flex-col items-center justify-center"
        >
          <span className="absolute top-0.5 text-[8px] text-amber-400 font-mono">nPr</span>
          <span className="mt-1 text-lg">×</span>
        </button>
        <button
          onClick={() => handleKey('÷', 'nCr', undefined, 'op')}
          className="h-11 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-base font-bold text-slate-200 shadow-sm active:scale-95 transition-transform relative flex flex-col items-center justify-center"
        >
          <span className="absolute top-0.5 text-[8px] text-amber-400 font-mono">nCr</span>
          <span className="mt-1 text-lg">÷</span>
        </button>
      </div>

      {/* Row 6: 1, 2, 3, +, - */}
      <div className="grid grid-cols-5 gap-1.5">
        <button
          onClick={() => handleKey('1', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          1
        </button>
        <button
          onClick={() => handleKey('2', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          2
        </button>
        <button
          onClick={() => handleKey('3', undefined, undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          3
        </button>
        <button
          onClick={() => handleKey('+', 'Pol', undefined, 'op')}
          className="h-11 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-base font-bold text-slate-200 shadow-sm active:scale-95 transition-transform relative flex flex-col items-center justify-center"
        >
          <span className="absolute top-0.5 text-[8px] text-amber-400 font-mono">Pol</span>
          <span className="mt-1 text-lg">+</span>
        </button>
        <button
          onClick={() => handleKey('−', 'Rec', undefined, 'op')}
          className="h-11 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-base font-bold text-slate-200 shadow-sm active:scale-95 transition-transform relative flex flex-col items-center justify-center"
        >
          <span className="absolute top-0.5 text-[8px] text-amber-400 font-mono">Rec</span>
          <span className="mt-1 text-lg">−</span>
        </button>
      </div>

      {/* Row 7: 0, ., ×10ˣ, Ans, = */}
      <div className="grid grid-cols-5 gap-1.5">
        <button
          onClick={() => handleKey('0', 'Rnd', undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform relative flex flex-col items-center justify-center"
        >
          <span className="absolute top-0.5 text-[8px] text-amber-400 font-mono">Rnd</span>
          <span className="mt-1">0</span>
        </button>
        <button
          onClick={() => handleKey('.', 'Ran#', undefined, 'num')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-lg font-bold text-white shadow-sm active:scale-95 transition-transform relative flex flex-col items-center justify-center"
        >
          <span className="absolute top-0.5 text-[8px] text-amber-400 font-mono">Ran#</span>
          <span className="mt-1">.</span>
        </button>
        <button
          onClick={() => handleKey('×10^', 'π', 'e', 'func')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-200 shadow-sm active:scale-95 transition-transform relative flex flex-col items-center justify-center"
        >
          <div className="absolute top-0.5 w-full flex justify-between px-1 text-[8px] font-mono leading-none">
            <span className="text-amber-400">π</span>
            <span className="text-rose-400">e</span>
          </div>
          <span className="mt-1.5">×10ˣ</span>
        </button>
        <button
          onClick={() => handleKey('Ans', 'PreAns', undefined, 'func')}
          className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-200 shadow-sm active:scale-95 transition-transform relative flex flex-col items-center justify-center"
        >
          <span className="absolute top-0.5 text-[8px] text-amber-400 font-mono">PreAns</span>
          <span className="mt-1.5">Ans</span>
        </button>

        {/* EQUALS KEY (=) in Casio Gold/Emerald */}
        <button
          onClick={() => {
            playKeyClick('action');
            onCalculate();
          }}
          className="h-11 bg-amber-500 hover:bg-amber-400 border border-amber-400 rounded-xl font-mono text-xl font-black text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center"
        >
          =
        </button>
      </div>
    </div>
  );
};
