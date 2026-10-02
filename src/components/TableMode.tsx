import React, { useState, useMemo } from 'react';
import { GraphFunction, AngleUnit } from '../types/calculator';
import { createFunctionEvaluator, formatResult } from '../utils/mathEngine';
import { Table, Play, ArrowRight, Copy, Check } from 'lucide-react';

interface TableModeProps {
  functions: GraphFunction[];
  angleUnit: AngleUnit;
  onNavigateToGraph: () => void;
  onInsertToCalc?: (val: string) => void;
}

export const TableMode: React.FC<TableModeProps> = ({
  functions,
  angleUnit,
  onNavigateToGraph,
  onInsertToCalc,
}) => {
  const [start, setStart] = useState<number>(-5);
  const [end, setEnd] = useState<number>(5);
  const [step, setStep] = useState<number>(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Available functions
  const activeFuncs = useMemo(() => {
    return functions.filter(f => f.enabled && f.expr.trim());
  }, [functions]);

  // Evaluators
  const evaluators = useMemo(() => {
    return activeFuncs.map(f => ({
      fnObj: f,
      evalFn: createFunctionEvaluator(f.expr, angleUnit),
    }));
  }, [activeFuncs, angleUnit]);

  // Computed rows
  const rows = useMemo(() => {
    if (step <= 0 || start >= end) return [];
    const maxRows = 200; // prevent freeze
    const list: Array<{ x: number; values: number[] }> = [];

    let count = 0;
    for (let x = start; x <= end + 1e-9 && count < maxRows; x += step) {
      const roundedX = Number(x.toFixed(6));
      const vals = evaluators.map(e => e.evalFn(roundedX));
      list.push({ x: roundedX, values: vals });
      count++;
    }
    return list;
  }, [start, end, step, evaluators]);

  const handleCopy = (val: number, idx: number) => {
    navigator.clipboard?.writeText(String(val));
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-100 overflow-hidden select-none">
      {/* Top Setting Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Casio Table Range Setting
            </h2>
          </div>
          <button
            onClick={onNavigateToGraph}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-medium hover:bg-sky-500/30"
          >
            <span>Plot in Graph</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">Start</span>
            <input
              type="number"
              value={start}
              onChange={e => setStart(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
            />
          </div>

          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">End</span>
            <input
              type="number"
              value={end}
              onChange={e => setEnd(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
            />
          </div>

          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">Step</span>
            <input
              type="number"
              step="0.1"
              value={step}
              onChange={e => {
                const s = parseFloat(e.target.value);
                if (s > 0) setStep(s);
              }}
              className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeFuncs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <Table className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-medium">No Active Functions</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Go to Graph mode to define expressions for Y1, Y2, etc. (e.g. y = x² - 4).
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3 font-semibold text-center w-12 border-r border-slate-800">#</th>
                  <th className="py-2.5 px-3 font-semibold text-right border-r border-slate-800">X</th>
                  {activeFuncs.map(f => (
                    <th
                      key={f.id}
                      className="py-2.5 px-3 font-semibold text-right"
                      style={{ color: f.color }}
                    >
                      {f.name}(x)
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="py-2 px-3 text-center text-slate-500 text-[10px] border-r border-slate-800">
                      {index + 1}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-300 border-r border-slate-800 tabular-nums">
                      {formatResult(row.x)}
                    </td>
                    {row.values.map((v, fIdx) => (
                      <td
                        key={fIdx}
                        className="py-2 px-3 text-right font-semibold tabular-nums"
                        style={{ color: activeFuncs[fIdx].color }}
                      >
                        {formatResult(v)}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopy(row.values[0], index)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                          title="Copy primary value"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
