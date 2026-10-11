import { Sparkles, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { RiskLevel } from '@/lib/types';

interface InsightsPanelProps {
  risk: RiskLevel;
  peak: number;
  advisory: string;
}

const RISK_CONFIG: Record<RiskLevel, { icon: typeof CheckCircle2; bg: string; border: string; text: string; iconColor: string }> = {
  'Optimal': {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    iconColor: 'text-emerald-500',
  },
  'Moderate Spike Risk': {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    iconColor: 'text-amber-500',
  },
  'Severe Excursion Risk': {
    icon: AlertOctagon,
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    iconColor: 'text-red-500',
  },
};

export function InsightsPanel({ risk, peak, advisory }: InsightsPanelProps) {
  const cfg = RISK_CONFIG[risk];
  const RiskIcon = cfg.icon;

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.bg} ${cfg.iconColor}`}>
          <RiskIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Risk Assessment</p>
          <p className={`text-base font-bold ${cfg.text}`}>{risk}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Projected Peak</p>
          <p className={`text-base font-bold tabular-nums ${cfg.text}`}>{peak} <span className="text-xs">mg/dL</span></p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            AI Advisory
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{advisory}</p>
      </div>
    </div>
  );
}
