import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  GraphFunction,
  GraphBounds,
  GraphAnalysisResult,
  AngleUnit,
} from '../types/calculator';
import {
  createFunctionEvaluator,
  findRoots,
  findExtrema,
  findIntersections,
  definiteIntegral,
  derivative,
  formatResult,
} from '../utils/mathEngine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Compass,
  Calculator,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface GraphCanvasProps {
  functions: GraphFunction[];
  onUpdateFunctions: (funcs: GraphFunction[]) => void;
  angleUnit: AngleUnit;
  onInsertToCalc?: (val: string) => void;
}

const DEFAULT_BOUNDS: GraphBounds = {
  xMin: -10,
  xMax: 10,
  yMin: -7,
  yMax: 7,
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  functions,
  onUpdateFunctions,
  angleUnit,
  onInsertToCalc,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Graph viewing window
  const [bounds, setBounds] = useState<GraphBounds>(DEFAULT_BOUNDS);
  
  // Interactive Trace Mode
  const [isTracing, setIsTracing] = useState<boolean>(true);
  const [traceX, setTraceX] = useState<number>(0);
  const [activeFuncId, setActiveFuncId] = useState<string>(functions[0]?.id || '1');

  // G-Solve results
  const [analysisResult, setAnalysisResult] = useState<GraphAnalysisResult | null>(null);
  const [showGSolveMenu, setShowGSolveMenu] = useState<boolean>(false);
  const [integralRange, setIntegralRange] = useState<{ a: number; b: number }>({ a: 0, b: 3 });
  const [showIntegralModal, setShowIntegralModal] = useState<boolean>(false);

  // Functions manager sheet
  const [showFuncEditor, setShowFuncEditor] = useState<boolean>(false);

  // Dragging state
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const initialPinchDist = useRef<number | null>(null);

  // Compiled evaluators cache
  const compiledEvaluators = useMemo(() => {
    const map = new Map<string, (x: number) => number>();
    for (const f of functions) {
      if (f.enabled && f.expr.trim()) {
        try {
          map.set(f.id, createFunctionEvaluator(f.expr, angleUnit));
        } catch {
          // ignore invalid
        }
      }
    }
    return map;
  }, [functions, angleUnit]);

  // Current active function evaluator
  const activeEvaluator = compiledEvaluators.get(activeFuncId);
  const activeFunction = functions.find(f => f.id === activeFuncId);

  // Screen to Math coordinate conversions
  const toMathCoords = useCallback(
    (screenX: number, screenY: number, width: number, height: number) => {
      const x = bounds.xMin + (screenX / width) * (bounds.xMax - bounds.xMin);
      const y = bounds.yMax - (screenY / height) * (bounds.yMax - bounds.yMin);
      return { x, y };
    },
    [bounds]
  );

  const toScreenCoords = useCallback(
    (mathX: number, mathY: number, width: number, height: number) => {
      const screenX = ((mathX - bounds.xMin) / (bounds.xMax - bounds.xMin)) * width;
      const screenY = ((bounds.yMax - mathY) / (bounds.yMax - bounds.yMin)) * height;
      return { x: screenX, y: screenY };
    },
    [bounds]
  );

  // Main Canvas Render
  const renderGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background: Dark Casio OLED graph display
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Coordinate grid spacing
    const xRange = bounds.xMax - bounds.xMin;
    const yRange = bounds.yMax - bounds.yMin;

    // Determine grid step
    const getGridStep = (range: number) => {
      const rawStep = range / 8;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const rel = rawStep / magnitude;
      if (rel < 1.5) return magnitude;
      if (rel < 3.5) return 2 * magnitude;
      if (rel < 7.5) return 5 * magnitude;
      return 10 * magnitude;
    };

    const xStep = getGridStep(xRange);
    const yStep = getGridStep(yRange);

    // 1. Draw Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';

    // Sub-grid
    const xStart = Math.floor(bounds.xMin / xStep) * xStep;
    const yStart = Math.floor(bounds.yMin / yStep) * yStep;

    ctx.beginPath();
    for (let x = xStart; x <= bounds.xMax; x += xStep) {
      const { x: sx } = toScreenCoords(x, 0, width, height);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }
    for (let y = yStart; y <= bounds.yMax; y += yStep) {
      const { y: sy } = toScreenCoords(0, y, width, height);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();

    // 2. Draw Axes
    const origin = toScreenCoords(0, 0, width, height);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#475569';

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, height);
    ctx.stroke();

    // Axis Tick Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = xStart; x <= bounds.xMax; x += xStep) {
      if (Math.abs(x) < 1e-6) continue; // Skip origin 0
      const { x: sx } = toScreenCoords(x, 0, width, height);
      const labelY = Math.min(Math.max(origin.y + 4, 12), height - 16);
      ctx.fillText(Number(x.toFixed(4)).toString(), sx, labelY);

      // Tick mark
      ctx.beginPath();
      ctx.moveTo(sx, origin.y - 3);
      ctx.lineTo(sx, origin.y + 3);
      ctx.stroke();
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = yStart; y <= bounds.yMax; y += yStep) {
      if (Math.abs(y) < 1e-6) continue;
      const { y: sy } = toScreenCoords(0, y, width, height);
      const labelX = Math.min(Math.max(origin.x - 6, 28), width - 6);
      ctx.fillText(Number(y.toFixed(4)).toString(), labelX, sy);

      // Tick mark
      ctx.beginPath();
      ctx.moveTo(origin.x - 3, sy);
      ctx.lineTo(origin.x + 3, sy);
      ctx.stroke();
    }

    // 3. Shaded Definite Integral Area (if active G-Solve)
    if (analysisResult?.type === 'integral' && analysisResult.integralRange && activeEvaluator) {
      const [intA, intB] = analysisResult.integralRange;
      const startX = Math.min(intA, intB);
      const endX = Math.max(intA, intB);

      ctx.save();
      ctx.beginPath();
      const pStart = toScreenCoords(startX, 0, width, height);
      ctx.moveTo(pStart.x, pStart.y);

      const intSteps = 150;
      const intStepSize = (endX - startX) / intSteps;
      for (let i = 0; i <= intSteps; i++) {
        const mx = startX + i * intStepSize;
        const my = activeEvaluator(mx);
        if (Number.isFinite(my)) {
          const pt = toScreenCoords(mx, my, width, height);
          ctx.lineTo(pt.x, pt.y);
        }
      }

      const pEnd = toScreenCoords(endX, 0, width, height);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.closePath();

      // Translucent amber gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0.08)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    // 4. Plot Each Enabled Function
    for (const f of functions) {
      if (!f.enabled || !f.expr.trim()) continue;
      const fn = compiledEvaluators.get(f.id);
      if (!fn) continue;

      ctx.save();
      ctx.lineWidth = f.id === activeFuncId ? 2.5 : 1.75;
      ctx.strokeStyle = f.color;

      ctx.beginPath();
      let isFirst = true;
      let lastY = 0;

      // Sub-pixel sampling across width
      const totalPixels = width * 1.5;
      for (let i = 0; i <= totalPixels; i++) {
        const sx = (i / totalPixels) * width;
        const mx = bounds.xMin + (sx / width) * (bounds.xMax - bounds.xMin);
        const my = fn(mx);

        if (!Number.isFinite(my)) {
          isFirst = true;
          continue;
        }

        const { y: sy } = toScreenCoords(mx, my, width, height);

        // Discontinuity check (e.g. tan(x), 1/x)
        if (!isFirst && Math.abs(sy - lastY) > height * 0.75) {
          isFirst = true;
        }

        if (isFirst) {
          ctx.moveTo(sx, sy);
          isFirst = false;
        } else {
          ctx.lineTo(sx, sy);
        }
        lastY = sy;
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Render G-Solve Results (Roots, Extrema, Intersections)
    if (analysisResult?.points && analysisResult.points.length > 0) {
      for (const pt of analysisResult.points) {
        const { x: sx, y: sy } = toScreenCoords(pt.x, pt.y, width, height);

        if (sx >= -10 && sx <= width + 10 && sy >= -10 && sy <= height + 10) {
          // Glowing marker
          ctx.save();
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Coordinate label tag
          ctx.fillStyle = '#0f172a';
          const text = `(${formatResult(pt.x)}, ${formatResult(pt.y)})`;
          ctx.font = '10px "JetBrains Mono", monospace';
          const textWidth = ctx.measureText(text).width;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          const rectX = Math.min(Math.max(sx - textWidth / 2 - 4, 4), width - textWidth - 12);
          const rectY = sy > 40 ? sy - 22 : sy + 10;

          ctx.fillRect(rectX, rectY, textWidth + 8, 16);
          ctx.strokeRect(rectX, rectY, textWidth + 8, 16);

          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, rectX + 4, rectY + 8);
        }
      }
    }

    // 6. Trace Mode Cursor & Tangent Line
    if (isTracing && activeEvaluator && activeFunction) {
      const curY = activeEvaluator(traceX);

      if (Number.isFinite(curY)) {
        const pt = toScreenCoords(traceX, curY, width, height);

        // Tangent line at trace point
        try {
          const slope = derivative(activeEvaluator, traceX);
          if (Number.isFinite(slope)) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);

            // Tangent line points: y - y0 = m*(x - x0)
            const tanDx = (bounds.xMax - bounds.xMin) * 0.15;
            const x1 = traceX - tanDx;
            const y1 = curY - slope * tanDx;
            const x2 = traceX + tanDx;
            const y2 = curY + slope * tanDx;

            const p1 = toScreenCoords(x1, y1, width, height);
            const p2 = toScreenCoords(x2, y2, width, height);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        } catch {
          // ignore tangent error
        }

        // Trace Crosshair / Point
        ctx.save();
        ctx.strokeStyle = activeFunction.color;
        ctx.lineWidth = 1.5;

        // Vertical and horizontal guidelines
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(pt.x, 0);
        ctx.lineTo(pt.x, height);
        ctx.moveTo(0, pt.y);
        ctx.lineTo(width, pt.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulsing Point
        ctx.fillStyle = activeFunction.color;
        ctx.shadowColor = activeFunction.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }, [
    bounds,
    functions,
    compiledEvaluators,
    activeFuncId,
    activeEvaluator,
    activeFunction,
    isTracing,
    traceX,
    analysisResult,
    toScreenCoords,
  ]);

  // Handle Resize and Canvas DPR
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      renderGraph();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderGraph]);

  // Trigger render on bounds or data change
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  // Touch and Mouse Controls: Pan & Pinch Zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;

    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      const rect = container.getBoundingClientRect();
      const mathDx = (dx / rect.width) * (bounds.xMax - bounds.xMin);
      const mathDy = (dy / rect.height) * (bounds.yMax - bounds.yMin);

      setBounds(b => ({
        xMin: b.xMin - mathDx,
        xMax: b.xMax - mathDx,
        yMin: b.yMin + mathDy,
        yMax: b.yMax + mathDy,
      }));
    } else if (isTracing) {
      // Move trace along curve
      const rect = container.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const math = toMathCoords(localX, 0, rect.width, rect.height);
      setTraceX(Number(math.x.toFixed(3)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.85 : 1.15;
    zoomByFactor(factor);
  };

  const zoomByFactor = (factor: number) => {
    setBounds(b => {
      const cx = (b.xMin + b.xMax) / 2;
      const cy = (b.yMin + b.yMax) / 2;
      const hw = ((b.xMax - b.xMin) * factor) / 2;
      const hh = ((b.yMax - b.yMin) * factor) / 2;
      return {
        xMin: cx - hw,
        xMax: cx + hw,
        yMin: cy - hh,
        yMax: cy + hh,
      };
    });
  };

  // Zoom Presets
  const setStandardView = () => setBounds(DEFAULT_BOUNDS);

  const setTrigView = () => {
    const pi = Math.PI;
    setBounds({
      xMin: -2 * pi,
      xMax: 2 * pi,
      yMin: -3,
      yMax: 3,
    });
  };

  const setPositiveQuad = () => {
    setBounds({
      xMin: 0,
      xMax: 15,
      yMin: 0,
      yMax: 15,
    });
  };

  const setAutoFit = () => {
    if (!activeEvaluator) return;
    const samples = 100;
    const step = (bounds.xMax - bounds.xMin) / samples;
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let i = 0; i <= samples; i++) {
      const x = bounds.xMin + i * step;
      const y = activeEvaluator(x);
      if (Number.isFinite(y)) {
        if (y < minVal) minVal = y;
        if (y > maxVal) maxVal = y;
      }
    }

    if (minVal < maxVal && Number.isFinite(minVal) && Number.isFinite(maxVal)) {
      const pad = (maxVal - minVal) * 0.15 || 2;
      setBounds(b => ({
        ...b,
        yMin: minVal - pad,
        yMax: maxVal + pad,
      }));
    }
  };

  // -------------------------------------------------------------
  // G-Solve Actions (Casio Hallmark)
  // -------------------------------------------------------------

  const handleGSolveRoots = () => {
    setShowGSolveMenu(false);
    if (!activeEvaluator) return;
    const roots = findRoots(activeEvaluator, bounds.xMin, bounds.xMax);
    if (roots.length === 0) {
      setAnalysisResult({
        type: 'root',
        title: 'Roots (Zeros)',
        info: 'No real roots found in current view window.',
        points: [],
      });
      return;
    }
    const points = roots.map(r => ({ x: r, y: 0, label: `x=${r}` }));
    setAnalysisResult({
      type: 'root',
      title: `Roots found: ${roots.length}`,
      points,
      info: roots.map(r => `x = ${r}`).join('  ·  '),
    });
    // Move trace to first root
    setTraceX(roots[0]);
  };

  const handleGSolveExtrema = (type: 'max' | 'min') => {
    setShowGSolveMenu(false);
    if (!activeEvaluator) return;
    const { min, max } = findExtrema(activeEvaluator, bounds.xMin, bounds.xMax);
    const list = type === 'max' ? max : min;

    if (list.length === 0) {
      setAnalysisResult({
        type,
        title: type === 'max' ? 'Local Maxima' : 'Local Minima',
        info: `No local ${type === 'max' ? 'maxima' : 'minima'} found in view window.`,
        points: [],
      });
      return;
    }

    setAnalysisResult({
      type,
      title: `${type === 'max' ? 'Maxima' : 'Minima'} found: ${list.length}`,
      points: list,
      info: list.map(p => `(${p.x}, ${p.y})`).join('  ·  '),
    });
    setTraceX(list[0].x);
  };

  const handleGSolveYIntercept = () => {
    setShowGSolveMenu(false);
    if (!activeEvaluator) return;
    const yVal = activeEvaluator(0);
    if (!Number.isFinite(yVal)) {
      setAnalysisResult({
        type: 'intercept',
        title: 'Y-Intercept',
        info: 'f(0) is undefined.',
        points: [],
      });
      return;
    }
    const roundedY = Number(yVal.toFixed(5));
    setAnalysisResult({
      type: 'intercept',
      title: 'Y-Intercept',
      points: [{ x: 0, y: roundedY, label: `y = ${roundedY}` }],
      info: `(0, ${roundedY})`,
    });
    setTraceX(0);
  };

  const handleGSolveIntersections = () => {
    setShowGSolveMenu(false);
    // Find intersections between active function and any other enabled function
    const otherFunc = functions.find(f => f.id !== activeFuncId && f.enabled && f.expr.trim());
    if (!otherFunc || !activeEvaluator) {
      setAnalysisResult({
        type: 'intersect',
        title: 'Intersection',
        info: 'Enable at least two functions (e.g. Y1 and Y2) to find intersections.',
        points: [],
      });
      return;
    }
    const otherEval = compiledEvaluators.get(otherFunc.id);
    if (!otherEval) return;

    const pts = findIntersections(activeEvaluator, otherEval, bounds.xMin, bounds.xMax);
    if (pts.length === 0) {
      setAnalysisResult({
        type: 'intersect',
        title: `Intersections (${activeFunction?.name} & ${otherFunc.name})`,
        info: 'No intersection points found in current window.',
        points: [],
      });
      return;
    }

    setAnalysisResult({
      type: 'intersect',
      title: `Intersections with ${otherFunc.name}: ${pts.length}`,
      points: pts,
      info: pts.map(p => `(${p.x}, ${p.y})`).join('  ·  '),
    });
    setTraceX(pts[0].x);
  };

  const handleGSolveIntegral = () => {
    setShowGSolveMenu(false);
    setShowIntegralModal(true);
  };

  const computeDefiniteIntegral = (a: number, b: number) => {
    if (!activeEvaluator) return;
    const val = definiteIntegral(activeEvaluator, a, b);
    const formatted = formatResult(val);
    setAnalysisResult({
      type: 'integral',
      title: `Definite Integral ∫ [${a}, ${b}]`,
      value: val,
      integralRange: [a, b],
      info: `∫ ${activeFunction?.name}(x) dx = ${formatted}`,
    });
    setShowIntegralModal(false);
  };

  // Trace live readout values
  const currentY = activeEvaluator ? activeEvaluator(traceX) : NaN;
  const currentSlope = activeEvaluator ? derivative(activeEvaluator, traceX) : NaN;

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] text-slate-100 select-none overflow-hidden relative">
      {/* Top Graph Status & HUD Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          {/* Active Function Selector */}
          <div className="flex items-center gap-1">
            {functions.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFuncId(f.id);
                  setAnalysisResult(null);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                  activeFuncId === f.id
                    ? 'text-white shadow-sm ring-1'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={{
                  backgroundColor: activeFuncId === f.id ? f.color + '33' : 'transparent',
                  borderColor: f.color,
                  color: activeFuncId === f.id ? f.color : undefined,
                }}
              >
                {f.name}
              </button>
            ))}
          </div>

          <span className="text-slate-600">|</span>

          {/* Quick Active Expression summary */}
          <span className="text-slate-300 font-mono text-[11px] truncate max-w-[130px]">
            {activeFunction?.expr ? `y=${activeFunction.expr}` : 'No equation'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFuncEditor(true)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded text-[11px] font-medium"
            title="Edit Functions"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Functions</span>
          </button>

          <button
            onClick={() => setShowGSolveMenu(!showGSolveMenu)}
            className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded text-[11px] font-medium border border-amber-500/40"
            title="Casio G-Solve Tools"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>G-Solve</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative touch-none overflow-hidden cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Live Trace Readout (HUD Overlay) */}
        {isTracing && Number.isFinite(currentY) && (
          <div className="absolute top-2 left-2 pointer-events-none bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded px-2.5 py-1.5 text-[11px] font-mono shadow-lg flex items-center gap-3">
            <span style={{ color: activeFunction?.color }} className="font-semibold">
              {activeFunction?.name}
            </span>
            <span className="text-slate-300">
              X = <strong className="text-white">{formatResult(traceX)}</strong>
            </span>
            <span className="text-slate-300">
              Y = <strong className="text-white">{formatResult(currentY)}</strong>
            </span>
            {Number.isFinite(currentSlope) && (
              <span className="text-slate-400 text-[10px]">
                dy/dx = {formatResult(currentSlope)}
              </span>
            )}
          </div>
        )}

        {/* G-Solve Result Banner */}
        {analysisResult && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-lg p-2 text-xs shadow-xl flex items-center justify-between z-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col">
              <span className="text-amber-400 font-semibold text-[11px] uppercase tracking-wider">
                {analysisResult.title}
              </span>
              <span className="font-mono text-slate-200 text-[11px] mt-0.5">
                {analysisResult.info}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {analysisResult.value !== undefined && onInsertToCalc && (
                <button
                  onClick={() => onInsertToCalc(String(analysisResult.value))}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px]"
                >
                  Ans
                </button>
              )}
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Floating Zoom & Preset Controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => zoomByFactor(0.7)}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur flex items-center justify-center border border-slate-700 shadow"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomByFactor(1.3)}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur flex items-center justify-center border border-slate-700 shadow"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={setStandardView}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur flex items-center justify-center border border-slate-700 shadow text-[10px] font-bold"
            title="Standard [-10, 10]"
          >
            STD
          </button>
          <button
            onClick={setTrigView}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-sky-400 backdrop-blur flex items-center justify-center border border-slate-700 shadow text-[10px] font-bold"
            title="Trigonometric View [-2π, 2π]"
          >
            π
          </button>
          <button
            onClick={setAutoFit}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-emerald-400 backdrop-blur flex items-center justify-center border border-slate-700 shadow"
            title="Auto-Fit Curve"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Trace Scroller slider for mobile thumb control */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
        <button
          onClick={() => setIsTracing(!isTracing)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border ${
            isTracing
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <Crosshair className="w-3 h-3" />
          <span>Trace</span>
        </button>

        {isTracing && (
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">X:</span>
            <input
              type="range"
              min={bounds.xMin}
              max={bounds.xMax}
              step={(bounds.xMax - bounds.xMin) / 400}
              value={traceX}
              onChange={e => setTraceX(parseFloat(e.target.value))}
              className="flex-1 accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-300 font-mono w-10 text-right">
              {formatResult(traceX)}
            </span>
          </div>
        )}
      </div>

      {/* G-Solve Pop-up Drawer (Casio Classic Menu) */}
      {showGSolveMenu && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col justify-end p-3 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>CASIO G-Solve Tools</span>
              </div>
              <button
                onClick={() => setShowGSolveMenu(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select calculation for active curve <strong className="text-sky-300 font-mono">{activeFunction?.name}</strong>:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleGSolveRoots}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700 flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold text-white">ROOT (Zero)</span>
                <span className="text-[10px] text-slate-400">Solve f(x) = 0</span>
              </button>

              <button
                onClick={() => handleGSolveExtrema('max')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700 flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold text-white">MAX (Local Maxima)</span>
                <span className="text-[10px] text-slate-400">Peak coordinates</span>
              </button>

              <button
                onClick={() => handleGSolveExtrema('min')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700 flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold text-white">MIN (Local Minima)</span>
                <span className="text-[10px] text-slate-400">Valley coordinates</span>
              </button>

              <button
                onClick={handleGSolveYIntercept}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700 flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold text-white">Y-ICPT (Y-Intercept)</span>
                <span className="text-[10px] text-slate-400">Value of f(0)</span>
              </button>

              <button
                onClick={handleGSolveIntersections}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700 flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold text-white">ISCT (Intersection)</span>
                <span className="text-[10px] text-slate-400">Where curves cross</span>
              </button>

              <button
                onClick={handleGSolveIntegral}
                className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-xl text-left border border-amber-500/40 flex flex-col gap-0.5 text-amber-300"
              >
                <span className="text-xs font-semibold">∫ dx (Definite Integral)</span>
                <span className="text-[10px] text-amber-200/70">Area under curve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integral Input Modal */}
      {showIntegralModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-xs space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span>Compute Integral ∫ f(x) dx</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Lower Limit (a):</label>
                <input
                  type="number"
                  value={integralRange.a}
                  onChange={e => setIntegralRange(r => ({ ...r, a: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Upper Limit (b):</label>
                <input
                  type="number"
                  value={integralRange.b}
                  onChange={e => setIntegralRange(r => ({ ...r, b: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 font-mono text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowIntegralModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => computeDefiniteIntegral(integralRange.a, integralRange.b)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
              >
                Calculate & Shade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Function Equations Manager Sheet */}
      {showFuncEditor && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-4 max-h-[80%] overflow-y-auto space-y-3">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto -mt-1 mb-2" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Casio Graph Function List</h3>
              </div>
              <button
                onClick={() => setShowFuncEditor(false)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-full font-medium"
              >
                Done
              </button>
            </div>

            <div className="space-y-3">
              {functions.map(f => (
                <div key={f.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: f.color }}
                      />
                      <span className="font-mono font-bold text-xs" style={{ color: f.color }}>
                        {f.name} =
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onUpdateFunctions(
                            functions.map(item =>
                              item.id === f.id ? { ...item, enabled: !item.enabled } : item
                            )
                          );
                        }}
                        className={`text-xs p-1 rounded ${
                          f.enabled ? 'text-sky-400' : 'text-slate-600'
                        }`}
                        title={f.enabled ? 'Hide curve' : 'Show curve'}
                      >
                        {f.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={f.expr}
                      placeholder="e.g. sin(x), x^2 - 4, 2x + 1"
                      onChange={e => {
                        onUpdateFunctions(
                          functions.map(item =>
                            item.id === f.id ? { ...item, expr: e.target.value } : item
                          )
                        );
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Quick helper buttons for expression */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {['x', 'x^2', 'sin(x)', 'cos(x)', 'sqrt(x)', 'abs(x)', 'ln(x)'].map(helper => (
                      <button
                        key={helper}
                        onClick={() => {
                          onUpdateFunctions(
                            functions.map(item =>
                              item.id === f.id
                                ? { ...item, expr: (item.expr ? item.expr + ' ' : '') + helper }
                                : item
                            )
                          );
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono"
                      >
                        +{helper}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
