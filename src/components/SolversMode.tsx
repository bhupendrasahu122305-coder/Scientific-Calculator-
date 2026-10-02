import React, { useState } from 'react';
import { solveQuadratic, solveSystem2x2, formatResult, decimalToFraction } from '../utils/mathEngine';
import { Hash, Calculator, RotateCcw, ArrowRight } from 'lucide-react';

interface SolversModeProps {
  onInsertToCalc?: (val: string) => void;
}

export const SolversMode: React.FC<SolversModeProps> = ({ onInsertToCalc }) => {
  const [solverType, setSolverType] = useState<'QUAD' | 'CUBIC' | 'SIMUL2' | 'SIMUL3'>('QUAD');

  // Quadratic coefficients: a x² + b x + c = 0
  const [quadA, setQuadA] = useState<string>('1');
  const [quadB, setQuadB] = useState<string>('-5');
  const [quadC, setQuadC] = useState<string>('6');

  // Cubic coefficients: a x³ + b x² + c x + d = 0
  const [cubicA, setCubicA] = useState<string>('1');
  const [cubicB, setCubicB] = useState<string>('-6');
  const [cubicC, setCubicC] = useState<string>('11');
  const [cubicD, setCubicD] = useState<string>('-6');

  // 2x2 System:
  // a1 x + b1 y = c1
  // a2 x + b2 y = c2
  const [sys2, setSys2] = useState({
    a1: '2', b1: '1', c1: '7',
    a2: '1', b2: '-1', c2: '2',
  });

  // 3x3 System
  const [sys3, setSys3] = useState({
    a1: '1', b1: '1', c1: '1', d1: '6',
    a2: '0', b2: '2', c2: '5', d2: '-4',
    a3: '2', b3: '5', c3: '-1', d3: '27',
  });

  // Calculate Quadratic
  const quadResult = React.useMemo(() => {
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);
    if (!Number.isFinite(a) || a === 0 || !Number.isFinite(b) || !Number.isFinite(c)) {
      return null;
    }
    return solveQuadratic(a, b, c);
  }, [quadA, quadB, quadC]);

  // Calculate 2x2 System
  const sys2Result = React.useMemo(() => {
    const a1 = parseFloat(sys2.a1);
    const b1 = parseFloat(sys2.b1);
    const c1 = parseFloat(sys2.c1);
    const a2 = parseFloat(sys2.a2);
    const b2 = parseFloat(sys2.b2);
    const c2 = parseFloat(sys2.c2);
    if (![a1, b1, c1, a2, b2, c2].every(Number.isFinite)) return null;
    return solveSystem2x2(a1, b1, c1, a2, b2, c2);
  }, [sys2]);

  // Calculate Cubic Roots via Cardano's formula
  const cubicResult = React.useMemo(() => {
    const a = parseFloat(cubicA);
    const b = parseFloat(cubicB);
    const c = parseFloat(cubicC);
    const d = parseFloat(cubicD);
    if (![a, b, c, d].every(Number.isFinite) || a === 0) return null;

    // Normalize: x³ + px² + qx + r = 0
    const p = b / a;
    const q = c / a;
    const r = d / a;

    // Substitute x = t - p/3 -> t³ + pt + q = 0
    const p_depressed = q - (p * p) / 3;
    const q_depressed = (2 * p * p * p) / 27 - (p * q) / 3 + r;

    const delta = (q_depressed * q_depressed) / 4 + (p_depressed * p_depressed * p_depressed) / 27;

    const roots: Array<{ real: number; imag?: number }> = [];

    if (Math.abs(delta) < 1e-11) {
      // Multiple real roots
      const u = Math.cbrt(-q_depressed / 2);
      roots.push({ real: 2 * u - p / 3 });
      roots.push({ real: -u - p / 3 });
    } else if (delta > 0) {
      // One real root, two complex conjugates
      const sqrtDelta = Math.sqrt(delta);
      const u = Math.cbrt(-q_depressed / 2 + sqrtDelta);
      const v = Math.cbrt(-q_depressed / 2 - sqrtDelta);
      const real1 = u + v - p / 3;
      const realPart = -(u + v) / 2 - p / 3;
      const imagPart = ((u - v) * Math.sqrt(3)) / 2;
      roots.push({ real: real1 });
      roots.push({ real: realPart, imag: Math.abs(imagPart) });
      roots.push({ real: realPart, imag: -Math.abs(imagPart) });
    } else {
      // Three distinct real roots (casus irreducibilis)
      const phi = Math.acos(-q_depressed / (2 * Math.sqrt(-Math.pow(p_depressed / 3, 3))));
      const m = 2 * Math.sqrt(-p_depressed / 3);
      roots.push({ real: m * Math.cos(phi / 3) - p / 3 });
      roots.push({ real: m * Math.cos((phi + 2 * Math.PI) / 3) - p / 3 });
      roots.push({ real: m * Math.cos((phi + 4 * Math.PI) / 3) - p / 3 });
    }

    return roots;
  }, [cubicA, cubicB, cubicC, cubicD]);

  // Calculate 3x3 System using Cramer's rule
  const sys3Result = React.useMemo(() => {
    const { a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3 } = sys3;
    const nums = [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3].map(parseFloat);
    if (!nums.every(Number.isFinite)) return null;

    const det3 = (m: number[][]) => {
      return (
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
      );
    };

    const A = [
      [nums[0], nums[1], nums[2]],
      [nums[4], nums[5], nums[6]],
      [nums[8], nums[9], nums[10]],
    ];
    const D = det3(A);
    if (Math.abs(D) < 1e-12) return 'NO_UNIQUE_SOLUTION';

    const Dx = det3([
      [nums[3], nums[1], nums[2]],
      [nums[7], nums[5], nums[6]],
      [nums[11], nums[9], nums[10]],
    ]);
    const Dy = det3([
      [nums[0], nums[3], nums[2]],
      [nums[4], nums[7], nums[6]],
      [nums[8], nums[11], nums[10]],
    ]);
    const Dz = det3([
      [nums[0], nums[1], nums[3]],
      [nums[4], nums[5], nums[7]],
      [nums[8], nums[9], nums[11]],
    ]);

    return {
      x: Dx / D,
      y: Dy / D,
      z: Dz / D,
    };
  }, [sys3]);

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-100 overflow-y-auto select-none p-3 space-y-4">
      {/* Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setSolverType('QUAD')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            solverType === 'QUAD'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Quadratic
        </button>
        <button
          onClick={() => setSolverType('CUBIC')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            solverType === 'CUBIC'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Cubic
        </button>
        <button
          onClick={() => setSolverType('SIMUL2')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            solverType === 'SIMUL2'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          2 Unknowns
        </button>
        <button
          onClick={() => setSolverType('SIMUL3')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            solverType === 'SIMUL3'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          3 Unknowns
        </button>
      </div>

      {/* 1. Quadratic Mode */}
      {solverType === 'QUAD' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
              Equation: a·x² + b·x + c = 0
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-mono">a</label>
                <input
                  type="number"
                  value={quadA}
                  onChange={e => setQuadA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono font-bold text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-mono">b</label>
                <input
                  type="number"
                  value={quadB}
                  onChange={e => setQuadB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono font-bold text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-mono">c</label>
                <input
                  type="number"
                  value={quadC}
                  onChange={e => setQuadC(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono font-bold text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Result card */}
          {quadResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                Casio Solution & Analysis
              </span>

              <div className="space-y-2 font-mono text-sm">
                {quadResult.roots.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 font-bold">x{idx + 1} =</span>
                    <span className="text-white font-semibold">
                      {r.imag !== 0
                        ? `${formatResult(r.real)} ${r.imag > 0 ? '+' : '-'} ${formatResult(Math.abs(r.imag))}i`
                        : `${formatResult(r.real)} ${decimalToFraction(r.real) ? `(${decimalToFraction(r.real)})` : ''}`}
                    </span>
                    {onInsertToCalc && r.imag === 0 && (
                      <button
                        onClick={() => onInsertToCalc(String(r.real))}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-xs"
                      >
                        Ans
                      </button>
                    )}
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Discriminant Δ:</span>
                  <span className="font-bold text-slate-200">{formatResult(quadResult.discriminant)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Parabola Vertex (h, k):</span>
                  <span className="font-bold text-slate-200">
                    ({formatResult(quadResult.vertex.x)}, {formatResult(quadResult.vertex.y)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Cubic Mode */}
      {solverType === 'CUBIC' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
              Equation: a·x³ + b·x² + c·x + d = 0
            </span>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">a</label>
                <input
                  type="number"
                  value={cubicA}
                  onChange={e => setCubicA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono font-bold text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">b</label>
                <input
                  type="number"
                  value={cubicB}
                  onChange={e => setCubicB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono font-bold text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">c</label>
                <input
                  type="number"
                  value={cubicC}
                  onChange={e => setCubicC(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono font-bold text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">d</label>
                <input
                  type="number"
                  value={cubicD}
                  onChange={e => setCubicD(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono font-bold text-white text-xs"
                />
              </div>
            </div>
          </div>

          {cubicResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                Cubic Roots
              </span>
              <div className="space-y-2 font-mono text-sm">
                {cubicResult.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 font-bold">x{idx + 1} =</span>
                    <span className="text-white font-semibold">
                      {r.imag !== undefined && Math.abs(r.imag) > 1e-6
                        ? `${formatResult(r.real)} ${r.imag > 0 ? '+' : '-'} ${formatResult(Math.abs(r.imag))}i`
                        : formatResult(r.real)}
                    </span>
                    {onInsertToCalc && (!r.imag || Math.abs(r.imag) <= 1e-6) && (
                      <button
                        onClick={() => onInsertToCalc(String(r.real))}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-xs"
                      >
                        Ans
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Simultaneous 2 Unknowns */}
      {solverType === 'SIMUL2' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
              System of 2 Equations: a·x + b·y = c
            </span>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-8">Eq 1:</span>
                <input
                  type="number"
                  value={sys2.a1}
                  onChange={e => setSys2(s => ({ ...s, a1: e.target.value }))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-center text-white"
                />
                <span>x +</span>
                <input
                  type="number"
                  value={sys2.b1}
                  onChange={e => setSys2(s => ({ ...s, b1: e.target.value }))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-center text-white"
                />
                <span>y =</span>
                <input
                  type="number"
                  value={sys2.c1}
                  onChange={e => setSys2(s => ({ ...s, c1: e.target.value }))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-center text-white font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-8">Eq 2:</span>
                <input
                  type="number"
                  value={sys2.a2}
                  onChange={e => setSys2(s => ({ ...s, a2: e.target.value }))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-center text-white"
                />
                <span>x +</span>
                <input
                  type="number"
                  value={sys2.b2}
                  onChange={e => setSys2(s => ({ ...s, b2: e.target.value }))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-center text-white"
                />
                <span>y =</span>
                <input
                  type="number"
                  value={sys2.c2}
                  onChange={e => setSys2(s => ({ ...s, c2: e.target.value }))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-center text-white font-bold"
                />
              </div>
            </div>
          </div>

          {sys2Result && typeof sys2Result === 'object' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Exact Solution
              </span>
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 font-bold">x =</span>
                  <span className="text-white text-base font-bold">{formatResult(sys2Result.x)}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 font-bold">y =</span>
                  <span className="text-white text-base font-bold">{formatResult(sys2Result.y)}</span>
                </div>
              </div>
            </div>
          )}

          {typeof sys2Result === 'string' && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {sys2Result === 'NO_SOLUTION' ? 'No unique solution (Inconsistent system)' : 'Infinite solutions (Dependent system)'}
            </div>
          )}
        </div>
      )}

      {/* 4. Simultaneous 3 Unknowns */}
      {solverType === 'SIMUL3' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
              System of 3 Equations: a·x + b·y + c·z = d
            </span>

            <div className="space-y-2 text-[11px] font-mono overflow-x-auto pb-1">
              {[
                { label: 'Eq 1', a: 'a1', b: 'b1', c: 'c1', d: 'd1' },
                { label: 'Eq 2', a: 'a2', b: 'b2', c: 'c2', d: 'd2' },
                { label: 'Eq 3', a: 'a3', b: 'b3', c: 'c3', d: 'd3' },
              ].map(eq => (
                <div key={eq.label} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-slate-400 w-9">{eq.label}:</span>
                  <input
                    type="number"
                    value={(sys3 as any)[eq.a]}
                    onChange={e => setSys3(s => ({ ...s, [eq.a]: e.target.value }))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded p-1 text-center text-white"
                  />
                  <span>x+</span>
                  <input
                    type="number"
                    value={(sys3 as any)[eq.b]}
                    onChange={e => setSys3(s => ({ ...s, [eq.b]: e.target.value }))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded p-1 text-center text-white"
                  />
                  <span>y+</span>
                  <input
                    type="number"
                    value={(sys3 as any)[eq.c]}
                    onChange={e => setSys3(s => ({ ...s, [eq.c]: e.target.value }))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded p-1 text-center text-white"
                  />
                  <span>z=</span>
                  <input
                    type="number"
                    value={(sys3 as any)[eq.d]}
                    onChange={e => setSys3(s => ({ ...s, [eq.d]: e.target.value }))}
                    className="w-14 bg-slate-950 border border-slate-800 rounded p-1 text-center text-white font-bold"
                  />
                </div>
              ))}
            </div>
          </div>

          {sys3Result && typeof sys3Result === 'object' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Exact Solution (x, y, z)
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-400 block">x</span>
                  <span className="text-white text-sm font-bold">{formatResult(sys3Result.x)}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-400 block">y</span>
                  <span className="text-white text-sm font-bold">{formatResult(sys3Result.y)}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-400 block">z</span>
                  <span className="text-white text-sm font-bold">{formatResult(sys3Result.z)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
