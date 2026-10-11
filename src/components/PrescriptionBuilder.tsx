import { useState } from 'react';
import { Pill, Settings2, Bell, Activity, Save } from 'lucide-react';
import { DoctorPatient, Prescription } from '@/lib/types';

interface PrescriptionBuilderProps {
  patient: DoctorPatient;
  onSave: (rx: Omit<Prescription, 'id' | 'createdAt'>) => void;
}

export function PrescriptionBuilder({ patient, onSave }: PrescriptionBuilderProps) {
  const [carbRatio, setCarbRatio] = useState(1.0);
  const [proteinRatio, setProteinRatio] = useState(0.4);
  const [activityWindow, setActivityWindow] = useState('post-dinner');
  const [lowAlert, setLowAlert] = useState(70);
  const [highAlert, setHighAlert] = useState(180);
  const [rationale, setRationale] = useState('');

  const handleSave = () => {
    onSave({
      patientId: patient.id,
      carbRatio,
      proteinRatio,
      activityWindow,
      lowAlertMgDl: lowAlert,
      highAlertMgDl: highAlert,
      rationale: rationale || `Adjusted carb ratio ${carbRatio}x, protein ${proteinRatio}x, alerts at ${lowAlert}-${highAlert} mg/dL`,
    });
    setRationale('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <Pill className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Structured Prescription Builder
        </h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Settings2 className="h-3 w-3" /> Carb Ratio Multiplier
            </label>
            <div className="flex items-center gap-2">
              <input type="range" min="0.5" max="2" step="0.1" value={carbRatio}
                onChange={(e) => setCarbRatio(parseFloat(e.target.value))}
                className="glucotwin-slider w-full"
                style={{ '--pct': `${((carbRatio - 0.5) / 1.5) * 100}%` } as React.CSSProperties}
              />
              <span className="w-10 text-right text-xs font-bold tabular-nums text-teal-700 dark:text-teal-400">{carbRatio.toFixed(1)}x</span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Settings2 className="h-3 w-3" /> Protein Ratio Multiplier
            </label>
            <div className="flex items-center gap-2">
              <input type="range" min="0.2" max="1.5" step="0.1" value={proteinRatio}
                onChange={(e) => setProteinRatio(parseFloat(e.target.value))}
                className="glucotwin-slider w-full"
                style={{ '--pct': `${((proteinRatio - 0.2) / 1.3) * 100}%` } as React.CSSProperties}
              />
              <span className="w-10 text-right text-xs font-bold tabular-nums text-teal-700 dark:text-teal-400">{proteinRatio.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Activity className="h-3 w-3" /> Recommended Activity Window
          </label>
          <select
            value={activityWindow}
            onChange={(e) => setActivityWindow(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="post-breakfast">Post-Breakfast</option>
            <option value="post-lunch">Post-Lunch</option>
            <option value="post-dinner">Post-Dinner</option>
            <option value="pre-meal">Pre-Meal (All)</option>
            <option value="evening">Evening Only</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Bell className="h-3 w-3 text-red-500" /> Low Alert Threshold
            </label>
            <div className="flex items-center gap-2">
              <input type="range" min="55" max="90" step="1" value={lowAlert}
                onChange={(e) => setLowAlert(parseInt(e.target.value))}
                className="glucotwin-slider w-full"
                style={{ '--pct': `${((lowAlert - 55) / 35) * 100}%` } as React.CSSProperties}
              />
              <span className="w-12 text-right text-xs font-bold tabular-nums text-red-600 dark:text-red-400">{lowAlert} mg/dL</span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Bell className="h-3 w-3 text-amber-500" /> High Alert Threshold
            </label>
            <div className="flex items-center gap-2">
              <input type="range" min="140" max="250" step="5" value={highAlert}
                onChange={(e) => setHighAlert(parseInt(e.target.value))}
                className="glucotwin-slider w-full"
                style={{ '--pct': `${((highAlert - 140) / 110) * 100}%` } as React.CSSProperties}
              />
              <span className="w-12 text-right text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">{highAlert} mg/dL</span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Prescription Rationale</label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Clinical rationale for this prescription (visible to patient)..."
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400 dark:hover:bg-violet-950/60"
        >
          <Save className="h-4 w-4" />
          Save Prescription
        </button>
      </div>
    </div>
  );
}
