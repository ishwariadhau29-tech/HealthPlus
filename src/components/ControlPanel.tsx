import { RotateCcw, CloudUpload, Loader2, Cookie, Footprints, Moon, Beef, Droplet, Clock, Camera } from 'lucide-react';
import { SimParams, DEFAULT_PARAMS, ExerciseTiming } from '@/lib/types';

interface ControlPanelProps {
  params: SimParams;
  onChange: (params: SimParams) => void;
  onSave: () => void;
  saving: boolean;
  isConfigured: boolean;
  onOpenMealVision: () => void;
}

interface SliderConfig {
  key: keyof SimParams;
  label: string;
  icon: typeof Cookie;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'carbs_g', label: 'Carbohydrate Intake', icon: Cookie, min: 0, max: 100, step: 1, unit: 'g' },
  { key: 'protein_g', label: 'Protein', icon: Beef, min: 0, max: 60, step: 1, unit: 'g' },
  { key: 'fat_g', label: 'Dietary Fat', icon: Droplet, min: 0, max: 50, step: 1, unit: 'g' },
  { key: 'walk_mins', label: 'Post-Meal Walk', icon: Footprints, min: 0, max: 60, step: 1, unit: 'min' },
  { key: 'sleep_hrs', label: 'Sleep Duration', icon: Moon, min: 4, max: 10, step: 0.5, unit: 'hrs' },
];

export function ControlPanel({ params, onChange, onSave, saving, isConfigured, onOpenMealVision }: ControlPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Twin Simulation Controls
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(DEFAULT_PARAMS)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            onClick={onOpenMealVision}
            className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-400 dark:hover:bg-teal-950/60"
          >
            <Camera className="h-3.5 w-3.5" />
            Snap / Upload Meal
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {SLIDERS.map((s) => {
          const Icon = s.icon;
          const value = params[s.key] as number;
          const pct = ((value - s.min) / (s.max - s.min)) * 100;
          return (
            <div key={s.key}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{s.label}</label>
                </div>
                <span className="rounded-lg bg-teal-50 px-2.5 py-0.5 text-sm font-bold tabular-nums text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                  {value}{s.unit}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={value}
                onChange={(e) => onChange({ ...params, [s.key]: parseFloat(e.target.value) })}
                className="glucotwin-slider w-full"
                style={{ '--pct': `${pct}%` } as React.CSSProperties}
              />
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>{s.min}{s.unit}</span>
                <span>{s.max}{s.unit}</span>
              </div>
            </div>
          );
        })}

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Exercise Timing</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['before', 'after'] as ExerciseTiming[]).map((t) => (
              <button
                key={t}
                onClick={() => onChange({ ...params, exercise_timing: t })}
                className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                  params.exercise_timing === t
                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-400'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {t === 'before' ? 'Before Meal' : 'After Meal'}
              </button>
            ))}
          </div>
          {params.exercise_timing === 'after' && (
            <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              Post-meal walking is 2.2x more effective via GLUT4 activation
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-500/20 transition-all hover:from-teal-600 hover:to-cyan-700 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
        Save Run to Cloud
      </button>

      {!isConfigured && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Running in demo mode — runs saved locally for this session.
        </p>
      )}
    </div>
  );
}
