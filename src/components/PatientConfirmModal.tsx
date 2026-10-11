import { CheckCircle2, X, Send, HelpCircle } from 'lucide-react';
import { PatientPlanNotification, SimParams } from '@/lib/types';

interface PatientConfirmModalProps {
  notification: PatientPlanNotification | null;
  onAccept: () => void;
  onRequestClarification: () => void;
  onDismiss: () => void;
}

export function PatientConfirmModal({ notification, onAccept, onRequestClarification, onDismiss }: PatientConfirmModalProps) {
  if (!notification) return null;

  const p = notification.params;

  const paramRows: { label: string; value: string }[] = [
    { label: 'Carbohydrates', value: `${p.carbs_g}g` },
    { label: 'Protein', value: `${p.protein_g}g` },
    { label: 'Dietary Fat', value: `${p.fat_g}g` },
    { label: 'Post-Meal Walk', value: `${p.walk_mins} min` },
    { label: 'Sleep Target', value: `${p.sleep_hrs} hrs` },
    { label: 'Exercise Timing', value: p.exercise_timing === 'after' ? 'After Meal' : 'Before Meal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">New Plan from Your Clinician</h2>
          </div>
          <button onClick={onDismiss} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">From: Dr. Clinician</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{notification.note}</p>
          </div>

          {notification.prescription && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-violet-950/30">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">Prescription Details</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Carb ratio: {notification.prescription.carbRatio.toFixed(1)}x · Alerts: {notification.prescription.lowAlertMgDl}-{notification.prescription.highAlertMgDl} mg/dL · Activity: {notification.prescription.activityWindow}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Proposed Parameters</p>
            <div className="grid grid-cols-2 gap-2">
              {paramRows.map((r) => (
                <div key={r.label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{r.label}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-teal-600 hover:to-cyan-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept &amp; Apply
            </button>
            <button
              onClick={onRequestClarification}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <HelpCircle className="h-4 w-4" />
              Request Clarification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
