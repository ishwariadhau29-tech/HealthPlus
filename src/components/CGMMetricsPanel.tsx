import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Gauge, Activity, BarChart3 } from 'lucide-react';
import { CGMMetrics } from '@/lib/types';

interface CGMMetricsPanelProps {
  metrics: CGMMetrics;
  dark: boolean;
}

export function CGMMetricsPanel({ metrics }: CGMMetricsPanelProps) {
  const data = [
    { name: 'In Target (70-140)', value: metrics.tir, color: '#10b981' },
    { name: 'High (>140)', value: metrics.highPct, color: '#f59e0b' },
    { name: 'Low (<70)', value: metrics.lowPct, color: '#ef4444' },
  ];

  const variabilityStatus =
    metrics.cv < 20 ? { label: 'Low Variability', color: 'text-emerald-600 dark:text-emerald-400' } :
    metrics.cv < 36 ? { label: 'Moderate Variability', color: 'text-amber-600 dark:text-amber-400' } :
    { label: 'High Variability', color: 'text-red-600 dark:text-red-400' };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          CGM Clinical Metrics
        </h3>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                animationDuration={400}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{metrics.tir}%</span>
            <span className="text-xs text-slate-400">Time in Range</span>
          </div>
        </div>

        <div className="w-full space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="flex-1 text-slate-600 dark:text-slate-300">{d.name}</span>
              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center dark:border-slate-800 dark:bg-slate-800/50">
          <div className="mb-1 flex items-center justify-center gap-1 text-xs text-slate-400">
            <Activity className="h-3 w-3" />
            SD
          </div>
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{metrics.sd}</span>
          <span className="text-xs text-slate-400"> mg/dL</span>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center dark:border-slate-800 dark:bg-slate-800/50">
          <div className="mb-1 flex items-center justify-center gap-1 text-xs text-slate-400">
            <BarChart3 className="h-3 w-3" />
            CV%
          </div>
          <span className={`text-sm font-bold tabular-nums ${variabilityStatus.color}`}>{metrics.cv}%</span>
          <p className="text-[10px] leading-tight text-slate-400">{variabilityStatus.label}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center dark:border-slate-800 dark:bg-slate-800/50">
          <div className="mb-1 flex items-center justify-center gap-1 text-xs text-slate-400">
            <Gauge className="h-3 w-3" />
            eA1c
          </div>
          <span className="text-sm font-bold tabular-nums text-teal-700 dark:text-teal-400">{metrics.ea1c}%</span>
          <p className="text-[10px] leading-tight text-slate-400">Mean: {metrics.meanGlucose}</p>
        </div>
      </div>
    </div>
  );
}
