import { Radio, Activity, AlertTriangle, TrendingDown, Minus } from 'lucide-react';
import { CGMStreamMode } from '@/lib/types';

interface CGMStreamToolbarProps {
  mode: CGMStreamMode;
  onModeChange: (mode: CGMStreamMode) => void;
  liveValue: number | null;
}

const MODE_CONFIG: Record<Exclude<CGMStreamMode, 'off'>, { label: string; icon: typeof Activity; color: string; bg: string }> = {
  stable: { label: 'Baseline Stable', icon: Minus, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' },
  spike: { label: 'Post-prandial Spike (>180)', icon: TrendingDown, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' },
  hypo: { label: 'Severe Nocturnal Hypo (<60)', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' },
};

export function CGMStreamToolbar({ mode, onModeChange, liveValue }: CGMStreamToolbarProps) {
  const isLive = mode !== 'off';

  return (
    <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 dark:border-slate-700">
          <span className={`relative flex h-2 w-2 ${isLive ? '' : 'opacity-30'}`}>
            {isLive && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${MODE_CONFIG[mode as Exclude<CGMStreamMode, 'off'>].bg} opacity-75`} />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isLive ? MODE_CONFIG[mode as Exclude<CGMStreamMode, 'off'>].bg : 'bg-slate-400'}`} />
          </span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {isLive ? 'Live CGM Connected' : 'CGM Offline'}
          </span>
          {liveValue !== null && isLive && (
            <span className="ml-1 text-xs font-bold tabular-nums text-slate-400">{liveValue} mg/dL</span>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => onModeChange(isLive ? 'off' : 'stable')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            isLive
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          <Radio className="h-3 w-3" />
          {isLive ? 'Stop Stream' : 'Simulate Live CGM Stream'}
        </button>

        {/* Scenario triggers */}
        {isLive && (
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2 dark:border-slate-700">
            {(Object.keys(MODE_CONFIG) as Array<keyof typeof MODE_CONFIG>).map(m => {
              const cfg = MODE_CONFIG[m];
              const Icon = cfg.icon;
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    isActive
                      ? `bg-slate-200 dark:bg-slate-700 ${cfg.color}`
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
