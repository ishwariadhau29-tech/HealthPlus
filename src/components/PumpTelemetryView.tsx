import { useMemo, useState } from 'react';
import { Radio, Droplet, Zap, Pause, Settings2, Save, Activity } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { DoctorPatient, AIDConfig, PumpTelemetryPoint } from '@/lib/types';
import { simulatePumpTelemetry, DEFAULT_AID_CONFIG } from '@/lib/glucoseEngine';

interface PumpTelemetryViewProps {
  patient: DoctorPatient;
  config: AIDConfig;
  onSaveConfig: (config: AIDConfig) => void;
  dark: boolean;
}

export function PumpTelemetryView({ patient, config, onSaveConfig, dark }: PumpTelemetryViewProps) {
  const [localConfig, setLocalConfig] = useState<AIDConfig>(config);
  const [showSettings, setShowSettings] = useState(false);

  const telemetry = useMemo<PumpTelemetryPoint[]>(() => simulatePumpTelemetry(patient, localConfig), [patient, localConfig]);

  const suspensions = telemetry.filter(t => t.status === 'basal_suspended').length;
  const corrections = telemetry.filter(t => t.status === 'auto_correction').length;
  const predictiveLows = telemetry.filter(t => t.status === 'predictive_low').length;
  const maxIob = Math.max(...telemetry.map(t => t.iob));

  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const axisColor = dark ? '#64748b' : '#94a3b8';

  const statusColor = (status: PumpTelemetryPoint['status']) => {
    switch (status) {
      case 'basal_suspended': return 'text-red-600 dark:text-red-400';
      case 'auto_correction': return 'text-amber-600 dark:text-amber-400';
      case 'predictive_low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-slate-500 dark:text-slate-400';
    }
  };

  const statusLabel = (status: PumpTelemetryPoint['status']) => {
    switch (status) {
      case 'basal_suspended': return 'Basal Suspended';
      case 'auto_correction': return 'Auto Correction';
      case 'predictive_low': return 'Predictive Low Suspend';
      default: return 'Normal';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
          <Radio className="h-4 w-4 pump-live-dot" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">AID Pump Telemetry — Live Simulation</h3>
          <p className="text-xs text-slate-400">Closed-loop algorithm status for {patient.name}</p>
        </div>
        <button onClick={() => setShowSettings(v => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <Settings2 className="h-3 w-3" /> Algorithm Config
        </button>
      </div>

      {/* Status summary */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/30">
          <Pause className="mb-1 h-3.5 w-3.5 text-red-500" />
          <span className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">{suspensions}</span>
          <span className="text-[10px] text-slate-400">Basal Suspends</span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30">
          <Zap className="mb-1 h-3.5 w-3.5 text-amber-500" />
          <span className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">{corrections}</span>
          <span className="text-[10px] text-slate-400">Auto Boluses</span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950/30">
          <Activity className="mb-1 h-3.5 w-3.5 text-blue-500" />
          <span className="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">{predictiveLows}</span>
          <span className="text-[10px] text-slate-400">Predictive Lows</span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
          <Droplet className="mb-1 h-3.5 w-3.5 text-teal-500" />
          <span className="text-lg font-bold tabular-nums text-teal-600 dark:text-teal-400">{maxIob}U</span>
          <span className="text-[10px] text-slate-400">Peak IOB</span>
        </div>
      </div>

      {/* IOB + Glucose chart */}
      <div className="mb-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <h4 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Glucose &amp; Insulin-on-Board (IOB) Decay Curve</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={telemetry} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" stroke={axisColor} fontSize={9} tickLine={false} interval={3} />
              <YAxis yAxisId="left" stroke={axisColor} fontSize={9} tickLine={false} domain={[40, 250]} />
              <YAxis yAxisId="right" orientation="right" stroke={axisColor} fontSize={9} tickLine={false} domain={[0, Math.ceil(maxIob) + 1]} unit="U" />
              <Tooltip contentStyle={{ backgroundColor: dark ? '#0f172a' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '8px', fontSize: '11px' }} />
              <ReferenceLine y={localConfig.targetGlucose} yAxisId="left" stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target', fontSize: 9, fill: '#10b981' }} />
              <ReferenceLine y={localConfig.basalSuspendThreshold} yAxisId="left" stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Suspend', fontSize: 9, fill: '#ef4444' }} />
              <Line yAxisId="left" type="monotone" dataKey="glucose" stroke="#3b82f6" strokeWidth={2} dot={false} name="Glucose" />
              <Line yAxisId="right" type="monotone" dataKey="iob" stroke="#8b5cf6" strokeWidth={2} dot={false} name="IOB (U)" />
              <Bar yAxisId="right" dataKey="bolusAmount" fill="#f59e0b" fillOpacity={0.5} name="Bolus" barSize={4} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1.5 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-blue-500" />Glucose</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-violet-500" />IOB</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 bg-amber-500" />Micro-bolus</span>
        </div>
      </div>

      {/* Event log */}
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <h4 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Event Log (Non-normal events)</h4>
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {telemetry.filter(t => t.status !== 'normal').map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-10 text-slate-400">{t.time}</span>
              <span className={`font-semibold ${statusColor(t.status)}`}>{statusLabel(t.status)}</span>
              <span className="text-slate-400">G: {t.glucose} · IOB: {t.iob}U{t.bolusAmount > 0 ? ` · Bolus: ${t.bolusAmount}U` : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithm config panel */}
      {showSettings && (
        <div className="mt-4 space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/30">
          <h4 className="text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">Closed-Loop Algorithm Configuration</h4>
          <div className="grid grid-cols-2 gap-3">
            <ConfigSlider label="Target Glucose" value={localConfig.targetGlucose} min={90} max={150} step={5} unit=" mg/dL"
              onChange={v => setLocalConfig({ ...localConfig, targetGlucose: v })} />
            <ConfigSlider label="Max Micro-Bolus" value={localConfig.maxMicroBolus} min={0.5} max={5} step={0.1} unit="U"
              onChange={v => setLocalConfig({ ...localConfig, maxMicroBolus: v })} />
            <ConfigSlider label="Basal Suspend Threshold" value={localConfig.basalSuspendThreshold} min={55} max={80} step={1} unit=" mg/dL"
              onChange={v => setLocalConfig({ ...localConfig, basalSuspendThreshold: v })} />
            <ConfigSlider label="Predictive Low Cutoff" value={localConfig.predictiveLowCutoff} min={70} max={100} step={1} unit=" mg/dL"
              onChange={v => setLocalConfig({ ...localConfig, predictiveLowCutoff: v })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { onSaveConfig(localConfig); setShowSettings(false); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-600">
              <Save className="h-3.5 w-3.5" /> Save Configuration
            </button>
            <button onClick={() => { setLocalConfig(DEFAULT_AID_CONFIG); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 dark:border-slate-700">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigSlider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>
        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-bold tabular-nums text-violet-700 dark:bg-violet-950 dark:text-violet-400">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="glucotwin-slider w-full" style={{ '--pct': `${pct}%` } as React.CSSProperties} />
    </div>
  );
}
