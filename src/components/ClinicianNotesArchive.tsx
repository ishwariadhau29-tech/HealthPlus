import { Archive, MessageSquare, Pill, StickyNote } from 'lucide-react';
import { ClinicalNote, ChatMessage, Prescription } from '@/lib/types';

interface ClinicianNotesArchiveProps {
  notes: ClinicalNote[];
  messages: ChatMessage[];
  prescriptions: Prescription[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ClinicianNotesArchive({ notes, messages, prescriptions }: ClinicianNotesArchiveProps) {
  // Combine all items into a timeline
  type TimelineItem = { id: string; type: 'note' | 'message' | 'prescription'; timestamp: string; title: string; body: string; icon: typeof StickyNote; color: string };
  const items: TimelineItem[] = [
    ...notes.map(n => ({ id: n.id, type: 'note' as const, timestamp: n.timestamp, title: n.author, body: n.text, icon: StickyNote, color: 'text-teal-600 dark:text-teal-400' })),
    ...messages.map(m => ({ id: m.id, type: 'message' as const, timestamp: m.timestamp, title: m.author === 'doctor' ? 'Dr. Clinician' : 'You', body: m.text, icon: MessageSquare, color: 'text-blue-600 dark:text-blue-400' })),
    ...prescriptions.map(p => ({ id: p.id, type: 'prescription' as const, timestamp: p.createdAt, title: 'Prescription', body: p.rationale, icon: Pill, color: 'text-violet-600 dark:text-violet-400' })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <Archive className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Clinician Notes Archive
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No clinician communications yet. When your doctor sends a plan or note, it will appear here.</p>
      ) : (
        <div className="relative space-y-3 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-700">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={`${item.type}-${item.id}`} className="relative flex gap-3 pl-0">
                <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-50 dark:border-slate-900 dark:bg-slate-800 ${item.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`text-xs font-semibold ${item.color}`}>{item.title}</span>
                    <span className="text-xs text-slate-400">{formatTime(item.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
