import { AngleUnit, VariablesMap, StatSummary } from '../types/calculator';

export interface EvalOptions {
  angleUnit?: AngleUnit;
  variables?: Partial<VariablesMap>;
  xVal?: number;
}

// Factorial with gamma approximation for non-integers if needed, exact for integers
export function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // overflow in JS float
  if (Math.floor(n) === n) {
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }
  // Stirling / Lanczos Gamma approximation for non-integers
  return gamma(n + 1);
}

function gamma(z: number): number {
  const g = 7;
  const C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Permutations nPr = n! / (n - r)!
export function nPr(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (Math.floor(n) !== n || Math.floor(r) !== r) return NaN;
  let res = 1;
  for (let i = 0; i < r; i++) {
    res *= (n - i);
  }
  return res;
}

// Combinations nCr = n! / (r! * (n - r)!)
export function nCr(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (Math.floor(n) !== n || Math.floor(r) !== r) return NaN;
  r = Math.min(r, n - r);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= r; i++) {
    num *= (n - i + 1);
    den *= i;
  }
  return Math.round(num / den);
}

// Angle conversion helpers
export function toRadians(val: number, unit: AngleUnit = 'DEG'): number {
  if (unit === 'RAD') return val;
  if (unit === 'GRAD') return (val * Math.PI) / 200;
  return (val * Math.PI) / 180;
}

export function fromRadians(rad: number, unit: AngleUnit = 'DEG'): number {
  if (unit === 'RAD') return rad;
  if (unit === 'GRAD') return (rad * 200) / Math.PI;
  return (rad * 180) / Math.PI;
}

// Numerical 5-point stencil central difference derivative
export function derivative(
  fn: (x: number) => number,
  x: number,
  h: number = 1e-5
): number {
  const f_2h_p = fn(x + 2 * h);
  const f_h_p = fn(x + h);
  const f_h_m = fn(x - h);
  const f_2h_m = fn(x - 2 * h);
  return (-f_2h_p + 8 * f_h_p - 8 * f_h_m + f_2h_m) / (12 * h);
}

// Numerical Definite Integral: Composite Simpson's 3/8 & Gauss-Legendre quadrature
export function definiteIntegral(
  fn: (x: number) => number,
  a: number,
  b: number,
  steps: number = 100
): number {
  if (a === b) return 0;
  if (a > b) return -definiteIntegral(fn, b, a, steps);

  // 5-point Gauss-Legendre quadrature in subdivisions
  const subdivisions = Math.max(20, Math.min(steps, 400));
  const h = (b - a) / subdivisions;

  // Gauss 5-point weights and abscissae on [-1, 1]
  const xi = [
    0,
    -Math.sqrt(5 - 2 * Math.sqrt(10 / 7)) / 3,
    Math.sqrt(5 - 2 * Math.sqrt(10 / 7)) / 3,
    -Math.sqrt(5 + 2 * Math.sqrt(10 / 7)) / 3,
    Math.sqrt(5 + 2 * Math.sqrt(10 / 7)) / 3,
  ];
  const wi = [
    128 / 225,
    (322 + 13 * Math.sqrt(70)) / 900,
    (322 + 13 * Math.sqrt(70)) / 900,
    (322 - 13 * Math.sqrt(70)) / 900,
    (322 - 13 * Math.sqrt(70)) / 900,
  ];

  let total = 0;
  for (let i = 0; i < subdivisions; i++) {
    const subA = a + i * h;
    const subB = subA + h;
    const mid = (subA + subB) / 2;
    const halfH = h / 2;

    let subSum = 0;
    for (let k = 0; k < 5; k++) {
      const x = mid + halfH * xi[k];
      const y = fn(x);
      if (!Number.isFinite(y)) continue;
      subSum += wi[k] * y;
    }
    total += subSum * halfH;
  }

  return total;
}

// Continued fraction algorithm for decimal to exact fraction (Casio S<=>D)
export function decimalToFraction(val: number, maxDenominator: number = 10000): string | null {
  if (!Number.isFinite(val)) return null;
  if (Math.abs(val) < 1e-12) return '0';
  if (Math.floor(val) === val) return `${val}`;

  const sign = val < 0 ? -1 : 1;
  val = Math.abs(val);

  let h1 = 1, h2 = 0;
  let k1 = 0, k2 = 1;
  let b = val;

  do {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(val - h1 / k1) > val * 1e-7 && k1 <= maxDenominator && Number.isFinite(b));

  if (k1 > maxDenominator || k1 <= 0) return null;
  if (k1 === 1) return `${sign * h1}`;

  return `${sign * h1}/${k1}`;
}

// Format numbers nicely, Casio style
export function formatResult(num: number, notation: 'NORM' | 'SCI' | 'ENG' = 'NORM'): string {
  if (Number.isNaN(num)) return 'Math ERROR';
  if (!Number.isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';
  if (Math.abs(num) < 1e-14) return '0';

  if (notation === 'SCI') {
    return num.toExponential(8).replace(/e\+?/, ' × 10^');
  }

  if (notation === 'ENG') {
    // Casio Engineering notation: exponent is multiple of 3
    const exp = Math.floor(Math.log10(Math.abs(num)));
    const engExp = Math.floor(exp / 3) * 3;
    const mantissa = num / Math.pow(10, engExp);
    const roundMantissa = Number(mantissa.toFixed(6));
    if (engExp === 0) return `${roundMantissa}`;
    return `${roundMantissa} × 10^${engExp}`;
  }

  // NORM: clean rounded decimal
  const abs = Math.abs(num);
  if (abs >= 1e11 || (abs < 1e-4 && abs > 0)) {
    return num.toExponential(7).replace(/e\+?/, ' × 10^');
  }

  // Eliminate precision artifacts like 0.30000000000000004
  const rounded = Number(num.toPrecision(11));
  return `${rounded}`;
}

// Casio Pre-processing & Expression Sanitizer
export function sanitizeExpression(rawExpr: string): string {
  let expr = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/π/g, 'Math.PI')
    .replace(/√/g, 'sqrt')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁻¹/g, '^(-1)')
    .replace(/Ran#/g, 'Math.random()');

  return expr;
}

// Fast safe evaluator for functions in Casio syntax
export function createFunctionEvaluator(
  exprStr: string,
  angleUnit: AngleUnit = 'DEG',
  customVars: Partial<VariablesMap> = {}
): (x: number) => number {
  const prepared = prepareMathExpr(exprStr, angleUnit, true);

  return (x: number): number => {
    try {
      // Define mathematical environment
      const env: Record<string, unknown> = {
        x,
        X: x,
        Math,
        PI: Math.PI,
        E: Math.E,
        ...customVars,
        // Trigonometric with angle unit
        sin: (v: number) => Math.sin(toRadians(v, angleUnit)),
        cos: (v: number) => {
          const rad = toRadians(v, angleUnit);
          // clean precision around pi/2, 3pi/2
          const res = Math.cos(rad);
          return Math.abs(res) < 1e-15 ? 0 : res;
        },
        tan: (v: number) => {
          const rad = toRadians(v, angleUnit);
          const c = Math.cos(rad);
          if (Math.abs(c) < 1e-15) return NaN;
          return Math.tan(rad);
        },
        asin: (v: number) => fromRadians(Math.asin(v), angleUnit),
        acos: (v: number) => fromRadians(Math.acos(v), angleUnit),
        atan: (v: number) => fromRadians(Math.atan(v), angleUnit),
        sinh: Math.sinh,
        cosh: Math.cosh,
        tanh: Math.tanh,
        asinh: Math.asinh,
        acosh: Math.acosh,
        atanh: Math.atanh,
        sqrt: Math.sqrt,
        cbrt: Math.cbrt,
        abs: Math.abs,
        ln: Math.log,
        log: (a: number, b?: number) => {
          if (b !== undefined) return Math.log(b) / Math.log(a);
          return Math.log10(a);
        },
        log10: Math.log10,
        exp: Math.exp,
        fact: factorial,
        nCr: nCr,
        nPr: nPr,
        mod: (a: number, b: number) => a % b,
      };

      const keys = Object.keys(env);
      const values = Object.values(env);
      const fn = new Function(...keys, `return (${prepared});`);
      const res = fn(...values);
      return typeof res === 'number' ? res : NaN;
    } catch {
      return NaN;
    }
  };
}

// Convert natural Casio math expression into JS arithmetic
export function prepareMathExpr(
  expr: string,
  angleUnit: AngleUnit = 'DEG',
  isForFunction: boolean = false
): string {
  let s = expr;

  // Handle common Casio symbols
  s = s.replace(/×/g, '*');
  s = s.replace(/÷/g, '/');
  s = s.replace(/−/g, '-');
  s = s.replace(/–/g, '-');
  s = s.replace(/π/g, 'Math.PI');
  s = s.replace(/×10\^([-\d]+|\([-\d]+\))/g, '*(10^$1)');

  // Handle square root: √(expr) or √num
  s = s.replace(/√\(([^)]+)\)/g, 'sqrt($1)');
  s = s.replace(/√([0-9.a-zA-Z]+)/g, 'sqrt($1)');

  // Handle inverse trig written as sin⁻¹(...) or cos⁻¹(...) or tan⁻¹(...)
  s = s.replace(/sin⁻¹\(([^)]+)\)/g, 'asin($1)');
  s = s.replace(/cos⁻¹\(([^)]+)\)/g, 'acos($1)');
  s = s.replace(/tan⁻¹\(([^)]+)\)/g, 'atan($1)');
  s = s.replace(/sin⁻¹([0-9.a-zA-Z]+)/g, 'asin($1)');
  s = s.replace(/cos⁻¹([0-9.a-zA-Z]+)/g, 'acos($1)');
  s = s.replace(/tan⁻¹([0-9.a-zA-Z]+)/g, 'atan($1)');

  // Handle superscripts
  s = s.replace(/²/g, '^2');
  s = s.replace(/³/g, '^3');
  s = s.replace(/⁻¹/g, '^(-1)');

  // Handle Casio nCr & nPr as infix: e.g. 5 C 2, 5 P 2, 5nCr2, 5nPr2
  s = s.replace(/(\d+)\s*(?:nCr|C)\s*(\d+)/gi, 'nCr($1,$2)');
  s = s.replace(/(\d+)\s*(?:nPr|P)\s*(\d+)/gi, 'nPr($1,$2)');

  // Handle factorials e.g. 5! -> fact(5)
  s = s.replace(/([0-9.]+|\([a-zA-Z0-9+\-*/^ .]+\))!/g, 'fact($1)');

  // Handle percentage e.g. 50% -> (50*0.01)
  s = s.replace(/([0-9.]+)%/g, '($1*0.01)');

  // Implicit multiplication:
  // 1. Number before parenthesis: 2(3) -> 2*(3)
  s = s.replace(/(\d)\s*\(/g, '$1*(');
  // 2. Parenthesis before parenthesis: ) ( -> )*(
  s = s.replace(/\)\s*\(/g, ')*(');
  // 3. Parenthesis before number: ) 2 -> )*2
  s = s.replace(/\)\s*(\d)/g, ')*$1');
  // 4. Number before function: 2sin(x) -> 2*sin(x)
  s = s.replace(/(\d)\s*(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log|sqrt|cbrt|exp|abs)\b/g, '$1*$2');
  // 5. Parenthesis before function: )sin(x) -> )*sin(x)
  s = s.replace(/\)\s*(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log|sqrt|cbrt|exp|abs)\b/g, ')*$2');
  // 6. Number before variable: 2x -> 2*x, 5A -> 5*A
  if (isForFunction) {
    s = s.replace(/(\d)\s*([xX])/g, '$1*$2');
    s = s.replace(/([xX])\s*(\d)/g, '$1*$2');
    s = s.replace(/([xX])\s*\(/g, '$1*(');
    s = s.replace(/\)\s*([xX])/g, ')*$1');
  }

  // Handle exponents: a^b -> Math.pow(a, b)
  // Recursively or loop replace ^ from right to left
  s = replaceExponents(s);

  return s;
}

// Right-associative exponent replacement helper
function replaceExponents(str: string): string {
  while (str.includes('^')) {
    // Find rightmost ^
    const index = str.lastIndexOf('^');
    // Find base (either paren or identifier/number before ^)
    let baseStart = index - 1;
    while (baseStart >= 0 && /\s/.test(str[baseStart])) baseStart--;

    let base = '';
    if (str[baseStart] === ')') {
      let depth = 1;
      let i = baseStart - 1;
      while (i >= 0 && depth > 0) {
        if (str[i] === ')') depth++;
        else if (str[i] === '(') depth--;
        i--;
      }
      baseStart = i + 1;
      base = str.substring(baseStart, index);
    } else {
      let i = baseStart;
      while (i >= 0 && /[a-zA-Z0-9_.]/.test(str[i])) i--;
      baseStart = i + 1;
      base = str.substring(baseStart, index);
    }

    // Find exponent after ^
    let expEnd = index + 1;
    while (expEnd < str.length && /\s/.test(str[expEnd])) expEnd++;

    let exp = '';
    if (str[expEnd] === '(') {
      let depth = 1;
      let i = expEnd + 1;
      while (i < str.length && depth > 0) {
        if (str[i] === '(') depth++;
        else if (str[i] === ')') depth--;
        i++;
      }
      expEnd = i;
      exp = str.substring(index + 1, expEnd);
    } else {
      let i = expEnd;
      // can be a negative number e.g. ^-2
      if (str[i] === '-') i++;
      while (i < str.length && /[a-zA-Z0-9_.]/.test(str[i])) i++;
      expEnd = i;
      exp = str.substring(index + 1, expEnd);
    }

    const replacement = `Math.pow(${base.trim()}, ${exp.trim()})`;
    str = str.substring(0, baseStart) + replacement + str.substring(expEnd);
  }
  return str;
}

// Full evaluation of standard Casio calculator expressions
export function evaluateCasioExpression(
  rawExpr: string,
  options: EvalOptions = {}
): { result: number; exactFraction?: string; error?: string } {
  if (!rawExpr || !rawExpr.trim()) {
    return { result: 0, exactFraction: '0' };
  }

  const { angleUnit = 'DEG', variables = {} } = options;

  try {
    // Special functions parsing:
    // 1. Calculus d/dx(f(x), x_val)
    const derivMatch = rawExpr.match(/^d\/dx\s*\((.+),\s*([-\d.]+)\)$/i);
    if (derivMatch) {
      const fnExpr = derivMatch[1];
      const xVal = parseFloat(derivMatch[2]);
      const fn = createFunctionEvaluator(fnExpr, angleUnit, variables);
      const val = derivative(fn, xVal);
      return { result: val, exactFraction: decimalToFraction(val) ?? undefined };
    }

    // 2. Definite integral ∫(f(x), a, b)
    const intMatch = rawExpr.match(/^∫\s*\((.+),\s*([-\d.]+),\s*([-\d.]+)\)$/i);
    if (intMatch) {
      const fnExpr = intMatch[1];
      const a = parseFloat(intMatch[2]);
      const b = parseFloat(intMatch[3]);
      const fn = createFunctionEvaluator(fnExpr, angleUnit, variables);
      const val = definiteIntegral(fn, a, b);
      return { result: val, exactFraction: decimalToFraction(val) ?? undefined };
    }

    // 3. Summation Σ(expr, var, a, b)
    const sumMatch = rawExpr.match(/^Σ\s*\((.+),\s*([a-zA-Z]+),\s*(\d+),\s*(\d+)\)$/i);
    if (sumMatch) {
      const termExpr = sumMatch[1];
      const vName = sumMatch[2];
      const start = parseInt(sumMatch[3], 10);
      const end = parseInt(sumMatch[4], 10);
      let total = 0;
      for (let k = start; k <= end; k++) {
        const subEval = evaluateCasioExpression(termExpr, {
          ...options,
          variables: { ...variables, [vName]: k } as any,
        });
        if (subEval.error) return { result: NaN, error: subEval.error };
        total += subEval.result;
      }
      return { result: total, exactFraction: decimalToFraction(total) ?? undefined };
    }

    // General expression
    const prepared = prepareMathExpr(rawExpr, angleUnit, false);

    const env: Record<string, unknown> = {
      Math,
      PI: Math.PI,
      E: Math.E,
      ...variables,
      // Angle unit trig
      sin: (v: number) => Math.sin(toRadians(v, angleUnit)),
      cos: (v: number) => {
        const rad = toRadians(v, angleUnit);
        const res = Math.cos(rad);
        return Math.abs(res) < 1e-15 ? 0 : res;
      },
      tan: (v: number) => {
        const rad = toRadians(v, angleUnit);
        const c = Math.cos(rad);
        if (Math.abs(c) < 1e-15) return NaN;
        return Math.tan(rad);
      },
      asin: (v: number) => fromRadians(Math.asin(v), angleUnit),
      acos: (v: number) => fromRadians(Math.acos(v), angleUnit),
      atan: (v: number) => fromRadians(Math.atan(v), angleUnit),
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      asinh: Math.asinh,
      acosh: Math.acosh,
      atanh: Math.atanh,
      sqrt: Math.sqrt,
      cbrt: Math.cbrt,
      abs: Math.abs,
      ln: Math.log,
      log: (a: number, b?: number) => {
        if (b !== undefined) return Math.log(b) / Math.log(a);
        return Math.log10(a);
      },
      log10: Math.log10,
      exp: Math.exp,
      fact: factorial,
      nCr: nCr,
      nPr: nPr,
      mod: (a: number, b: number) => a % b,
      RanInt: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    };

    const keys = Object.keys(env);
    const values = Object.values(env);
    const fn = new Function(...keys, `return (${prepared});`);
    const val = fn(...values);

    if (typeof val !== 'number') {
      return { result: NaN, error: 'Syntax ERROR' };
    }

    if (Number.isNaN(val)) {
      return { result: NaN, error: 'Math ERROR' };
    }

    const exact = decimalToFraction(val);
    return {
      result: val,
      exactFraction: exact ?? undefined,
    };
  } catch (err: any) {
    return {
      result: NaN,
      error: 'Syntax ERROR',
    };
  }
}

// -------------------------------------------------------------
// Graph Numerical Analysis Tools (G-Solve in Casio)
// -------------------------------------------------------------

// Find Roots / Zeros: f(x) = 0 within [xMin, xMax]
export function findRoots(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  samples: number = 300
): number[] {
  const roots: number[] = [];
  const step = (xMax - xMin) / samples;
  let prevX = xMin;
  let prevY = fn(prevX);

  for (let i = 1; i <= samples; i++) {
    const currX = xMin + i * step;
    const currY = fn(currX);

    if (Number.isFinite(prevY) && Number.isFinite(currY)) {
      if (Math.abs(currY) < 1e-9) {
        roots.push(Number(currX.toFixed(5)));
      } else if (prevY * currY < 0) {
        // Sign change -> Bisection refinement
        let a = prevX;
        let b = currX;
        for (let iter = 0; iter < 30; iter++) {
          const mid = (a + b) / 2;
          const yMid = fn(mid);
          if (Math.abs(yMid) < 1e-12 || (b - a) < 1e-7) {
            a = mid;
            break;
          }
          if (fn(a) * yMid < 0) b = mid;
          else a = mid;
        }
        const r = Number(a.toFixed(5));
        if (!roots.some(existing => Math.abs(existing - r) < 1e-3)) {
          roots.push(r);
        }
      }
    }
    prevX = currX;
    prevY = currY;
  }
  return roots;
}

// Find Extrema (Local Minima and Maxima)
export function findExtrema(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  samples: number = 200
): { min: Array<{ x: number; y: number }>; max: Array<{ x: number; y: number }> } {
  const minList: Array<{ x: number; y: number }> = [];
  const maxList: Array<{ x: number; y: number }> = [];
  const step = (xMax - xMin) / samples;

  let yPrev2 = fn(xMin);
  let yPrev1 = fn(xMin + step);

  for (let i = 2; i <= samples; i++) {
    const x = xMin + i * step;
    const y = fn(x);

    if (Number.isFinite(yPrev2) && Number.isFinite(yPrev1) && Number.isFinite(y)) {
      // Local maximum: yPrev1 > yPrev2 and yPrev1 > y
      if (yPrev1 > yPrev2 && yPrev1 > y) {
        const pt = refineExtremum(fn, x - 2 * step, x, 'max');
        if (pt && !maxList.some(p => Math.abs(p.x - pt.x) < 1e-2)) {
          maxList.push(pt);
        }
      }
      // Local minimum: yPrev1 < yPrev2 and yPrev1 < y
      else if (yPrev1 < yPrev2 && yPrev1 < y) {
        const pt = refineExtremum(fn, x - 2 * step, x, 'min');
        if (pt && !minList.some(p => Math.abs(p.x - pt.x) < 1e-2)) {
          minList.push(pt);
        }
      }
    }
    yPrev2 = yPrev1;
    yPrev1 = y;
  }

  return { min: minList, max: maxList };
}

// Golden section search to refine peak or valley
function refineExtremum(
  fn: (x: number) => number,
  a: number,
  b: number,
  type: 'min' | 'max'
): { x: number; y: number } | null {
  const phi = (Math.sqrt(5) - 1) / 2;
  let x1 = b - phi * (b - a);
  let x2 = a + phi * (b - a);
  let f1 = fn(x1);
  let f2 = fn(x2);

  for (let i = 0; i < 25; i++) {
    if (type === 'max') {
      if (f1 > f2) {
        b = x2;
        x2 = x1;
        f2 = f1;
        x1 = b - phi * (b - a);
        f1 = fn(x1);
      } else {
        a = x1;
        x1 = x2;
        f1 = f2;
        x2 = a + phi * (b - a);
        f2 = fn(x2);
      }
    } else {
      if (f1 < f2) {
        b = x2;
        x2 = x1;
        f2 = f1;
        x1 = b - phi * (b - a);
        f1 = fn(x1);
      } else {
        a = x1;
        x1 = x2;
        f1 = f2;
        x2 = a + phi * (b - a);
        f2 = fn(x2);
      }
    }
  }

  const bestX = (a + b) / 2;
  const bestY = fn(bestX);
  if (!Number.isFinite(bestY)) return null;

  return {
    x: Number(bestX.toFixed(5)),
    y: Number(bestY.toFixed(5)),
  };
}

// Intersections between f(x) and g(x)
export function findIntersections(
  fn1: (x: number) => number,
  fn2: (x: number) => number,
  xMin: number,
  xMax: number
): Array<{ x: number; y: number }> {
  const diffFn = (x: number) => fn1(x) - fn2(x);
  const rootXs = findRoots(diffFn, xMin, xMax);
  return rootXs
    .map(x => ({ x, y: Number(fn1(x).toFixed(5)) }))
    .filter(pt => Number.isFinite(pt.y));
}

// -------------------------------------------------------------
// Solvers: Quadratic, Cubic, Simultaneous Equations
// -------------------------------------------------------------

export interface QuadraticResult {
  discriminant: number;
  roots: Array<{ real: number; imag: number }>;
  vertex: { x: number; y: number };
}

export function solveQuadratic(a: number, b: number, c: number): QuadraticResult {
  const discriminant = b * b - 4 * a * c;
  const vertex = { x: -b / (2 * a), y: c - (b * b) / (4 * a) };

  if (Math.abs(discriminant) < 1e-12) {
    const r = -b / (2 * a);
    return {
      discriminant: 0,
      roots: [{ real: r, imag: 0 }],
      vertex,
    };
  }

  if (discriminant > 0) {
    const sqrtD = Math.sqrt(discriminant);
    const r1 = (-b + sqrtD) / (2 * a);
    const r2 = (-b - sqrtD) / (2 * a);
    return {
      discriminant,
      roots: [
        { real: r1, imag: 0 },
        { real: r2, imag: 0 },
      ],
      vertex,
    };
  }

  // Complex roots
  const sqrtD = Math.sqrt(-discriminant);
  const real = -b / (2 * a);
  const imag = sqrtD / (2 * a);
  return {
    discriminant,
    roots: [
      { real, imag },
      { real, imag: -imag },
    ],
    vertex,
  };
}

// Simultaneous Linear System 2x2:
// a1*x + b1*y = c1
// a2*x + b2*y = c2
export function solveSystem2x2(
  a1: number, b1: number, c1: number,
  a2: number, b2: number, c2: number
): { x: number; y: number } | 'NO_SOLUTION' | 'INFINITE_SOLUTIONS' {
  const det = a1 * b2 - a2 * b1;
  const detX = c1 * b2 - c2 * b1;
  const detY = a1 * c2 - a2 * c1;

  if (Math.abs(det) < 1e-12) {
    if (Math.abs(detX) < 1e-12 && Math.abs(detY) < 1e-12) {
      return 'INFINITE_SOLUTIONS';
    }
    return 'NO_SOLUTION';
  }

  return {
    x: detX / det,
    y: detY / det,
  };
}

// -------------------------------------------------------------
// 1-Variable Statistics Calculator
// -------------------------------------------------------------
export function calculate1VarStats(data: Array<{ x: number; freq: number }>): StatSummary | null {
  const validData = data.filter(d => Number.isFinite(d.x) && Number.isFinite(d.freq) && d.freq > 0);
  if (validData.length === 0) return null;

  // Flatten for quartile calculation
  const expanded: number[] = [];
  let sumX = 0;
  let sumX2 = 0;
  let n = 0;

  for (const item of validData) {
    sumX += item.x * item.freq;
    sumX2 += item.x * item.x * item.freq;
    n += item.freq;
    for (let f = 0; f < item.freq; f++) {
      expanded.push(item.x);
    }
  }

  if (n === 0) return null;

  expanded.sort((a, b) => a - b);
  const mean = sumX / n;
  const variancePop = Math.max(0, (sumX2 - (sumX * sumX) / n) / n);
  const varianceSample = n > 1 ? Math.max(0, (sumX2 - (sumX * sumX) / n) / (n - 1)) : 0;

  const min = expanded[0];
  const max = expanded[expanded.length - 1];

  const getPercentile = (p: number) => {
    const idx = (expanded.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return expanded[lower] * (1 - weight) + expanded[upper] * weight;
  };

  const q1 = getPercentile(0.25);
  const median = getPercentile(0.5);
  const q3 = getPercentile(0.75);

  return {
    n,
    sumX,
    sumX2,
    mean,
    popStdDev: Math.sqrt(variancePop),
    sampleStdDev: Math.sqrt(varianceSample),
    min,
    q1,
    median,
    q3,
    max,
    iqr: q3 - q1,
  };
}

// -------------------------------------------------------------
// Scientific Constants Library (Casio CONST)
// -------------------------------------------------------------
export interface ScientificConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
  category: 'Physics' | 'Universal' | 'Atomic';
}

export const SCIENTIFIC_CONSTANTS: ScientificConstant[] = [
  { symbol: 'c', name: 'Speed of Light in Vacuum', value: 299792458, unit: 'm/s', category: 'Universal' },
  { symbol: 'h', name: 'Planck Constant', value: 6.62607015e-34, unit: 'J·s', category: 'Universal' },
  { symbol: 'ħ', name: 'Reduced Planck Constant', value: 1.054571817e-34, unit: 'J·s', category: 'Universal' },
  { symbol: 'G', name: 'Newtonian Constant of Gravitation', value: 6.6743e-11, unit: 'm³/(kg·s²)', category: 'Universal' },
  { symbol: 'g', name: 'Standard Acceleration of Gravity', value: 9.80665, unit: 'm/s²', category: 'Physics' },
  { symbol: 'e', name: 'Elementary Charge', value: 1.602176634e-19, unit: 'C', category: 'Atomic' },
  { symbol: 'm_e', name: 'Electron Mass', value: 9.1093837015e-31, unit: 'kg', category: 'Atomic' },
  { symbol: 'm_p', name: 'Proton Mass', value: 1.67262192369e-27, unit: 'kg', category: 'Atomic' },
  { symbol: 'm_n', name: 'Neutron Mass', value: 1.67492749804e-27, unit: 'kg', category: 'Atomic' },
  { symbol: 'N_A', name: 'Avogadro Constant', value: 6.02214076e23, unit: 'mol⁻¹', category: 'Universal' },
  { symbol: 'R', name: 'Molar Gas Constant', value: 8.314462618, unit: 'J/(mol·K)', category: 'Universal' },
  { symbol: 'k_B', name: 'Boltzmann Constant', value: 1.380649e-23, unit: 'J/K', category: 'Universal' },
  { symbol: 'σ', name: 'Stefan-Boltzmann Constant', value: 5.670374419e-8, unit: 'W/(m²·K⁴)', category: 'Physics' },
  { symbol: 'ε_0', name: 'Vacuum Electric Permittivity', value: 8.8541878128e-12, unit: 'F/m', category: 'Physics' },
  { symbol: 'μ_0', name: 'Vacuum Magnetic Permeability', value: 1.25663706212e-6, unit: 'N/A²', category: 'Physics' },
  { symbol: 'a_0', name: 'Bohr Radius', value: 5.29177210903e-11, unit: 'm', category: 'Atomic' },
  { symbol: 'R_∞', name: 'Rydberg Constant', value: 10973731.56816, unit: 'm⁻¹', category: 'Atomic' },
];
