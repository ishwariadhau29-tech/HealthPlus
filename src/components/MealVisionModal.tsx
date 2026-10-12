import { useState } from 'react';
import { Camera, X, Upload, Loader2, Check, Apple, Salad, Hamburger } from 'lucide-react';
import { SimParams, MealMacroAnalysis, MealPresetId } from '@/lib/types';
import { MEAL_PRESETS, analyzeMealMacros } from '@/lib/glucoseEngine';

interface MealVisionModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (macros: MealMacroAnalysis) => void;
  currentParams: SimParams;
}

const PRESET_ICONS: Record<MealPresetId, typeof Camera> = {
  pasta: Apple,
  keto: Salad,
  burger: Hamburger,
};

export function MealVisionModal({ open, onClose, onApply, currentParams }: MealVisionModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MealMacroAnalysis | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<MealPresetId | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!open) return null;

  const runAnalysis = (preset: MealPresetId) => {
    setSelectedPreset(preset);
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      const presetData = MEAL_PRESETS.find(p => p.id === preset)!;
      const macros = analyzeMealMacros(presetData.macros);
      setResult(macros);
      setAnalyzing(false);
    }, 1800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    runAnalysis('pasta');
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    onClose();
    setResult(null);
    setSelectedPreset(null);
  };

  const handleClose = () => {
    onClose();
    setResult(null);
    setSelectedPreset(null);
    setAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
              <Camera className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Snap / Upload Meal</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => runAnalysis('pasta')}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-colors ${
            dragActive
              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
              : 'border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-teal-600'
          }`}
        >
          <Upload className="mb-2 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drop a meal photo or click to upload</p>
          <p className="mt-0.5 text-xs text-slate-400">Multimodal vision will analyze plate composition</p>
        </div>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs font-medium text-slate-400">or try a test preset</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Preset buttons */}
        <div className="grid grid-cols-3 gap-2">
          {MEAL_PRESETS.map(preset => {
            const Icon = PRESET_ICONS[preset.id];
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => runAnalysis(preset.id)}
                disabled={analyzing}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all disabled:opacity-50 ${
                  isActive
                    ? 'border-teal-500 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/40'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{preset.label}</span>
                <span className="text-[10px] text-slate-400">{preset.macros.calories} cal</span>
              </button>
            );
          })}
        </div>

        {/* Analyzing state */}
        {analyzing && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 py-6 dark:border-teal-800 dark:bg-teal-950/30">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400" />
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Analyzing plate composition via multimodal vision...</p>
          </div>
        )}

        {/* Result */}
        {result && !analyzing && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Analysis complete: {result.label}</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Carbs', value: result.carbs, unit: 'g', color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Protein', value: result.protein, unit: 'g', color: 'text-teal-600 dark:text-teal-400' },
                { label: 'Fat', value: result.fat, unit: 'g', color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Fiber', value: result.fiber, unit: 'g', color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Calories', value: result.calories, unit: '', color: 'text-slate-600 dark:text-slate-300' },
              ].map(m => (
                <div key={m.label} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-[10px] font-medium uppercase text-slate-400">{m.label}</p>
                  <p className={`text-lg font-bold tabular-nums ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-slate-400">{m.unit}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              <p className="font-mono">{JSON.stringify({ carbs: result.carbs, protein: result.protein, fat: result.fat, fiber: result.fiber, calories: result.calories }, null, 0)}</p>
              <p className="mt-1 text-[11px]">Will sync Carbs ({result.carbs}g), Protein ({result.protein}g), and Fat ({result.fat}g) into simulation sliders.</p>
            </div>

            <button
              onClick={handleApply}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-teal-600 hover:to-cyan-700"
            >
              <Check className="h-4 w-4" /> Sync Macros to Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
