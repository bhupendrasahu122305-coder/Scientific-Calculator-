import React, { useState } from 'react';
import { SCIENTIFIC_CONSTANTS, ScientificConstant, formatResult } from '../utils/mathEngine';
import { Atom, ArrowLeftRight, Check, Copy } from 'lucide-react';

interface ConvertModeProps {
  onInsertToCalc?: (val: string) => void;
}

type UnitCategory = 'Length' | 'Mass' | 'Temperature' | 'Speed' | 'Pressure' | 'Energy';

const UNIT_CONVERSIONS: Record<
  UnitCategory,
  {
    units: Array<{ name: string; symbol: string; toBase: (v: number) => number; fromBase: (v: number) => number }>;
  }
> = {
  Length: {
    units: [
      { name: 'Meters', symbol: 'm', toBase: v => v, fromBase: v => v },
      { name: 'Kilometers', symbol: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { name: 'Centimeters', symbol: 'cm', toBase: v => v * 0.01, fromBase: v => v / 0.01 },
      { name: 'Millimeters', symbol: 'mm', toBase: v => v * 0.001, fromBase: v => v / 0.001 },
      { name: 'Inches', symbol: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
      { name: 'Feet', symbol: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { name: 'Miles', symbol: 'mi', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
      { name: 'Nautical Miles', symbol: 'nmi', toBase: v => v * 1852, fromBase: v => v / 1852 },
    ],
  },
  Mass: {
    units: [
      { name: 'Kilograms', symbol: 'kg', toBase: v => v, fromBase: v => v },
      { name: 'Grams', symbol: 'g', toBase: v => v * 0.001, fromBase: v => v * 1000 },
      { name: 'Milligrams', symbol: 'mg', toBase: v => v * 1e-6, fromBase: v => v * 1e6 },
      { name: 'Pounds', symbol: 'lb', toBase: v => v * 0.45359237, fromBase: v => v / 0.45359237 },
      { name: 'Ounces', symbol: 'oz', toBase: v => v * 0.02834952, fromBase: v => v / 0.02834952 },
      { name: 'Metric Tons', symbol: 't', toBase: v => v * 1000, fromBase: v => v / 1000 },
    ],
  },
  Temperature: {
    units: [
      { name: 'Celsius', symbol: '°C', toBase: v => v + 273.15, fromBase: v => v - 273.15 },
      { name: 'Fahrenheit', symbol: '°F', toBase: v => (v - 32) * (5 / 9) + 273.15, fromBase: v => (v - 273.15) * (9 / 5) + 32 },
      { name: 'Kelvin', symbol: 'K', toBase: v => v, fromBase: v => v },
    ],
  },
  Speed: {
    units: [
      { name: 'Meters / sec', symbol: 'm/s', toBase: v => v, fromBase: v => v },
      { name: 'Km / hour', symbol: 'km/h', toBase: v => v / 3.6, fromBase: v => v * 3.6 },
      { name: 'Miles / hour', symbol: 'mph', toBase: v => v * 0.44704, fromBase: v => v / 0.44704 },
      { name: 'Knots', symbol: 'kn', toBase: v => v * 0.514444, fromBase: v => v / 0.514444 },
    ],
  },
  Pressure: {
    units: [
      { name: 'Pascal', symbol: 'Pa', toBase: v => v, fromBase: v => v },
      { name: 'Bar', symbol: 'bar', toBase: v => v * 100000, fromBase: v => v / 100000 },
      { name: 'Atmosphere', symbol: 'atm', toBase: v => v * 101325, fromBase: v => v / 101325 },
      { name: 'mmHg (Torr)', symbol: 'mmHg', toBase: v => v * 133.322, fromBase: v => v / 133.322 },
      { name: 'PSI', symbol: 'psi', toBase: v => v * 6894.76, fromBase: v => v / 6894.76 },
    ],
  },
  Energy: {
    units: [
      { name: 'Joules', symbol: 'J', toBase: v => v, fromBase: v => v },
      { name: 'Kilojoules', symbol: 'kJ', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { name: 'Calories', symbol: 'cal', toBase: v => v * 4.184, fromBase: v => v / 4.184 },
      { name: 'Kilocalories', symbol: 'kcal', toBase: v => v * 4184, fromBase: v => v / 4184 },
      { name: 'Electronvolts', symbol: 'eV', toBase: v => v * 1.602176634e-19, fromBase: v => v / 1.602176634e-19 },
      { name: 'Watt-hour', symbol: 'Wh', toBase: v => v * 3600, fromBase: v => v / 3600 },
    ],
  },
};

export const ConvertMode: React.FC<ConvertModeProps> = ({ onInsertToCalc }) => {
  const [activeTab, setActiveTab] = useState<'CONSTANTS' | 'CONVERT'>('CONSTANTS');

  // Converter states
  const [category, setCategory] = useState<UnitCategory>('Length');
  const [fromIndex, setFromIndex] = useState<number>(0);
  const [toIndex, setToIndex] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>('1');

  // Search constant
  const [constSearch, setConstSearch] = useState<string>('');

  const currentCategoryUnits = UNIT_CONVERSIONS[category].units;
  const fromUnit = currentCategoryUnits[fromIndex] || currentCategoryUnits[0];
  const toUnit = currentCategoryUnits[toIndex] || currentCategoryUnits[1];

  const convertedValue = React.useMemo(() => {
    const val = parseFloat(inputValue);
    if (!Number.isFinite(val)) return 0;
    const base = fromUnit.toBase(val);
    return toUnit.fromBase(base);
  }, [inputValue, fromUnit, toUnit]);

  const filteredConstants = React.useMemo(() => {
    if (!constSearch.trim()) return SCIENTIFIC_CONSTANTS;
    const q = constSearch.toLowerCase();
    return SCIENTIFIC_CONSTANTS.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [constSearch]);

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-100 overflow-y-auto select-none p-3 space-y-4">
      {/* Top Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab('CONSTANTS')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'CONSTANTS'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Atom className="w-3.5 h-3.5" />
          <span>Scientific Constants</span>
        </button>
        <button
          onClick={() => setActiveTab('CONVERT')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'CONVERT'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Unit Converter</span>
        </button>
      </div>

      {/* 1. Constants Tab */}
      {activeTab === 'CONSTANTS' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search constants (e.g. Planck, c, gravity, e)..."
            value={constSearch}
            onChange={e => setConstSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />

          <div className="space-y-2">
            {filteredConstants.map(c => (
              <div
                key={c.symbol}
                className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{c.symbol}</span>
                    <span className="text-xs font-medium text-slate-200">{c.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {formatResult(c.value)} <span className="text-slate-500">{c.unit}</span>
                  </div>
                </div>

                {onInsertToCalc && (
                  <button
                    onClick={() => onInsertToCalc(String(c.value))}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    Insert
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Converter Tab */}
      {activeTab === 'CONVERT' && (
        <div className="space-y-4">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(Object.keys(UNIT_CONVERSIONS) as UnitCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setFromIndex(0);
                  setToIndex(1);
                }}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                  category === cat
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Conversion Box */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">From:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-base font-bold text-white"
                />
                <select
                  value={fromIndex}
                  onChange={e => setFromIndex(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white"
                >
                  {currentCategoryUnits.map((u, i) => (
                    <option key={u.symbol} value={i}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  const temp = fromIndex;
                  setFromIndex(toIndex);
                  setToIndex(temp);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 hover:scale-110 transition-transform"
                title="Swap Units"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">To:</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-base font-bold text-emerald-400 flex items-center">
                  {formatResult(convertedValue)}
                </div>
                <select
                  value={toIndex}
                  onChange={e => setToIndex(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white"
                >
                  {currentCategoryUnits.map((u, i) => (
                    <option key={u.symbol} value={i}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {onInsertToCalc && (
              <button
                onClick={() => onInsertToCalc(String(convertedValue))}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono"
              >
                Send Result to Calculator
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
