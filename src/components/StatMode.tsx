import React, { useState } from 'react';
import { StatDataEntry } from '../types/calculator';
import { calculate1VarStats, formatResult } from '../utils/mathEngine';
import { BarChart3, Plus, Trash2, RotateCcw } from 'lucide-react';

interface StatModeProps {
  onInsertToCalc?: (val: string) => void;
}

export const StatMode: React.FC<StatModeProps> = ({ onInsertToCalc }) => {
  const [data, setData] = useState<StatDataEntry[]>([
    { x: 12, freq: 1 },
    { x: 15, freq: 2 },
    { x: 18, freq: 3 },
    { x: 22, freq: 2 },
    { x: 29, freq: 1 },
  ]);

  const [newX, setNewX] = useState<string>('');
  const [newFreq, setNewFreq] = useState<string>('1');

  const stats = React.useMemo(() => calculate1VarStats(data), [data]);

  const handleAdd = () => {
    const xVal = parseFloat(newX);
    const fVal = parseFloat(newFreq) || 1;
    if (Number.isFinite(xVal) && fVal > 0) {
      setData(prev => [...prev, { x: xVal, freq: fVal }]);
      setNewX('');
      setNewFreq('1');
    }
  };

  const handleDelete = (index: number) => {
    setData(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setData([]);
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-100 overflow-y-auto select-none p-3 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Casio 1-Variable Statistics
          </h2>
        </div>
        <button
          onClick={handleReset}
          className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Input Data Row */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <span className="text-[11px] text-slate-400 font-medium">Add Data Point:</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Value (x)"
            value={newX}
            onChange={e => setNewX(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-sm text-white"
          />
          <input
            type="number"
            placeholder="Freq"
            value={newFreq}
            onChange={e => setNewFreq(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-sm text-white text-center"
          />
          <button
            onClick={handleAdd}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-44 overflow-y-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-slate-900 text-slate-400 sticky top-0">
            <tr>
              <th className="py-1.5 px-3 text-center w-10">#</th>
              <th className="py-1.5 px-3 text-left">X (Value)</th>
              <th className="py-1.5 px-3 text-center">Freq</th>
              <th className="py-1.5 px-2 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((d, i) => (
              <tr key={i} className="hover:bg-slate-900/40">
                <td className="py-1.5 px-3 text-center text-slate-500">{i + 1}</td>
                <td className="py-1.5 px-3 text-white font-semibold">{d.x}</td>
                <td className="py-1.5 px-3 text-center text-amber-400">{d.freq}</td>
                <td className="py-1.5 px-2 text-center">
                  <button
                    onClick={() => handleDelete(i)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-500">
                  No data points yet. Add values above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Statistical Summary Results (Casio 1-VAR STAT) */}
      {stats && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
            1-VAR Summary Output
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Mean x̄:</span>
              <span className="text-white font-bold">{formatResult(stats.mean)}</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Total n:</span>
              <span className="text-white font-bold">{stats.n}</span>
            </div>

            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Sum Σx:</span>
              <span className="text-white font-bold">{formatResult(stats.sumX)}</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Sum Σx²:</span>
              <span className="text-white font-bold">{formatResult(stats.sumX2)}</span>
            </div>

            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Sample s:</span>
              <span className="text-emerald-400 font-bold">{formatResult(stats.sampleStdDev)}</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Pop. σ:</span>
              <span className="text-emerald-400 font-bold">{formatResult(stats.popStdDev)}</span>
            </div>

            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Min:</span>
              <span className="text-slate-200 font-bold">{stats.min}</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Q1:</span>
              <span className="text-slate-200 font-bold">{formatResult(stats.q1)}</span>
            </div>

            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Median Med:</span>
              <span className="text-amber-400 font-bold">{formatResult(stats.median)}</span>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between">
              <span className="text-slate-400">Q3:</span>
              <span className="text-slate-200 font-bold">{formatResult(stats.q3)}</span>
            </div>

            <div className="p-2 bg-slate-950 rounded-lg flex items-center justify-between col-span-2">
              <span className="text-slate-400">Max:</span>
              <span className="text-slate-200 font-bold">{stats.max}</span>
            </div>
          </div>

          {onInsertToCalc && (
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => onInsertToCalc(String(stats.mean))}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-xs font-mono font-medium"
              >
                Copy x̄ to Calc
              </button>
              <button
                onClick={() => onInsertToCalc(String(stats.sampleStdDev))}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-xs font-mono font-medium"
              >
                Copy s to Calc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
