import { History, FileText, FileJson, Clock, Cookie, Footprints, Moon, TrendingUp } from 'lucide-react';
import { SimulationRun, RiskLevel } from '@/lib/types';

interface HistoryTableProps {
  runs: SimulationRun[];
  onExportPdf: () => void;
  onExportJson: () => void;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  'Optimal': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Moderate Spike Risk': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Severe Excursion Risk': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryTable({ runs, onExportPdf, onExportJson }: HistoryTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Simulation History
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportJson}
            disabled={runs.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileJson className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button
            onClick={onExportPdf}
            disabled={runs.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clinical PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Clock className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No saved runs yet. Adjust the controls and save a run to build your history.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700">
                <th className="pb-2 pr-3 font-medium">Timestamp</th>
                <th className="pb-2 px-3 font-medium">
                  <span className="flex items-center gap-1"><Cookie className="h-3 w-3" />Carbs</span>
                </th>
                <th className="pb-2 px-3 font-medium">
                  <span className="flex items-center gap-1"><Footprints className="h-3 w-3" />Walk</span>
                </th>
                <th className="pb-2 px-3 font-medium">
                  <span className="flex items-center gap-1"><Moon className="h-3 w-3" />Sleep</span>
                </th>
                <th className="pb-2 px-3 font-medium">
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Peak</span>
                </th>
                <th className="pb-2 pl-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{formatTime(run.created_at)}</td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-700 dark:text-slate-200">{run.carbs_g}g</td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-700 dark:text-slate-200">{run.walk_mins}min</td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-700 dark:text-slate-200">{run.sleep_hrs}h</td>
                  <td className="py-2.5 px-3 font-semibold tabular-nums text-slate-900 dark:text-white">{run.projected_peak_mgdl} <span className="text-xs font-normal text-slate-400">mg/dL</span></td>
                  <td className="py-2.5 pl-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_COLORS[run.risk_level] ?? RISK_COLORS['Optimal']}`}>
                      {run.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
