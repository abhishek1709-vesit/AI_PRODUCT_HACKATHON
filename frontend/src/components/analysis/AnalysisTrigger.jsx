import React from 'react';
import { Play, SlidersHorizontal } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Slider from '../ui/Slider.jsx';

const PRESETS = {
  'Balanced':       { requirements: 50, cost: 30, risk: 20 },
  'Quality First':  { requirements: 70, cost: 15, risk: 15 },
  'Cost Optimized': { requirements: 20, cost: 60, risk: 20 },
  'Risk Averse':    { requirements: 30, cost: 20, risk: 50 },
};

export default function AnalysisTrigger({
  priorities,
  onPriorityChange,
  onScenarioChange,
  selectedScenario,
  onRunAnalysis,
  graphLoading,
}) {
  const total = priorities.requirements + priorities.cost + priorities.risk;
  const isValid = total === 100;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-indigo-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Procurement Priorities</p>
              <p className="text-xs text-slate-500">Set weights before running analysis</p>
            </div>
          </div>
          <span className={`text-xs font-semibold tabular-nums px-2 py-1 rounded-md ${
            isValid ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {total}% {isValid ? '✓' : '— must equal 100%'}
          </span>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(PRESETS).map(name => (
            <button
              key={name}
              onClick={() => onScenarioChange(name)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-all border ${
                selectedScenario === name
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
              }`}
              aria-pressed={selectedScenario === name}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Slider
            id="req-slider"
            label="Requirements"
            value={priorities.requirements}
            onChange={v => onPriorityChange('requirements', v)}
            color="indigo"
          />
          <Slider
            id="cost-slider"
            label="Cost / TCO"
            value={priorities.cost}
            onChange={v => onPriorityChange('cost', v)}
            color="emerald"
          />
          <Slider
            id="risk-slider"
            label="Risk"
            value={priorities.risk}
            onChange={v => onPriorityChange('risk', v)}
            color="amber"
          />
        </div>

        <div className="pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={onRunAnalysis}
            disabled={graphLoading || !isValid}
            loading={graphLoading}
            icon={!graphLoading ? <Play size={14} /> : undefined}
            className="w-full sm:w-auto"
          >
            {graphLoading ? 'Running Analysis...' : 'Run Full Procurement Analysis'}
          </Button>
          {!isValid && (
            <p className="text-xs text-red-500 mt-1.5">Adjust sliders so total equals 100%</p>
          )}
        </div>
      </div>
    </Card>
  );
}
