import { useState } from 'react';
import { Users, Send, CheckCircle2, Circle, ClipboardList, Shield, Tag } from 'lucide-react';
import {
  CareTeamMember, HandoffNote, HandoffTask, SpecialistRole,
  HandoffTaskStatus, AuditEntry, DoctorPatient,
} from '@/lib/types';
import { CARE_TEAM } from '@/lib/doctorData';

interface CareTeamCollaborationProps {
  patient: DoctorPatient;
  handoffNotes: HandoffNote[];
  tasks: HandoffTask[];
  auditEntries: AuditEntry[];
  onAddHandoffNote: (text: string, taggedRole: SpecialistRole | null) => void;
  onAssignTask: (assigneeRole: SpecialistRole, title: string) => void;
  onToggleTask: (taskId: string) => void;
  currentAuthor: CareTeamMember;
}

const ROLE_COLORS: Record<SpecialistRole, string> = {
  'Endocrinologist': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  'Dietitian': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'CDCES': 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  'Primary Care': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function CareTeamCollaboration({
  patient, handoffNotes, tasks, auditEntries, onAddHandoffNote, onAssignTask, onToggleTask, currentAuthor,
}: CareTeamCollaborationProps) {
  const [tab, setTab] = useState<'handoff' | 'tasks' | 'audit'>('handoff');
  const [noteText, setNoteText] = useState('');
  const [taggedRole, setTaggedRole] = useState<SpecialistRole | ''>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState<SpecialistRole>('Dietitian');

  const patientNotes = handoffNotes.filter(n => n.patientId === patient.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const patientTasks = tasks.filter(t => t.patientId === patient.id);
  const patientAudit = auditEntries.filter(a => a.patientId === patient.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddHandoffNote(noteText.trim(), taggedRole || null);
    setNoteText('');
    setTaggedRole('');
  };

  const handleAssignTask = () => {
    if (!taskTitle.trim()) return;
    onAssignTask(taskAssignee, taskTitle.trim());
    setTaskTitle('');
  };

  const openTasks = patientTasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Care Team Collaboration</h3>
      </div>

      {/* Team members */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CARE_TEAM.map(m => (
          <div key={m.id} className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 dark:border-slate-800 dark:bg-slate-800/50">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${m.color} text-[10px] font-bold text-white`}>{m.initials}</div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{m.name}</p>
              <span className={`inline-block rounded px-1 text-[10px] font-medium ${ROLE_COLORS[m.role]}`}>{m.role}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {([
          { id: 'handoff' as const, label: 'Handoff Notes', icon: ClipboardList, count: patientNotes.length },
          { id: 'tasks' as const, label: 'Tasks', icon: CheckCircle2, count: openTasks },
          { id: 'audit' as const, label: 'HIPAA Audit Trail', icon: Shield, count: patientAudit.length },
        ]).map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                tab === t.id ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
              {t.count > 0 && <span className="ml-0.5 rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{t.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Handoff Notes tab */}
      {tab === 'handoff' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2}
              placeholder="Add a handoff note for the care team..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <div className="mt-2 flex items-center gap-2">
              <select value={taggedRole} onChange={e => setTaggedRole(e.target.value as SpecialistRole | '')}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">No tag</option>
                {(Object.keys(ROLE_COLORS) as SpecialistRole[]).map(r => <option key={r} value={r}>@{r}</option>)}
              </select>
              <button onClick={handleAddNote} disabled={!noteText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-40">
                <Send className="h-3.5 w-3.5" /> Post Note
              </button>
              <span className="ml-auto text-xs text-slate-400">Posting as: {currentAuthor.name}</span>
            </div>
          </div>

          <div className="space-y-2">
            {patientNotes.length === 0 ? <p className="text-sm text-slate-400">No handoff notes yet.</p> : patientNotes.map(note => {
              const author = CARE_TEAM.find(m => m.id === note.authorId);
              return (
                <div key={note.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="mb-1.5 flex items-center gap-2">
                    {author && <div className={`flex h-6 w-6 items-center justify-center rounded-full ${author.color} text-[10px] font-bold text-white`}>{author.initials}</div>}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{note.authorName}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_COLORS[note.authorRole]}`}>{note.authorRole}</span>
                    {note.taggedSpecialist && (
                      <span className="flex items-center gap-0.5 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        <Tag className="h-2.5 w-2.5" /> {note.taggedSpecialist}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-400">{formatTime(note.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{note.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks tab */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                placeholder="Task title..." className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value as SpecialistRole)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {(Object.keys(ROLE_COLORS) as SpecialistRole[]).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={handleAssignTask} disabled={!taskTitle.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-40">
                <Send className="h-3.5 w-3.5" /> Assign
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {patientTasks.length === 0 ? <p className="text-sm text-slate-400">No tasks assigned.</p> : patientTasks.map(task => {
              const Icon = task.status === 'completed' ? CheckCircle2 : Circle;
              return (
                <div key={task.id} className={`flex items-start gap-2.5 rounded-lg border p-3 ${
                  task.status === 'completed' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'
                }`}>
                  <button onClick={() => onToggleTask(task.id)} className="mt-0.5 shrink-0">
                    <Icon className={`h-4 w-4 ${task.status === 'completed' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{task.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className={`rounded px-1.5 py-0.5 font-medium ${ROLE_COLORS[task.assigneeRole]}`}>{task.assigneeRole}</span>
                      <span className="text-slate-400">Due: {task.dueDate}</span>
                      <span className={`rounded px-1.5 py-0.5 font-medium ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : task.status === 'in_progress' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>{task.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audit trail tab */}
      {tab === 'audit' && (
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            Immutable, timestamped log of all prescription adjustments and communications. HIPAA-compliant audit trail.
          </div>
          {patientAudit.length === 0 ? <p className="text-sm text-slate-400">No audit entries.</p> : patientAudit.map(entry => (
            <div key={entry.id} className="audit-entry-new flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{entry.actorName}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_COLORS[entry.actorRole]}`}>{entry.actorRole}</span>
                  <span className="ml-auto text-xs text-slate-400">{formatTime(entry.timestamp)}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{entry.summary}</p>
                <span className="mt-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">{entry.action.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
