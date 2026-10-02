export type AngleUnit = 'DEG' | 'RAD' | 'GRAD';

export type CalculatorMode = 
  | 'COMP'      // Standard Scientific Calculation
  | 'GRAPH'     // Advanced Multi-Function Graphing
  | 'TABLE'     // Value Table Generator
  | 'EQUATION'  // Polynomial & System Solvers
  | 'STAT'      // 1-Variable Statistics
  | 'MATRIX'    // Matrix Operations
  | 'CONVERT';  // Unit Converter & Scientific Constants

export interface HistoryItem {
  id: string;
  timestamp: number;
  expression: string;
  result: string;
  exactFraction?: string;
  angleUnit: AngleUnit;
  mode: CalculatorMode;
}

export interface GraphFunction {
  id: string;
  name: string; // Y1, Y2, Y3, Y4
  expr: string;
  color: string;
  enabled: boolean;
  error?: string;
}

export interface GraphBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface GraphAnalysisResult {
  type: 'root' | 'min' | 'max' | 'intercept' | 'intersect' | 'integral';
  title: string;
  points?: Array<{ x: number; y: number; label?: string }>;
  value?: number;
  info?: string;
  integralRange?: [number, number];
}

export interface VariablesMap {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
  X: number;
  Y: number;
  M: number;
  Ans: number;
  PreAns: number;
}

export interface StatDataEntry {
  x: number;
  freq: number;
}

export interface StatSummary {
  n: number;
  sumX: number;
  sumX2: number;
  mean: number;
  sampleStdDev: number;
  popStdDev: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
}
