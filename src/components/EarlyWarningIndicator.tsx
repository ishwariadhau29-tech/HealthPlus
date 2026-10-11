import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EarlyWarningPrediction, EarlyWarningLevel } from '@/lib/types';

const LEVEL_CONFIG: Record<EarlyWarningLevel, { label: string; color: string; bg: string; border: string; pulse: boolean }> = {
  low: { label: 'Low Risk', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', pulse: false },
  moderate: { label: 'Moderate Risk', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', pulse: false },
  high: { label: 'Pre-Crisis', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', pulse: true },
  critical: { label: 'Pre-Crisis Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', pulse: true },
};

export function EarlyWarningIndicator({ prediction, compact }: { prediction: EarlyWarningPrediction; compact?: boolean }) {
  const cfg = LEVEL_CONFIG[prediction.level];
  const TrendIcon = prediction.trend === 'rising' ? TrendingUp : prediction.trend === 'falling' ? TrendingDown : Minus;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.border} ${cfg.color} ${cfg.pulse ? 'pre-crisis-indicator' : ''}`}>
        <Zap className="h-2.5 w-2.5" />
        {cfg.label}
      </span>
    );
  }

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4 ${cfg.pulse ? 'pre-crisis-indicator' : ''}`}>
      <div className="mb-3 flex items-center gap-2">
        <Zap className={`h-4 w-4 ${cfg.color}`} />
        <h3 className={`text-sm font-bold uppercase tracking-wide ${cfg.color}`}>AI Early Warning — 4h Forecast</h3>
        <span className={`ml-auto inline-flex items-center gap-1 text-xs font-bold ${cfg.color}`}>
          <TrendIcon className="h-3 w-3" /> {prediction.trend}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-100 bg-white/80 p-2.5 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs text-slate-400">Hypo Risk</p>
          <p className={`text-lg font-bold tabular-nums ${prediction.hypoRisk > 50 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{prediction.hypoRisk}%</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white/80 p-2.5 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs text-slate-400">Hyper Risk</p>
          <p className={`text-lg font-bold tabular-nums ${prediction.hyperRisk > 50 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{prediction.hyperRisk}%</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white/80 p-2.5 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs text-slate-400">Projected</p>
          <p className="text-lg font-bold tabular-nums text-slate-700 dark:text-slate-200">{prediction.projectedGlucose}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white/80 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
          <span className="text-slate-400">Velocity</span>
          <span className={`font-bold tabular-nums ${prediction.velocity > 0 ? 'text-orange-600 dark:text-orange-400' : prediction.velocity < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{prediction.velocity > 0 ? '+' : ''}{prediction.velocity} mg/dL/h</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white/80 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
          <span className="text-slate-400">Acceleration</span>
          <span className={`font-bold tabular-nums ${prediction.acceleration > 0 ? 'text-orange-600 dark:text-orange-400' : prediction.acceleration < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{prediction.acceleration > 0 ? '+' : ''}{prediction.acceleration}</span>
        </div>
      </div>
    </div>
  );
}

export function PreventiveInterventionDrawer({ prediction }: { prediction: EarlyWarningPrediction }) {
  if (prediction.level === 'low') return null;

  const colors = prediction.level === 'critical'
    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
    : prediction.level === 'high'
      ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30'
      : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30';

  const textColor = prediction.level === 'critical'
    ? 'text-red-700 dark:text-red-400'
    : prediction.level === 'high'
      ? 'text-orange-700 dark:text-orange-400'
      : 'text-amber-700 dark:text-amber-400';

  return (
    <div className={`rounded-xl border p-4 ${colors}`}>
      <div className="mb-2 flex items-center gap-2">
        <Zap className={`h-4 w-4 ${textColor}`} />
        <h4 className={`text-sm font-bold ${textColor}`}>Preventive Intervention Recommendation</h4>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{prediction.recommendation}</p>
    </div>
  );
}
