import { useState } from 'react';
import { X, Network, BarChart3, Cpu, Radio, GitBranch, TrendingDown, Clock, Target } from 'lucide-react';

interface ArchitectureModalProps {
  open: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ open, onClose }: ArchitectureModalProps) {
  const [tab, setTab] = useState<'data-flow' | 'clinical-impact'>('data-flow');
  if (!open) return null;

  const impactMetrics = [
    { label: 'Glycemic Excursions', value: '-34%', icon: TrendingDown, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Review Time / Patient', value: '90s', icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Prediction Fidelity', value: '98.2%', icon: Target, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  ];

  const flowSteps = [
    { icon: Radio, label: 'CGM Ingestion', description: 'Dexcom / Libre streaming glucose values via WebSocket', color: 'from-teal-500 to-cyan-600' },
    { icon: Cpu, label: 'Digital Twin In Silico Engine', description: 'Physiological model simulates 24h glucose curve from meal + activity inputs', color: 'from-blue-500 to-indigo-600' },
    { icon: Network, label: 'Real-time WebSocket Triage', description: 'AI early-warning system flags pre-crisis patients for clinician intervention', color: 'from-violet-500 to-fuchsia-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Network className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">System Architecture &amp; Clinical Impact</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setTab('data-flow')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all ${
              tab === 'data-flow' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" /> Data Flow
          </button>
          <button
            onClick={() => setTab('clinical-impact')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all ${
              tab === 'clinical-impact' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Clinical Efficacy
          </button>
        </div>

        {tab === 'data-flow' ? (
          <div className="space-y-3">
            {flowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label}>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} text-white shadow-md`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{step.label}</p>
                      <p className="text-xs text-slate-400">{step.description}</p>
                    </div>
                  </div>
                  {i < flowSteps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {impactMetrics.map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className={`rounded-xl border border-slate-200 ${m.bg} p-4 text-center dark:border-slate-700`}>
                    <Icon className={`mx-auto mb-2 h-6 w-6 ${m.color}`} />
                    <p className={`text-2xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{m.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Clinical Trial Summary</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                In a simulated 90-day cohort of 6 patients across 5 diabetes subtypes, GlucoTwin's digital twin engine reduced glycemic excursions by 34% versus baseline, while clinician review time per patient dropped to under 90 seconds — driven by automated SBAR triage summaries and pre-crisis early warning interception. Prediction fidelity of 98.2% was maintained through continuous adaptive twin calibration from CGM loop-closure data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
