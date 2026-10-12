import { X, TrendingUp, Activity } from 'lucide-react';
import { Archetype, CalibrationPoint } from '@/lib/types';
import { computeCalibrationCurve, getCalibrationFidelity } from '@/lib/glucoseEngine';

interface CalibrationModalProps {
  open: boolean;
  onClose: () => void;
  archetype: Archetype;
}

export function CalibrationModal({ open, onClose, archetype }: CalibrationModalProps) {
  if (!open) return null;

  const points = computeCalibrationCurve(archetype);
  const fidelity = getCalibrationFidelity(archetype);
  const isfValues = points.map(p => p.isf);
  const icrValues = points.map(p => p.icr);
  const isfMin = Math.min(...isfValues);
  const isfMax = Math.max(...isfValues);
  const icrMin = Math.min(...icrValues);
  const icrMax = Math.max(...icrValues);

  const isfRange = isfMax - isfMin || 1;
  const icrRange = icrMax - icrMin || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Twin Calibration: Adaptive Drift</h2>
              <p className="text-xs text-slate-400">14-day ISF & ICR adaptation from CGM data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fidelity badge */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{fidelity}% Prediction Fidelity</span>
          <span className="ml-auto text-xs text-slate-400">Updated continuously from CGM loop closure</span>
        </div>

        {/* ISF drift chart */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Insulin Sensitivity Factor (ISF)</h3>
            <span className="text-xs text-slate-400">mg/dL per unit insulin</span>
          </div>
          <div className="flex h-24 items-end gap-1 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
            {points.map(p => {
              const heightPct = ((p.isf - isfMin) / isfRange) * 80 + 20;
              return (
                <div key={p.day} className="flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-teal-600 to-teal-400 transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  {p.day % 2 === 1 && <span className="mt-0.5 text-[8px] text-slate-400">{p.day}</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>Day 1</span><span>Day 14</span>
          </div>
        </div>

        {/* ICR drift chart */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Insulin-to-Carb Ratio (ICR)</h3>
            <span className="text-xs text-slate-400">g carbs per unit insulin</span>
          </div>
          <div className="flex h-24 items-end gap-1 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
            {points.map(p => {
              const heightPct = ((p.icr - icrMin) / icrRange) * 80 + 20;
              return (
                <div key={p.day} className="flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  {p.day % 2 === 1 && <span className="mt-0.5 text-[8px] text-slate-400">{p.day}</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>Day 1</span><span>Day 14</span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          The digital twin continuously adapts ISF and ICR parameters based on actual CGM loop-closure data, meal logs, and insulin delivery over a rolling 14-day window. This adaptive calibration ensures the in silico model tracks the patient's evolving metabolic state.
        </p>
      </div>
    </div>
  );
}
