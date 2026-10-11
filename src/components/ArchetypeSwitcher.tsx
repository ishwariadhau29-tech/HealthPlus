import { Users, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Archetype, ARCHETYPES } from '@/lib/types';

interface ArchetypeSwitcherProps {
  archetype: Archetype;
  onSelect: (a: Archetype) => void;
}

export function ArchetypeSwitcher({ archetype, onSelect }: ArchetypeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        <span className="flex-1 text-left">{archetype.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          {ARCHETYPES.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onSelect(a);
                setOpen(false);
              }}
              className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                a.id === archetype.id ? 'bg-teal-50 dark:bg-teal-950/40' : ''
              }`}
            >
              <span className={`text-sm font-semibold ${a.id === archetype.id ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {a.label}
              </span>
              <span className="text-xs text-slate-400">{a.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
