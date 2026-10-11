import { useState, useMemo } from 'react';
import { FlaskConical, Play, X, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { DoctorPatient, SimParams, VirtualTrialResult } from '@/lib/types';
import { generateGlucoseCurve, computeCGMMetrics, computePeak } from '@/lib/glucoseEngine';
import { getArchetypeByIdSync } from '@/lib/doctorData';

interface VirtualTrialProps {
  patient: DoctorPatient;
  draftParams: SimParams;
  onClose: () => void;
  dark: boolean;
}

export function VirtualTrialModal({ patient, draftParams, onClose, dark }: VirtualTrialProps) {
  const [intervention, setIntervention] = useState<string>('walk30-protein15');

  const arch = getArchetypeByIdSync(patient.archetypeId);

  const interventions: { id: string; label: string; modify: (p: SimParams) => SimParams }[] = [
    { id: 'walk30-protein15', label: '30-min post-dinner walk + 15g protein snack', modify: (p) => ({ ...p, walk_mins: 30, protein_g: Math.max(p.protein_g, 15) }) },
    { id: 'carbs-reduce20', label: 'Reduce carbs by 20g per meal', modify: (p) => ({ ...p, carbs_g: Math.max(0, p.carbs_g - 20) }) },
    { id: 'sleep-8h', label: 'Optimize sleep to 8 hours', modify: (p) => ({ ...p, sleep_hrs: 8 }) },
    { id: 'fat-reduce10', label: 'Reduce dietary fat by 10g', modify: (p) => ({ ...p, fat_g: Math.max(0, p.fat_g - 10) }) },
    { id: 'combined', label: 'Combined: walk 30 + carbs -15 + sleep 8', modify: (p) => ({ ...p, walk_mins: 30, carbs_g: Math.max(0, p.carbs_g - 15), sleep_hrs: 8 }) },
  ];

  const selectedIntervention = interventions.find((i) => i.id === intervention)!;

  const trialResults = useMemo<VirtualTrialResult[]>(() => {
    const modified = selectedIntervention.modify(draftParams);
    const results: VirtualTrialResult[] = [];
    for (let day = 1; day <= 7; day++) {
      // Add slight daily variation
      const dayParams = { ...modified };
      const curve = generateGlucoseCurve(dayParams, arch);
      const cgm = computeCGMMetrics(curve);
      const peak = computePeak(dayParams, arch);
      // Slight improvement over days (adaptation effect)
      const adaptation = 1 + day * 0.005;
      results.push({
        day,
        tir: Math.min(100, Math.round(cgm.tir * adaptation)),
        peak: Math.round(peak / adaptation),
        meanGlucose: Math.round(cgm.meanGlucose / adaptation),
      });
    }
    return results;
  }, [draftParams, selectedIntervention, arch]);

  const baselineCurve = generateGlucoseCurve(draftParams, arch);
  const baselineCGM = computeCGMMetrics(baselineCurve);
  const finalDay = trialResults[trialResults.length - 1];
  const tirDelta = finalDay.tir - baselineCGM.tir;
  const peakDelta = finalDay.peak - computePeak(draftParams, arch);

  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const axisColor = dark ? '#64748b' : '#94a3b8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Virtual Clinical Trial</h2>
              <p className="text-xs text-slate-400">{patient.name} · 7-day projected outcome</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lifestyle Intervention</label>
            <select
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {interventions.map((i) => (
                <option key={i.id} value={i.id}>{i.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 ${tirDelta > 0 ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                {tirDelta > 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-slate-400" />}
                TIR Change (Day 7)
              </div>
              <p className={`text-xl font-bold tabular-nums ${tirDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                {tirDelta > 0 ? '+' : ''}{tirDelta}%
              </p>
            </div>
            <div className={`rounded-xl border p-3 ${peakDelta < 0 ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                {peakDelta < 0 ? <TrendingDown className="h-3 w-3 text-emerald-500" /> : <TrendingUp className="h-3 w-3 text-slate-400" />}
                Peak Change (Day 7)
              </div>
              <p className={`text-xl font-bold tabular-nums ${peakDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                {peakDelta > 0 ? '+' : ''}{peakDelta} mg/dL
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">7-Day TIR Projection</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trialResults} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="day" stroke={axisColor} fontSize={10} tickLine={false} tickFormatter={(v) => `D${v}`} />
                  <YAxis stroke={axisColor} fontSize={10} tickLine={false} domain={[0, 100]} ticks={[0, 50, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: dark ? '#0f172a' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="tir" radius={[4, 4, 0, 0]} name="TIR %">
                    {trialResults.map((entry, i) => (
                      <Cell key={i} fill={entry.tir >= 70 ? '#10b981' : entry.tir >= 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Daily Breakdown</h3>
            <div className="space-y-1.5">
              {trialResults.map((r) => (
                <div key={r.day} className="flex items-center gap-3 text-xs">
                  <span className="w-8 font-semibold text-slate-500 dark:text-slate-400">Day {r.day}</span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${r.tir >= 70 ? 'bg-emerald-500' : r.tir >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${r.tir}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right font-bold tabular-nums text-slate-700 dark:text-slate-200">{r.tir}%</span>
                  <span className="w-16 text-right tabular-nums text-slate-400">{r.peak} mg/dL</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-violet-600 hover:to-purple-700"
          >
            <Play className="h-4 w-4" />
            Close Trial Results
          </button>
        </div>
      </div>
    </div>
  );
}
