import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { GlucosePoint } from '@/lib/types';

interface GlucoseChartProps {
  data: GlucosePoint[];
  dark: boolean;
  compareMode: boolean;
}

export function GlucoseChart({ data, dark, compareMode }: GlucoseChartProps) {
  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const axisColor = dark ? '#64748b' : '#94a3b8';
  const tooltipBg = dark ? '#0f172a' : '#ffffff';
  const tooltipBorder = dark ? '#334155' : '#e2e8f0';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          24-Hour Glucose Projection
        </h3>
      </div>

      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <ReferenceArea y1={70} y2={140} fill="#10b981" fillOpacity={dark ? 0.08 : 0.07} />
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="hour"
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              interval={2}
            />
            <YAxis
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              domain={[60, 220]}
              ticks={[60, 100, 140, 180, 220]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: dark ? '#cbd5e1' : '#475569', fontWeight: 600 }}
              formatter={(v) => [`${v} mg/dL`, '']}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              iconType="plainline"
            />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Baseline Twin"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              animationDuration={400}
            />
            {compareMode ? (
              <>
                <Line
                  type="monotone"
                  dataKey="scenarioA"
                  name="Scenario A"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  animationDuration={400}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scenarioB"
                  name="Scenario B"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={false}
                  animationDuration={400}
                  connectNulls
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="simulated"
                name="Simulated Twin"
                stroke="#14b8a6"
                strokeWidth={3}
                dot={false}
                animationDuration={400}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400/40" />
        Green band: safe glycemic window (70-140 mg/dL)
      </div>
    </div>
  );
}
