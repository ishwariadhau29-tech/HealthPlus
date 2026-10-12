import { useState } from 'react';
import { User, Ruler, Weight, Droplet, Gauge, Pencil, Save, X, Loader2, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Profile, Archetype } from '@/lib/types';
import { getCalibrationFidelity } from '@/lib/glucoseEngine';

interface ProfileBannerProps {
  archetype?: Archetype;
  onOpenCalibration?: () => void;
}

export function ProfileBanner({ archetype, onOpenCalibration }: ProfileBannerProps) {
  const { profile, updateProfile, isDemo, isConfigured } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Profile | null>(null);

  if (!profile) return null;

  const startEdit = () => {
    setDraft({ ...profile });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    await updateProfile({
      full_name: draft.full_name,
      age: draft.age,
      weight_kg: draft.weight_kg,
      baseline_hba1c: draft.baseline_hba1c,
      fasting_glucose: draft.fasting_glucose,
    });
    setSaving(false);
    setEditing(false);
    setDraft(null);
  };

  const metrics = [
    { icon: User, label: 'Patient', value: profile.full_name, key: 'full_name', isText: true },
    { icon: User, label: 'Age', value: `${profile.age} yrs`, key: 'age', isText: false },
    { icon: Weight, label: 'Weight', value: `${profile.weight_kg} kg`, key: 'weight_kg', isText: false },
    { icon: Gauge, label: 'HbA1c', value: `${profile.baseline_hba1c}%`, key: 'baseline_hba1c', isText: false },
    { icon: Droplet, label: 'Fasting Glucose', value: `${profile.fasting_glucose} mg/dL`, key: 'fasting_glucose', isText: false },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Patient Profile
          </h3>
          {isDemo && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-400">
              Demo
            </span>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.key}
              className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </div>
              {editing && draft ? (
                <input
                  type={m.isText ? 'text' : 'number'}
                  step={m.isText ? undefined : '0.1'}
                  value={
                    m.isText
                      ? (draft[m.key as keyof Profile] as string) ?? ''
                      : String(draft[m.key as keyof Profile] ?? '')
                  }
                  onChange={(e) => {
                    const val = m.isText ? e.target.value : parseFloat(e.target.value);
                    setDraft({ ...draft, [m.key]: val });
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              ) : (
                <span className="text-sm font-bold text-slate-900 dark:text-white">{m.value}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Twin Calibration badge */}
      {archetype && onOpenCalibration && (
        <button
          onClick={onOpenCalibration}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
        >
          <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Twin Calibration: Adaptive</span>
            <span className="ml-2 text-xs text-emerald-600/70 dark:text-emerald-400/70">{getCalibrationFidelity(archetype)}% Fidelity</span>
          </div>
          <span className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">View drift curve →</span>
        </button>
      )}

      {!isConfigured && !isDemo && (
        <p className="mt-3 text-xs text-slate-400">
          Cloud sync unavailable — connect Supabase to persist profile across sessions.
        </p>
      )}
    </div>
  );
}
