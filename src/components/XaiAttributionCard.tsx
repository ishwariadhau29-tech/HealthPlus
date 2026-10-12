import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { XaiAttribution, SimParams, Archetype } from '@/lib/types';
import { computeXaiAttribution } from '@/lib/glucoseEngine';

interface XaiAttributionCardProps {
  params: SimParams;
  peak: number;
  archetype: Archetype;
}

const COLOR_MAP: Record<XaiAttribution['color'], { bar: string; text: string; bg: string }> = {
  red: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
  amber: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  green: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  gray: { bar: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50' },
};

export function XaiAttributionCard({ params, peak, archetype }: XaiAttributionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const attributions = computeXaiAttribution(params, peak, archetype);
  const maxAbs = Math.max(...attributions.map(a => Math.abs(a.impact)), 40);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Why this prediction? (AI Attribution Factors)
          </h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {attributions.map(attr => {
            const cfg = COLOR_MAP[attr.color];
            const isPositive = attr.impact >= 0;
            const barWidth = Math.abs(attr.impact) / maxAbs * 100;
            return (
              <div key={attr.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{attr.label}</span>
                  <span className={`font-bold tabular-nums ${cfg.text}`}>
                    {isPositive ? '+' : ''}{attr.impact} mg/dL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`absolute top-0 h-full rounded-full ${cfg.bar} transition-all duration-500`}
                      style={{ width: `${barWidth}%`, left: isPositive ? '0' : 'auto', right: isPositive ? 'auto' : '0' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-xs text-slate-400">
            SHAP-style attribution showing each factor's contribution to the projected peak of {peak} mg/dL.
            Positive values increase glucose; negative values reduce it.
          </p>
        </div>
      )}
    </div>
  );
}
