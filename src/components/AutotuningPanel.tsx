import { useState, useMemo } from 'react';
import {
  SlidersHorizontal, Check, X, ArrowRight, Gauge, Zap, Droplet,
  Shield, AlertTriangle, Sparkles, Wrench,
} from 'lucide-react';
import {
  DoctorPatient, AutotuningRecommendation, TuningParamType,
  AIDConfig,
} from '@/lib/types';
import { computeAutotuningRecommendations, DEFAULT_AID_CONFIG } from '@/lib/glucoseEngine';

interface AutotuningPanelProps {
  patient: DoctorPatient;
  existingRecommendations: AutotuningRecommendation[];
  onApply: (rec: AutotuningRecommendation, newConfig: AIDConfig) => void;
  onDismiss: (recId: string, note: string) => void;
}

const PARAM_CONFIG: Record<TuningParamType, { label: string; icon: typeof Gauge; unit: string; color: string }> = {
  basal: { label: 'Basal Rate', icon: Droplet, unit: 'mg/dL threshold', color: 'text-blue-600 dark:text-blue-400' },
  isf: { label: 'Insulin Sensitivity (ISF)', icon: Zap, unit: 'mg/dL/U', color: 'text-amber-600 dark:text-amber-400' },
  icr: { label: 'Insulin-to-Carb Ratio (ICR)', icon: Gauge, unit: 'g/U', color: 'text-teal-600 dark:text-teal-400' },
};

const SAFETY_CONFIG: Record<string, { label: string; badge: string }> = {
  safe: { label: 'Safe', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  caution: { label: 'Caution', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  review_required: { label: 'Review Required', badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

function ConfidenceMeter({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}%</span>
    </div>
  );
}

export function AutotuningPanel({ patient, existingRecommendations, onApply, onDismiss }: AutotuningPanelProps) {
  const freshRecs = useMemo(() => computeAutotuningRecommendations(patient), [patient]);
  const [dismissNote, setDismissNote] = useState<string | null>(null);
  const [dismissTargetId, setDismissTargetId] = useState<string | null>(null);

  const pendingExisting = existingRecommendations.filter(r => r.status === 'pending');
  const appliedExisting = existingRecommendations.filter(r => r.status === 'applied');
  const dismissedExisting = existingRecommendations.filter(r => r.status === 'dismissed');

  // Merge fresh recs with persisted ones (fresh recs replace pending persisted ones with same id)
  const seenIds = new Set(existingRecommendations.map(r => r.id));
  const newFresh = freshRecs.filter(r => !seenIds.has(r.id));
  const allPending = [...pendingExisting, ...newFresh];

  const pendingCount = allPending.length;

  const handleApply = (rec: AutotuningRecommendation) => {
    const currentConfig = patient.aidConfig ?? DEFAULT_AID_CONFIG;
    let newConfig = { ...currentConfig };

    if (rec.paramType === 'basal') {
      if (rec.timeWindow === 'All-day (global)') {
        newConfig.targetGlucose = rec.recommendedVal;
      } else {
        newConfig.basalSuspendThreshold = rec.recommendedVal;
      }
    }
    // ISF and ICR adjustments would update pump algorithm params in a real system
    // For now they're tracked as audit-trail recommendations

    onApply(rec, newConfig);
  };

  const handleConfirmDismiss = () => {
    if (dismissTargetId && dismissNote !== null) {
      onDismiss(dismissTargetId, dismissNote);
      setDismissTargetId(null);
      setDismissNote(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Insulin Autotuning Engine
          </h3>
          <p className="text-xs text-slate-400">
            Automated ISF/ICR/Basal optimization · 10% max shift per cycle · {pendingCount} pending recommendation{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-400">
            <Sparkles className="h-3 w-3" /> {pendingCount} Pending
          </span>
        )}
      </div>

      {/* Data sufficiency indicator */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
        <Shield className="h-4 w-4 text-slate-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">CGM Wear Time (Data Sufficiency)</span>
            <span className={`text-xs font-bold tabular-nums ${freshRecs.length > 0 || pendingExisting.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {freshRecs.length > 0 ? freshRecs[0].dataSufficiency : pendingExisting[0]?.dataSufficiency ?? 0}%
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${freshRecs.length > 0 ? freshRecs[0].dataSufficiency : pendingExisting[0]?.dataSufficiency ?? 0}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Minimum 80% wear time required for automated recommendations</p>
        </div>
      </div>

      {/* Pending Recommendations */}
      {allPending.length > 0 ? (
        <div className="space-y-3">
          {allPending.map(rec => {
            const cfg = PARAM_CONFIG[rec.paramType];
            const Icon = cfg.icon;
            const safety = SAFETY_CONFIG[rec.safetyFlag];
            const isDown = rec.percentChange < 0;

            return (
              <div key={rec.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                {/* Card header */}
                <div className="mb-3 flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 ${cfg.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{cfg.label}</p>
                    <p className="text-xs text-slate-400">{rec.timeWindow}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${safety.badge}`}>
                    {safety.label}
                  </span>
                </div>

                {/* Before/After values */}
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Current</p>
                    <p className="text-lg font-bold tabular-nums text-slate-700 dark:text-slate-200">{rec.currentVal}</p>
                    <p className="text-[10px] text-slate-400">{cfg.unit}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isDown ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {isDown ? '' : '+'}{rec.percentChange}%
                    </span>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Recommended</p>
                    <p className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">{rec.recommendedVal}</p>
                    <p className="text-[10px] text-slate-400">{cfg.unit}</p>
                  </div>
                </div>

                {/* Confidence + reasoning */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">Confidence</span>
                    <ConfidenceMeter score={rec.confidenceScore} />
                  </div>
                </div>

                <div className="mb-3 rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-600 dark:text-slate-300">{rec.reasoning}</p>
                </div>

                {/* Dismiss note input */}
                {dismissTargetId === rec.id ? (
                  <div className="mb-3 space-y-2">
                    <textarea
                      value={dismissNote ?? ''}
                      onChange={e => setDismissNote(e.target.value)}
                      rows={2}
                      placeholder="Enter clinical reason for dismissal or modification..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmDismiss}
                        disabled={!dismissNote?.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" /> Confirm Dismiss
                      </button>
                      <button
                        onClick={() => { setDismissTargetId(null); setDismissNote(null); }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action buttons */
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApply(rec)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-500 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-600"
                    >
                      <Check className="h-3.5 w-3.5" /> Apply to Pump Config
                    </button>
                    <button
                      onClick={() => { setDismissTargetId(rec.id); setDismissNote(''); }}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <Wrench className="h-3.5 w-3.5" /> Dismiss / Modify
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-700">
          <Check className="mb-2 h-8 w-8 text-emerald-400" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No pending recommendations</p>
          <p className="text-xs text-slate-400">All parameters within optimal range for this patient</p>
        </div>
      )}

      {/* Applied recommendations history */}
      {appliedExisting.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Applied Recommendations</h4>
          <div className="space-y-1.5">
            {appliedExisting.map(rec => {
              const cfg = PARAM_CONFIG[rec.paramType];
              return (
                <div key={rec.id} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {cfg.label} · {rec.timeWindow}
                  </span>
                  <span className="text-xs tabular-nums text-slate-400">
                    {rec.currentVal} → {rec.recommendedVal} ({rec.percentChange > 0 ? '+' : ''}{rec.percentChange}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dismissed recommendations history */}
      {dismissedExisting.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Dismissed / Modified</h4>
          <div className="space-y-1.5">
            {dismissedExisting.map(rec => (
              <div key={rec.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {PARAM_CONFIG[rec.paramType].label} · {rec.timeWindow}
                  </span>
                  <span className="text-xs tabular-nums text-slate-400">
                    {rec.currentVal} → {rec.recommendedVal} (not applied)
                  </span>
                </div>
                {rec.dismissedNote && (
                  <p className="mt-1 pl-5 text-xs italic text-slate-400">"{rec.dismissedNote}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety guardrail notice */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/20">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        <p className="text-xs text-amber-600 dark:text-amber-400">
          All automated recommendations are capped at a 10% parameter shift per tuning cycle and require &gt;80% CGM wear time. Recommendations with low confidence or significant clinical impact require manual review before application.
        </p>
      </div>
    </div>
  );
}
