import React, { useRef, useEffect } from 'react';
import { AngleUnit, HistoryItem } from '../types/calculator';
import { History, Copy, Check, Sparkles } from 'lucide-react';

interface CasioDisplayProps {
  expression: string;
  cursorPos: number;
  result: string;
  exactFraction?: string;
  isShift: boolean;
  isAlpha: boolean;
  angleUnit: AngleUnit;
  hasMemory: boolean;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onToggleAngleUnit: () => void;
  onToggleSD: () => void;
  showingExact: boolean;
}

export const CasioDisplay: React.FC<CasioDisplayProps> = ({
  expression,
  cursorPos,
  result,
  exactFraction,
  isShift,
  isAlpha,
  angleUnit,
  hasMemory,
  history,
  onSelectHistory,
  onToggleAngleUnit,
  onToggleSD,
  showingExact,
}) => {
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const exprContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll expression when cursor moves
  useEffect(() => {
    if (exprContainerRef.current) {
      exprContainerRef.current.scrollLeft = exprContainerRef.current.scrollWidth;
    }
  }, [expression, cursorPos]);

  const handleCopyResult = () => {
    const textToCopy = showingExact && exactFraction ? exactFraction : result;
    if (textToCopy && textToCopy !== 'Math ERROR' && textToCopy !== 'Syntax ERROR') {
      navigator.clipboard?.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  // Render expression with blinking cursor at cursorPos
  const renderExpressionWithCursor = () => {
    if (!expression) {
      return (
        <span className="inline-block relative">
          <span className="opacity-0">0</span>
          <span className="inline-block w-0.5 h-4 bg-emerald-400 animate-pulse align-middle ml-0.5" />
        </span>
      );
    }

    const before = expression.slice(0, cursorPos);
    const after = expression.slice(cursorPos);

    return (
      <span className="whitespace-pre">
        {before}
        <span className="inline-block w-0.5 h-4 bg-emerald-400 animate-pulse align-middle -mt-0.5" />
        {after}
      </span>
    );
  };

  const displayedResult = showingExact && exactFraction ? exactFraction : result;

  return (
    <div className="relative bg-[#0d141e] border-2 border-neutral-800 rounded-2xl p-3 shadow-inner flex flex-col justify-between min-h-[120px] transition-all">
      {/* Top LCD Status Indicators (Casio Natural-V.P.A.M. Header) */}
      <div className="flex items-center justify-between text-[10px] font-mono tracking-wider border-b border-slate-800/80 pb-1 mb-1">
        <div className="flex items-center gap-2">
          {/* Shift Indicator (Gold) */}
          <span
            className={`font-bold px-1 rounded transition-colors ${
              isShift ? 'bg-amber-400 text-neutral-950 font-black' : 'text-slate-700'
            }`}
          >
            S
          </span>

          {/* Alpha Indicator (Red) */}
          <span
            className={`font-bold px-1 rounded transition-colors ${
              isAlpha ? 'bg-rose-500 text-white font-black' : 'text-slate-700'
            }`}
          >
            A
          </span>

          {/* Memory Indicator */}
          <span
            className={`font-bold transition-colors ${
              hasMemory ? 'text-amber-400' : 'text-slate-700'
            }`}
          >
            M
          </span>

          {/* Angle Unit Toggle */}
          <button
            onClick={onToggleAngleUnit}
            className="px-1.5 py-0.5 rounded bg-slate-800/80 text-sky-400 hover:text-sky-300 font-bold hover:bg-slate-700 transition-colors"
            title="Click to toggle DEG/RAD/GRAD"
          >
            {angleUnit}
          </button>

          {/* Natural Math Display Indicator */}
          <span className="text-emerald-500/80 font-bold hidden sm:inline">MATH</span>
        </div>

        {/* History Tape Drawer Button */}
        <div className="flex items-center gap-1.5">
          {exactFraction && (
            <button
              onClick={onToggleSD}
              className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-[9px] font-bold border border-amber-500/30"
              title="Casio S<=>D Fraction/Decimal Toggle"
            >
              {showingExact ? 'DEC' : 'FRAC'}
            </button>
          )}

          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 px-1 py-0.5 rounded hover:bg-slate-800"
            title="History Tape"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Hist</span>
          </button>
        </div>
      </div>

      {/* Main Expression Input Line (Scrollable) */}
      <div
        ref={exprContainerRef}
        className="overflow-x-auto overflow-y-hidden py-1.5 text-base sm:text-lg font-mono text-slate-200 scrollbar-none tracking-normal"
        style={{ scrollbarWidth: 'none', minHeight: '28px' }}
      >
        {renderExpressionWithCursor()}
      </div>

      {/* Evaluation Result Display (Right-aligned, Big & Bold) */}
      <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/50 mt-1">
        <div className="text-[10px] text-slate-500 font-mono">
          {exactFraction && !showingExact && (
            <span className="text-amber-400/80 cursor-pointer" onClick={onToggleSD}>
              ≈ {exactFraction} (S⇔D)
            </span>
          )}
        </div>

        <div
          onClick={handleCopyResult}
          className="flex items-baseline gap-2 cursor-pointer group select-text"
          title="Click to copy result"
        >
          <span
            className={`font-mono font-bold text-2xl sm:text-3xl tracking-tight transition-colors ${
              result === 'Math ERROR' || result === 'Syntax ERROR'
                ? 'text-rose-400 text-lg'
                : 'text-white group-hover:text-emerald-300'
            }`}
          >
            {displayedResult || '0'}
          </span>
          <button
            className="text-slate-600 group-hover:text-slate-300 p-0.5 transition-colors"
            title="Copy result"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* History Drawer Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl z-20 p-3 flex flex-col justify-between border border-slate-700 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>Calculation History</span>
            </span>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-2 text-xs font-mono">
            {history.length === 0 ? (
              <div className="text-center text-slate-500 py-6">No previous calculations</div>
            ) : (
              history.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectHistory(item);
                    setShowHistoryModal(false);
                  }}
                  className="p-2 bg-slate-900/80 hover:bg-slate-800/80 rounded-xl cursor-pointer border border-slate-800 transition-colors"
                >
                  <div className="text-slate-400 text-[11px] truncate">{item.expression}</div>
                  <div className="text-emerald-400 font-bold text-sm text-right mt-0.5">
                    = {item.result}
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-[10px] text-slate-500 text-center pt-1 border-t border-slate-800">
            Tap any item to recall into calculator
          </p>
        </div>
      )}
    </div>
  );
};
