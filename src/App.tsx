/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalculatorMode,
  AngleUnit,
  HistoryItem,
  GraphFunction,
  VariablesMap,
} from './types/calculator';
import {
  evaluateCasioExpression,
  formatResult,
  decimalToFraction,
  toRadians,
} from './utils/mathEngine';
import { setSoundEnabled, isSoundEnabled, playKeyClick } from './utils/audioFeedback';
import { AndroidFrame } from './components/AndroidFrame';
import { CasioDisplay } from './components/CasioDisplay';
import { CasioKeypad } from './components/CasioKeypad';
import { GraphCanvas } from './components/GraphCanvas';
import { TableMode } from './components/TableMode';
import { SolversMode } from './components/SolversMode';
import { StatMode } from './components/StatMode';
import { MatrixMode } from './components/MatrixMode';
import { ConvertMode } from './components/ConvertMode';
import { ModeSelectorModal } from './components/ModeSelectorModal';
import { Calculator, LineChart, Table, Hash, BarChart3, Grid, Atom } from 'lucide-react';

const INITIAL_VARIABLES: VariablesMap = {
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
  F: 0,
  X: 0,
  Y: 0,
  M: 0,
  Ans: 0,
  PreAns: 0,
};

const INITIAL_GRAPH_FUNCTIONS: GraphFunction[] = [
  { id: '1', name: 'Y1', expr: 'sin(x)', color: '#38bdf8', enabled: true },
  { id: '2', name: 'Y2', expr: '0.2x^2 - 2', color: '#34d399', enabled: true },
  { id: '3', name: 'Y3', expr: '', color: '#fbbf24', enabled: false },
  { id: '4', name: 'Y4', expr: '', color: '#f43f5e', enabled: false },
];

export default function App() {
  // Mode state
  const [currentMode, setCurrentMode] = useState<CalculatorMode>('COMP');
  const [showModeModal, setShowModeModal] = useState<boolean>(false);

  // Sound feedback state
  const [soundActive, setSoundActiveState] = useState<boolean>(true);

  // Scientific Calculator state
  const [expression, setExpression] = useState<string>('');
  const [cursorPos, setCursorPos] = useState<number>(0);
  const [result, setResult] = useState<string>('0');
  const [exactFraction, setExactFraction] = useState<string | undefined>(undefined);
  const [showingExact, setShowingExact] = useState<boolean>(false);
  const [engMode, setEngMode] = useState<boolean>(false);

  // Casio Shift & Alpha flags
  const [isShift, setIsShift] = useState<boolean>(false);
  const [isAlpha, setIsAlpha] = useState<boolean>(false);

  // Settings
  const [angleUnit, setAngleUnit] = useState<AngleUnit>('DEG');
  const [variables, setVariables] = useState<VariablesMap>(INITIAL_VARIABLES);

  // Calculation History
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 'demo-1',
      timestamp: Date.now() - 60000,
      expression: 'sin(30) + cos(60)',
      result: '1',
      exactFraction: '1',
      angleUnit: 'DEG',
      mode: 'COMP',
    },
    {
      id: 'demo-2',
      timestamp: Date.now() - 30000,
      expression: '3/4 + 1/2',
      result: '1.25',
      exactFraction: '5/4',
      angleUnit: 'DEG',
      mode: 'COMP',
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Graphing Functions State
  const [graphFunctions, setGraphFunctions] = useState<GraphFunction[]>(INITIAL_GRAPH_FUNCTIONS);

  // Sound toggle
  const toggleSound = () => {
    const next = !soundActive;
    setSoundActiveState(next);
    setSoundEnabled(next);
    if (next) playKeyClick('action');
  };

  // Toggle Angle unit: DEG -> RAD -> GRAD -> DEG
  const handleToggleAngleUnit = () => {
    playKeyClick('action');
    setAngleUnit(prev => {
      if (prev === 'DEG') return 'RAD';
      if (prev === 'RAD') return 'GRAD';
      return 'DEG';
    });
  };

  // Toggle S<=>D (Standard to Decimal)
  const handleToggleSD = () => {
    playKeyClick('action');
    setShowingExact(prev => !prev);
  };

  // Engineering Notation ENG
  const handleToggleENG = () => {
    playKeyClick('action');
    const num = parseFloat(result);
    if (Number.isFinite(num)) {
      if (!engMode) {
        setResult(formatResult(num, 'ENG'));
        setEngMode(true);
      } else {
        setResult(formatResult(num, 'NORM'));
        setEngMode(false);
      }
    }
  };

  // Insert text at current cursor position
  const insertAtCursor = useCallback(
    (textToInsert: string) => {
      setExpression(prev => {
        const before = prev.slice(0, cursorPos);
        const after = prev.slice(cursorPos);
        return before + textToInsert + after;
      });
      setCursorPos(prev => prev + textToInsert.length);
      setIsShift(false);
      setIsAlpha(false);
    },
    [cursorPos]
  );

  // Delete character before cursor (DEL key)
  const handleDeleteChar = useCallback(() => {
    if (cursorPos > 0) {
      setExpression(prev => {
        const before = prev.slice(0, cursorPos - 1);
        const after = prev.slice(cursorPos);
        return before + after;
      });
      setCursorPos(prev => Math.max(0, prev - 1));
    }
  }, [cursorPos]);

  // Clear all (AC key)
  const handleClearAll = useCallback(() => {
    setExpression('');
    setCursorPos(0);
    setResult('0');
    setExactFraction(undefined);
    setShowingExact(false);
    setIsShift(false);
    setIsAlpha(false);
    setHistoryIndex(-1);
  }, []);

  // Move cursor left or right
  const handleCursorMove = useCallback(
    (dir: 'left' | 'right') => {
      if (dir === 'left') {
        setCursorPos(prev => Math.max(0, prev - 1));
      } else {
        setCursorPos(prev => Math.min(expression.length, prev + 1));
      }
    },
    [expression.length]
  );

  // Step through history with D-Pad Up / Down
  const handleHistoryStep = useCallback(
    (dir: 'up' | 'down') => {
      if (history.length === 0) return;

      if (dir === 'up') {
        const nextIdx = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        if (nextIdx >= 0 && nextIdx < history.length) {
          const item = history[history.length - 1 - nextIdx];
          setExpression(item.expression);
          setCursorPos(item.expression.length);
          setResult(item.result);
          setExactFraction(item.exactFraction);
          setHistoryIndex(nextIdx);
        }
      } else {
        const nextIdx = historyIndex - 1;
        if (nextIdx >= 0) {
          const item = history[history.length - 1 - nextIdx];
          setExpression(item.expression);
          setCursorPos(item.expression.length);
          setResult(item.result);
          setExactFraction(item.exactFraction);
          setHistoryIndex(nextIdx);
        } else if (nextIdx === -1) {
          setExpression('');
          setCursorPos(0);
          setResult('0');
          setExactFraction(undefined);
          setHistoryIndex(-1);
        }
      }
    },
    [history, historyIndex]
  );

  // Evaluate Expression (= key)
  const handleCalculate = useCallback(() => {
    if (!expression.trim()) return;

    const evalRes = evaluateCasioExpression(expression, {
      angleUnit,
      variables,
    });

    if (evalRes.error) {
      setResult(evalRes.error);
      setExactFraction(undefined);
      return;
    }

    const formatted = formatResult(evalRes.result);
    setResult(formatted);
    setExactFraction(evalRes.exactFraction);
    setShowingExact(false);

    // Update Ans & PreAns registers
    setVariables(prev => ({
      ...prev,
      PreAns: prev.Ans,
      Ans: evalRes.result,
    }));

    // Add to history tape
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      expression,
      result: formatted,
      exactFraction: evalRes.exactFraction,
      angleUnit,
      mode: currentMode,
    };
    setHistory(prev => [newItem, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
  }, [expression, angleUnit, variables, currentMode]);

  // Handle Key Presses from CasioKeypad
  const handleKeyPress = useCallback(
    (action: string, fromShift: boolean, fromAlpha: boolean) => {
      // 1. Shifted functions
      if (action === 'x!') {
        insertAtCursor('!');
        return;
      }
      if (action === '³√') {
        insertAtCursor('cbrt(');
        return;
      }
      if (action === 'x³') {
        insertAtCursor('^3');
        return;
      }
      if (action === '■√') {
        insertAtCursor('^(1/');
        return;
      }
      if (action === '10^x') {
        insertAtCursor('10^(');
        return;
      }
      if (action === 'e^x') {
        insertAtCursor('exp(');
        return;
      }
      if (action === 'Ran#') {
        insertAtCursor('Ran#');
        return;
      }
      if (action === 'sin⁻¹') {
        insertAtCursor('sin⁻¹(');
        return;
      }
      if (action === 'cos⁻¹') {
        insertAtCursor('cos⁻¹(');
        return;
      }
      if (action === 'tan⁻¹') {
        insertAtCursor('tan⁻¹(');
        return;
      }
      if (action === '∫dx') {
        insertAtCursor('∫(x^2, 0, 1)');
        return;
      }
      if (action === 'd/dx') {
        insertAtCursor('d/dx(x^2, 2)');
        return;
      }
      if (action === 'RCL') {
        // Recall variable Ans or M
        insertAtCursor(String(variables.Ans));
        return;
      }
      if (action === 'nPr') {
        insertAtCursor(' nPr ');
        return;
      }
      if (action === 'nCr') {
        insertAtCursor(' nCr ');
        return;
      }
      if (action === 'π') {
        insertAtCursor('π');
        return;
      }
      if (action === 'e') {
        insertAtCursor('e');
        return;
      }
      if (action === 'PreAns') {
        insertAtCursor('PreAns');
        return;
      }
      if (action === 'a b/c') {
        handleToggleSD();
        return;
      }

      // 2. Alpha Variables
      if (['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'].includes(action)) {
        insertAtCursor(action);
        return;
      }

      // 3. Regular Primary Functions
      switch (action) {
        case 'x⁻¹':
          insertAtCursor('^(-1)');
          break;
        case '√':
          insertAtCursor('√(');
          break;
        case 'x²':
          insertAtCursor('^2');
          break;
        case 'x^■':
          insertAtCursor('^(');
          break;
        case 'log':
          insertAtCursor('log(');
          break;
        case 'ln':
          insertAtCursor('ln(');
          break;
        case '(-)':
          insertAtCursor('-');
          break;
        case '° \' "':
          insertAtCursor('°');
          break;
        case 'sin':
          insertAtCursor('sin(');
          break;
        case 'cos':
          insertAtCursor('cos(');
          break;
        case 'tan':
          insertAtCursor('tan(');
          break;
        case 'STO': {
          // Store result to M
          const currentVal = parseFloat(result);
          if (Number.isFinite(currentVal)) {
            setVariables(v => ({ ...v, M: currentVal }));
          }
          break;
        }
        case 'ENG':
          handleToggleENG();
          break;
        case 'S⇔D':
          handleToggleSD();
          break;
        case 'M+': {
          const currentVal = parseFloat(result);
          if (Number.isFinite(currentVal)) {
            setVariables(v => ({ ...v, M: v.M + currentVal }));
          }
          break;
        }
        case '×10^':
          insertAtCursor('×10^');
          break;
        case 'Ans':
          insertAtCursor('Ans');
          break;
        default:
          insertAtCursor(action);
          break;
      }
    },
    [insertAtCursor, result, variables]
  );

  // Send value from Solvers/Stats/Matrix/Convert into expression
  const handleInsertToCalc = (valStr: string) => {
    setCurrentMode('COMP');
    insertAtCursor(valStr);
  };

  return (
    <AndroidFrame
      currentMode={currentMode}
      onOpenMenu={() => setShowModeModal(true)}
      angleUnit={angleUnit}
      onToggleAngleUnit={handleToggleAngleUnit}
      soundActive={soundActive}
      onToggleSound={toggleSound}
      onReset={handleClearAll}
    >
      {/* Quick Mode Navigation Ribbon */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1626] border-b border-slate-800 overflow-x-auto scrollbar-none text-xs shrink-0">
        {[
          { id: 'COMP', label: 'COMP', icon: <Calculator className="w-3.5 h-3.5" /> },
          { id: 'GRAPH', label: 'GRAPH', icon: <LineChart className="w-3.5 h-3.5" /> },
          { id: 'TABLE', label: 'TABLE', icon: <Table className="w-3.5 h-3.5" /> },
          { id: 'EQUATION', label: 'EQUA', icon: <Hash className="w-3.5 h-3.5" /> },
          { id: 'STAT', label: 'STAT', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'MATRIX', label: 'MAT', icon: <Grid className="w-3.5 h-3.5" /> },
          { id: 'CONVERT', label: 'CONV', icon: <Atom className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              playKeyClick('action');
              setCurrentMode(tab.id as CalculatorMode);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold whitespace-nowrap transition-all ${
              currentMode === tab.id
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mode Viewport Switcher */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* COMP MODE (Scientific Calculator) */}
        {currentMode === 'COMP' && (
          <div className="flex-1 flex flex-col justify-between p-2 space-y-2 overflow-y-auto">
            {/* Casio Natural LCD Display */}
            <CasioDisplay
              expression={expression}
              cursorPos={cursorPos}
              result={result}
              exactFraction={exactFraction}
              isShift={isShift}
              isAlpha={isAlpha}
              angleUnit={angleUnit}
              hasMemory={variables.M !== 0}
              history={history}
              onSelectHistory={item => {
                setExpression(item.expression);
                setCursorPos(item.expression.length);
                setResult(item.result);
                setExactFraction(item.exactFraction);
              }}
              onToggleAngleUnit={handleToggleAngleUnit}
              onToggleSD={handleToggleSD}
              showingExact={showingExact}
            />

            {/* Authentic Casio Physical Keypad */}
            <div className="flex-1 flex flex-col justify-end">
              <CasioKeypad
                onKeyPress={handleKeyPress}
                isShift={isShift}
                isAlpha={isAlpha}
                onToggleShift={() => setIsShift(prev => !prev)}
                onToggleAlpha={() => setIsAlpha(prev => !prev)}
                onOpenMenu={() => setShowModeModal(true)}
                onCursorMove={handleCursorMove}
                onHistoryStep={handleHistoryStep}
                onClearAll={handleClearAll}
                onDeleteChar={handleDeleteChar}
                onCalculate={handleCalculate}
              />
            </div>
          </div>
        )}

        {/* GRAPH MODE (Advanced Multi-Graphing Engine) */}
        {currentMode === 'GRAPH' && (
          <GraphCanvas
            functions={graphFunctions}
            onUpdateFunctions={setGraphFunctions}
            angleUnit={angleUnit}
            onInsertToCalc={handleInsertToCalc}
          />
        )}

        {/* TABLE MODE (Function Value Table) */}
        {currentMode === 'TABLE' && (
          <TableMode
            functions={graphFunctions}
            angleUnit={angleUnit}
            onNavigateToGraph={() => setCurrentMode('GRAPH')}
            onInsertToCalc={handleInsertToCalc}
          />
        )}

        {/* EQUATION SOLVER MODE */}
        {currentMode === 'EQUATION' && (
          <SolversMode onInsertToCalc={handleInsertToCalc} />
        )}

        {/* 1-VAR STATISTICS MODE */}
        {currentMode === 'STAT' && (
          <StatMode onInsertToCalc={handleInsertToCalc} />
        )}

        {/* MATRIX ALGEBRA MODE */}
        {currentMode === 'MATRIX' && (
          <MatrixMode onInsertToCalc={handleInsertToCalc} />
        )}

        {/* CONVERTER & CONSTANTS MODE */}
        {currentMode === 'CONVERT' && (
          <ConvertMode onInsertToCalc={handleInsertToCalc} />
        )}
      </div>

      {/* Casio ClassWiz Mode Selector Sheet / Modal */}
      {showModeModal && (
        <ModeSelectorModal
          currentMode={currentMode}
          onSelectMode={setCurrentMode}
          onClose={() => setShowModeModal(false)}
          soundActive={soundActive}
          onToggleSound={toggleSound}
        />
      )}
    </AndroidFrame>
  );
}
