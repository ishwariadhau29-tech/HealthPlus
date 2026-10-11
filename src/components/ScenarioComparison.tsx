import { GitCompare, Pin, X, ArrowRight } from 'lucide-react';

interface ScenarioComparisonProps {
  compareMode: boolean;
  onToggleCompare: () => void;
  scenarioA: { peak: number; tir: number } | null;
  scenarioB: { peak: number; tir: number };
  onPinA: () => void;
  onClearA: () => void;
}

export function ScenarioComparison({
  compareMode,
  onToggleCompare,
  scenarioA,
  scenarioB,
  onPinA,
  onClearA,
}: ScenarioComparisonProps) {
  const peakDelta = scenarioA ? scenarioB.peak - scenarioA.peak : 0;
  const tirDelta = scenarioA ? scenarioB.tir - scenarioA.tir : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            What-If Comparison
          </h3>
        </div>
        <button
          onClick={onToggleCompare}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            compareMode ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              compareMode ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {compareMode ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {scenarioA ? (
              <>
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/40">
                  <Pin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <div className="text-xs">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">Scenario A</span>
                    <span className="ml-2 tabular-nums text-slate-600 dark:text-slate-300">
                      Peak {scenarioA.peak} · TIR {scenarioA.tir}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClearA}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={onPinA}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-teal-400 hover:text-teal-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-teal-500"
              >
                <Pin className="h-3.5 w-3.5" />
                Pin Current Run as Scenario A
              </button>
            )}
          </div>

          {scenarioA && (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 dark:border-teal-800 dark:bg-teal-950/40">
                <ArrowRight className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <div className="text-xs">
                  <span className="font-semibold text-teal-700 dark:text-teal-400">Scenario B (Live)</span>
                  <span className="ml-2 tabular-nums text-slate-600 dark:text-slate-300">
                    Peak {scenarioB.peak} · TIR {scenarioB.tir}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Delta Impact:</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                    peakDelta < 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : peakDelta > 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {peakDelta > 0 ? '+' : ''}{peakDelta} mg/dL peak
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                    tirDelta > 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : tirDelta < 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tirDelta > 0 ? '+' : ''}{tirDelta}% TIR
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Enable comparison mode to pin the current run as Scenario A, then adjust sliders to see how Scenario B changes peak glucose and time-in-range.
        </p>
      )}
    </div>
  );
}
