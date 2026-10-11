import { useMemo } from 'react';
import { X, Activity, AlertTriangle, AlertOctagon, Info, Watch, Heart, Brain } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from 'recharts';
import { DoctorPatient, AnomalyDetection, WearableMetrics } from '@/lib/types';
import { generateGlucoseCurve, computeCGMMetrics, computeEarlyWarning, getWearableImpact } from '@/lib/glucoseEngine';
import { getArchetypeByIdSync } from '@/lib/doctorData';
import { EarlyWarningIndicator, PreventiveInterventionDrawer } from '@/components/EarlyWarningIndicator';

interface AGPModalProps {
  patient: DoctorPatient | null;
  anomalies: AnomalyDetection[];
  onClose: () => void;
  dark: boolean;
}

export function AGPModal({ patient, anomalies, onClose, dark }: AGPModalProps) {
  const curve = useMemo(() => {
    if (!patient) return [];
    const arch = getArchetypeByIdSync(patient.archetypeId);
    return generateGlucoseCurve(patient.params, arch);
  }, [patient]);

  const metrics = useMemo(() => computeCGMMetrics(curve), [curve]);

  const patientAnomalies = anomalies.filter((a) => a.patientId === patient?.id);

  // Generate percentile bands by adding variation around the curve
  const agpData = useMemo(() => {
    return curve.map((p, i) => {
      const base = p.simulated;
      const variance = metrics.sd > 0 ? metrics.sd : 15;
      return {
        hour: p.hour,
        median: base,
        p10: Math.round(Math.max(50, base - variance * 1.28)),
        p25: Math.round(Math.max(50, base - variance * 0.67)),
        p75: Math.round(base + variance * 0.67),
        p90: Math.round(base + variance * 1.28),
      };
    });
  }, [curve, metrics.sd]);

  if (!patient) return null;

  const arch = getArchetypeByIdSync(patient.archetypeId);
  const earlyWarning = computeEarlyWarning(patient, arch);
  const wearable = patient.wearable;
  const wearableImpact = wearable ? getWearableImpact(wearable) : null;

  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const axisColor = dark ? '#64748b' : '#94a3b8';
  const tooltipBg = dark ? '#0f172a' : '#ffffff';
  const tooltipBorder = dark ? '#334155' : '#e2e8f0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ambulatory Glucose Profile</h2>
              <p className="text-xs text-slate-400">{patient.name} · {patient.diabetesType}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Anomaly badges */}
          {patientAnomalies.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Anomaly Detection</h3>
              {patientAnomalies.map((a) => {
                const Icon = a.severity === 'critical' ? AlertOctagon : AlertTriangle;
                const colors = a.severity === 'critical'
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40';
                const textColor = a.severity === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400';
                return (
                  <div key={a.id} className={`flex items-start gap-2.5 rounded-xl border p-3 ${colors}`}>
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${textColor}`} />
                    <div>
                      <p className={`text-sm font-semibold ${textColor}`}>{a.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{a.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Early Warning */}
          <EarlyWarningIndicator prediction={earlyWarning} />

          {/* Wearable Metrics */}
          {wearable && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <Watch className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Wearable Metrics — {wearable.source}</h3>
                {wearableImpact && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    wearableImpact.label === 'High insulin resistance'
                      ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                      : wearableImpact.label === 'Mild resistance'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  }`}>{wearableImpact.label}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <WearableCard icon={Brain} label="Sleep Score" value={wearable.sleepScore} suffix="/100" warn={wearable.sleepScore < 60} />
                <WearableCard icon={Heart} label="Resting HR" value={wearable.restingHr} suffix=" bpm" warn={wearable.restingHr > 75} />
                <WearableCard icon={Activity} label="Stress Score" value={wearable.stressScore} suffix="/100" warn={wearable.stressScore > 70} />
              </div>
              {wearableImpact && wearableImpact.resistanceMultiplier > 1.0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Poor sleep and/or elevated stress detected. Glucose engine applied {(wearableImpact.resistanceMultiplier - 1) * 100 | 0}% insulin resistance multiplier to CGM curve.
                </p>
              )}
            </div>
          )}

          {/* Preventive Intervention Drawer */}
          <PreventiveInterventionDrawer prediction={earlyWarning} />

          {/* AGP Chart */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">AGP — 24h Median with Percentile Bands</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={agpData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <ReferenceArea y1={70} y2={140} fill="#10b981" fillOpacity={dark ? 0.06 : 0.05} />
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="hour" stroke={axisColor} fontSize={10} tickLine={false} interval={2} />
                  <YAxis stroke={axisColor} fontSize={10} tickLine={false} domain={[50, 250]} ticks={[50, 100, 140, 180, 250]} />
                  <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="p10" stroke="none" fill="#94a3b8" fillOpacity={0.08} name="10-90th" />
                  <Area type="monotone" dataKey="p90" stroke="none" fill="#94a3b8" fillOpacity={0.08} />
                  <Area type="monotone" dataKey="p25" stroke="none" fill="#3b82f6" fillOpacity={0.12} name="25-75th" />
                  <Area type="monotone" dataKey="p75" stroke="none" fill="#3b82f6" fillOpacity={0.12} />
                  <Line type="monotone" dataKey="median" stroke="#1e40af" strokeWidth={2.5} dot={false} name="Median" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-blue-800/30" />25-75th percentile</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-slate-400/20" />10-90th percentile</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-blue-800" />Median</span>
            </div>
          </div>

          {/* Variability breakdown */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="GMI / eA1c" value={`${metrics.ea1c}%`} sub="Est. HbA1c" />
            <MetricCard label="CV%" value={`${metrics.cv}%`} sub={metrics.cv < 36 ? 'Stable' : 'Unstable'} positive={metrics.cv < 36} />
            <MetricCard label="SD" value={`${metrics.sd}`} sub="mg/dL" />
            <MetricCard label="Mean" value={`${metrics.meanGlucose}`} sub="mg/dL" />
          </div>

          {/* TIR breakdown */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Time-in-Range Distribution</h3>
            <div className="flex h-6 overflow-hidden rounded-lg">
              <div className="bg-emerald-500" style={{ width: `${metrics.tir}%` }} />
              <div className="bg-amber-500" style={{ width: `${metrics.highPct}%` }} />
              <div className="bg-red-500" style={{ width: `${metrics.lowPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400">In Target: {metrics.tir}%</span>
              <span className="text-amber-600 dark:text-amber-400">High: {metrics.highPct}%</span>
              <span className="text-red-600 dark:text-red-400">Low: {metrics.lowPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${positive === true ? 'text-emerald-600 dark:text-emerald-400' : positive === false ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function WearableCard({ icon: Icon, label, value, suffix, warn }: { icon: typeof Heart; label: string; value: number; suffix: string; warn: boolean }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-center dark:border-slate-800 dark:bg-slate-800/50">
      <div className="mb-1 flex items-center justify-center gap-1 text-xs text-slate-400"><Icon className="h-3 w-3" />{label}</div>
      <p className={`text-lg font-bold tabular-nums ${warn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{value}{suffix}</p>
    </div>
  );
}
