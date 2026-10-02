import React, { useState } from 'react';
import { formatResult } from '../utils/mathEngine';
import { Grid, ArrowRight, RotateCcw } from 'lucide-react';

interface MatrixModeProps {
  onInsertToCalc?: (val: string) => void;
}

export const MatrixMode: React.FC<MatrixModeProps> = ({ onInsertToCalc }) => {
  const [dim, setDim] = useState<2 | 3>(2);
  const [activeMatrix, setActiveMatrix] = useState<'A' | 'B'>('A');

  // Matrix A and B states
  const [matA, setMatA] = useState<number[][]>([
    [1, 2, 0],
    [3, 4, 0],
    [0, 0, 1],
  ]);

  const [matB, setMatB] = useState<number[][]>([
    [2, 0, 0],
    [1, 3, 0],
    [0, 0, 1],
  ]);

  const [operationResult, setOperationResult] = useState<{
    title: string;
    matrix?: number[][];
    scalar?: number;
  } | null>(null);

  const updateCell = (matrix: 'A' | 'B', r: number, c: number, val: number) => {
    const setter = matrix === 'A' ? setMatA : setMatB;
    setter(prev => {
      const copy = prev.map(row => [...row]);
      copy[r][c] = val;
      return copy;
    });
  };

  // Matrix algebra computations
  const getSub = (m: number[][]) => {
    if (dim === 2) return [[m[0][0], m[0][1]], [m[1][0], m[1][1]]];
    return m;
  };

  const currentA = getSub(matA);
  const currentB = getSub(matB);

  // Determinant
  const computeDet = (m: number[][]): number => {
    if (m.length === 2) {
      return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    }
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  };

  // Transpose
  const computeTranspose = (m: number[][]): number[][] => {
    const size = m.length;
    const res: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        res[j][i] = m[i][j];
      }
    }
    return res;
  };

  // Matrix Multiply
  const computeProduct = (a: number[][], b: number[][]): number[][] => {
    const size = a.length;
    const res: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        let sum = 0;
        for (let k = 0; k < size; k++) {
          sum += a[i][k] * b[k][j];
        }
        res[i][j] = sum;
      }
    }
    return res;
  };

  // Matrix Inverse
  const computeInverse = (m: number[][]): number[][] | null => {
    const det = computeDet(m);
    if (Math.abs(det) < 1e-12) return null;

    if (m.length === 2) {
      return [
        [m[1][1] / det, -m[0][1] / det],
        [-m[1][0] / det, m[0][0] / det],
      ];
    }

    // 3x3 Inverse via adjugate
    const adj: number[][] = [
      [
        (m[1][1] * m[2][2] - m[1][2] * m[2][1]) / det,
        -(m[0][1] * m[2][2] - m[0][2] * m[2][1]) / det,
        (m[0][1] * m[1][2] - m[0][2] * m[1][1]) / det,
      ],
      [
        -(m[1][0] * m[2][2] - m[1][2] * m[2][0]) / det,
        (m[0][0] * m[2][2] - m[0][2] * m[2][0]) / det,
        -(m[0][0] * m[1][2] - m[0][2] * m[1][0]) / det,
      ],
      [
        (m[1][0] * m[2][1] - m[1][1] * m[2][0]) / det,
        -(m[0][0] * m[2][1] - m[0][1] * m[2][0]) / det,
        (m[0][0] * m[1][1] - m[0][1] * m[1][0]) / det,
      ],
    ];
    return adj;
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-100 overflow-y-auto select-none p-3 space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Casio Matrix Calculator
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setDim(2)}
            className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
              dim === 2 ? 'bg-sky-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            2×2
          </button>
          <button
            onClick={() => setDim(3)}
            className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
              dim === 3 ? 'bg-sky-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            3×3
          </button>
        </div>
      </div>

      {/* Matrix Tab Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveMatrix('A')}
          className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
            activeMatrix === 'A'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          Matrix A
        </button>
        <button
          onClick={() => setActiveMatrix('B')}
          className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
            activeMatrix === 'B'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          Matrix B
        </button>
      </div>

      {/* Active Matrix Grid */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <span className="text-[11px] text-slate-400 font-mono">
          Edit Matrix {activeMatrix} [{dim}×{dim}]:
        </span>

        <div
          className="grid gap-2 max-w-xs mx-auto"
          style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: dim }).map((_, r) =>
            Array.from({ length: dim }).map((_, c) => {
              const currentVal = activeMatrix === 'A' ? matA[r][c] : matB[r][c];
              return (
                <input
                  key={`${r}-${c}`}
                  type="number"
                  value={currentVal}
                  onChange={e =>
                    updateCell(activeMatrix, r, c, parseFloat(e.target.value) || 0)
                  }
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center font-mono font-bold text-white text-sm focus:border-sky-500"
                />
              );
            })
          )}
        </div>
      </div>

      {/* Operation Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            const det = computeDet(currentA);
            setOperationResult({ title: 'det(MatA)', scalar: det });
          }}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
        >
          det(A)
        </button>
        <button
          onClick={() => {
            const inv = computeInverse(currentA);
            if (!inv) {
              setOperationResult({ title: 'A⁻¹ (Matrix Singular, Det = 0)' });
            } else {
              setOperationResult({ title: 'A⁻¹ (Inverse MatA)', matrix: inv });
            }
          }}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
        >
          MatA⁻¹
        </button>
        <button
          onClick={() => {
            const tr = computeTranspose(currentA);
            setOperationResult({ title: 'MatAᵀ (Transpose)', matrix: tr });
          }}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
        >
          MatAᵀ
        </button>
        <button
          onClick={() => {
            const prod = computeProduct(currentA, currentB);
            setOperationResult({ title: 'MatA × MatB', matrix: prod });
          }}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 font-bold col-span-2"
        >
          MatA × MatB
        </button>
        <button
          onClick={() => {
            const sum = currentA.map((row, r) => row.map((val, c) => val + currentB[r][c]));
            setOperationResult({ title: 'MatA + MatB', matrix: sum });
          }}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 font-bold"
        >
          MatA + MatB
        </button>
      </div>

      {/* Operation Result Display */}
      {operationResult && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
            {operationResult.title}
          </span>

          {operationResult.scalar !== undefined && (
            <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-between font-mono">
              <span className="text-slate-400">Result:</span>
              <span className="text-white text-base font-bold">
                {formatResult(operationResult.scalar)}
              </span>
              {onInsertToCalc && (
                <button
                  onClick={() => onInsertToCalc(String(operationResult.scalar))}
                  className="px-2 py-0.5 bg-slate-800 text-amber-400 rounded text-xs"
                >
                  Ans
                </button>
              )}
            </div>
          )}

          {operationResult.matrix && (
            <div
              className="grid gap-2 max-w-xs mx-auto p-2 bg-slate-950 rounded-xl"
              style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
            >
              {operationResult.matrix.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="p-2 bg-slate-900 rounded text-center font-mono text-xs font-bold text-white"
                  >
                    {formatResult(val)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
