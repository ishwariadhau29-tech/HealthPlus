import { useState, useMemo } from 'react';
import {
  Stethoscope, Users, ChevronRight, ArrowLeft, Send, StickyNote,
  AlertOctagon, AlertTriangle, CheckCircle2, TrendingUp, Droplet,
  Gauge, Weight, Clock, Activity, MessageSquare, Flag, Radio,
  Filter, FlaskConical, X, Pill, Sparkles, Zap, Watch, Heart, Brain,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DoctorPatient, SimParams, Archetype, TriageRisk, ClinicalNote,
  ExerciseTiming, TriageFilter, SortField, AnomalyDetection,
  ChatMessage, Prescription, HandoffNote, HandoffTask, AuditEntry,
  CareTeamMember, SpecialistRole, AIDConfig, AutotuningRecommendation,
} from '@/lib/types';
import {
  filterAndSortPatients, getArchetypeByIdSync, ANOMALIES, CARE_TEAM,
} from '@/lib/doctorData';
import { generateGlucoseCurve, computePeak, classifyRisk, computeCGMMetrics, computeEarlyWarning, computeAutotuningRecommendations, DEFAULT_AID_CONFIG } from '@/lib/glucoseEngine';
import { GlucoseChart } from '@/components/GlucoseChart';
import { CGMMetricsPanel } from '@/components/CGMMetricsPanel';
import { AGPModal } from '@/components/AGPModal';
import { VirtualTrialModal } from '@/components/VirtualTrialModal';
import { SecureMessagingDrawer } from '@/components/SecureMessagingDrawer';
import { PrescriptionBuilder } from '@/components/PrescriptionBuilder';
import { EarlyWarningIndicator } from '@/components/EarlyWarningIndicator';
import { PumpTelemetryView } from '@/components/PumpTelemetryView';
import { CareTeamCollaboration } from '@/components/CareTeamCollaboration';
import { AutotuningPanel } from '@/components/AutotuningPanel';
import { useToast } from '@/context/ToastContext';

interface DoctorDashboardProps {
  dark: boolean;
  patients: DoctorPatient[];
  notes: ClinicalNote[];
  chats: ChatMessage[];
  prescriptions: Prescription[];
  handoffNotes: HandoffNote[];
  tasks: HandoffTask[];
  auditEntries: AuditEntry[];
  onAddNote: (patientId: string, text: string) => void;
  onPushPlan: (patientId: string, params: SimParams, archetypeId: string, note: string, prescription?: Prescription) => void;
  onSendChat: (patientId: string, text: string) => void;
  onAddPrescription: (rx: Prescription) => void;
  onToggleFlag: (patientId: string) => void;
  onBroadcastTip: (patientIds: string[], tip: string) => void;
  onAddHandoffNote: (patientId: string, authorId: string, text: string, taggedRole: SpecialistRole | null) => void;
  onAssignTask: (patientId: string, authorId: string, assigneeRole: SpecialistRole, title: string) => void;
  onToggleTask: (taskId: string) => void;
  onSaveAidConfig: (patientId: string, config: AIDConfig) => void;
  autotuningRecs: AutotuningRecommendation[];
  onApplyAutotuning: (rec: AutotuningRecommendation, newConfig: AIDConfig) => void;
  onDismissAutotuning: (recId: string, note: string) => void;
}

const CURRENT_AUTHOR: CareTeamMember = CARE_TEAM[0];

const RISK_CONFIG: Record<TriageRisk, { icon: typeof CheckCircle2; badge: string; dot: string }> = {
  'Optimal': { icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Moderate': { icon: AlertTriangle, badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', dot: 'bg-amber-500' },
  'High Risk': { icon: AlertOctagon, badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', dot: 'bg-red-500' },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const FILTER_LABELS: Record<TriageFilter, string> = {
  'all': 'All Patients', 'high-risk': 'High Risk / Red Flag', 'urgent-tir': 'Urgent: TIR < 70%', 'stable': 'Stable', 'pre-crisis': 'Pre-Crisis Alert',
};
const SORT_LABELS: Record<SortField, string> = {
  'risk': 'Risk Score', 'hba1c': 'HbA1c', 'tir': 'Time in Range', 'activity': 'Last Activity', 'early-warning': 'Early Warning Score',
};

export function DoctorDashboard({
  dark, patients, notes, chats, prescriptions, handoffNotes, tasks, auditEntries,
  onAddNote, onPushPlan, onSendChat, onAddPrescription, onToggleFlag, onBroadcastTip,
  onAddHandoffNote, onAssignTask, onToggleTask, onSaveAidConfig,
  autotuningRecs, onApplyAutotuning, onDismissAutotuning,
}: DoctorDashboardProps) {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TriageFilter>('all');
  const [sort, setSort] = useState<SortField>('risk');
  const [draftParams, setDraftParams] = useState<SimParams>(baseDraftParams());
  const [draftArchetypeId, setDraftArchetypeId] = useState<string>('standard');
  const [noteText, setNoteText] = useState('');
  const [agpPatient, setAgpPatient] = useState<DoctorPatient | null>(null);
  const [trialPatient, setTrialPatient] = useState<DoctorPatient | null>(null);
  const [messagingPatient, setMessagingPatient] = useState<DoctorPatient | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTip, setBroadcastTip] = useState('');

  const filteredSorted = useMemo(() => filterAndSortPatients(patients, filter, sort), [patients, filter, sort]);
  const selected = patients.find((p) => p.id === selectedId) ?? null;

  const selectedArchetype: Archetype = getArchetypeByIdSync(draftArchetypeId);
  const draftPeak = useMemo(() => computePeak(draftParams, selectedArchetype), [draftParams, selectedArchetype]);
  const draftCurve = useMemo(() => generateGlucoseCurve(draftParams, selectedArchetype), [draftParams, selectedArchetype]);
  const draftCGM = useMemo(() => computeCGMMetrics(draftCurve), [draftCurve]);

  const patientNotes = notes.filter((n) => n.patientId === selectedId);
  const patientPrescriptions = prescriptions.filter((p) => p.patientId === selectedId);

  // Compute early warnings for all patients
  const earlyWarnings = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeEarlyWarning>> = {};
    for (const p of patients) {
      const arch = getArchetypeByIdSync(p.archetypeId);
      map[p.id] = computeEarlyWarning(p, arch);
    }
    return map;
  }, [patients]);

  const handleSelectPatient = (p: DoctorPatient) => {
    setSelectedId(p.id);
    setDraftParams({ ...p.params });
    setDraftArchetypeId(p.archetypeId);
    setNoteText('');
    setShowPrescription(false);
  };

  const handleBack = () => setSelectedId(null);

  const handlePushPlan = () => {
    if (!selected) return;
    const latestRx = patientPrescriptions[patientPrescriptions.length - 1];
    onPushPlan(selected.id, { ...draftParams }, draftArchetypeId, noteText || 'Plan adjusted by clinician', latestRx);
    showToast(`Prescription successfully synced to ${selected.name}'s digital twin`, 'success');
  };

  const handleAddNote = () => {
    if (!selected || !noteText.trim()) return;
    onAddNote(selected.id, noteText.trim());
    showToast('Clinical note added', 'success');
    setNoteText('');
  };

  const handleSendChat = (text: string) => {
    if (!messagingPatient) return;
    onSendChat(messagingPatient.id, text);
  };

  const handleSavePrescription = (rx: Omit<Prescription, 'id' | 'createdAt'>) => {
    if (!selected) return;
    onAddPrescription({ ...rx, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    showToast('Prescription saved to patient record', 'success');
  };

  const handleBroadcast = () => {
    if (!broadcastTip.trim()) return;
    const highRiskIds = patients.filter(p => p.riskLevel === 'High Risk' || p.tir < 70).map(p => p.id);
    onBroadcastTip(highRiskIds, broadcastTip.trim());
    showToast(`Broadcast tip sent to ${highRiskIds.length} high-risk patients`, 'success');
    setBroadcastTip('');
    setBroadcastOpen(false);
  };

  const handleSaveAidConfig = (config: AIDConfig) => {
    if (!selected) return;
    onSaveAidConfig(selected.id, config);
    showToast('AID closed-loop configuration updated', 'success');
  };

  const handleApplyAutotuning = (rec: AutotuningRecommendation, newConfig: AIDConfig) => {
    if (!selected) return;
    onApplyAutotuning(rec, newConfig);
    showToast(`${rec.paramType.toUpperCase()} autotuning recommendation applied to pump config`, 'success');
  };

  const handleDismissAutotuning = (recId: string, note: string) => {
    onDismissAutotuning(recId, note);
    showToast('Recommendation dismissed with clinical note', 'info');
  };

  // Compute autotuning counts per patient for roster badge
  const autotuningPendingCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of patients) {
      const fresh = computeAutotuningRecommendations(p);
      const persistedPending = autotuningRecs.filter(r => r.patientId === p.id && r.status === 'pending');
      const seenIds = new Set(autotuningRecs.filter(r => r.patientId === p.id).map(r => r.id));
      const newFresh = fresh.filter(r => !seenIds.has(r.id));
      map[p.id] = persistedPending.length + newFresh.length;
    }
    return map;
  }, [patients, autotuningRecs]);

  if (selected) {
    return (
      <>
        <PatientDetailView
          patient={selected}
          dark={dark}
          onBack={handleBack}
          draftParams={draftParams}
          setDraftParams={setDraftParams}
          draftArchetypeId={draftArchetypeId}
          setDraftArchetypeId={setDraftArchetypeId}
          draftPeak={draftPeak}
          draftCurve={draftCurve}
          draftCGM={draftCGM}
          noteText={noteText}
          setNoteText={setNoteText}
          patientNotes={patientNotes}
          patientPrescriptions={patientPrescriptions}
          onAddNote={handleAddNote}
          onPushPlan={handlePushPlan}
          onToggleFlag={onToggleFlag}
          onOpenAGP={() => setAgpPatient(selected)}
          onOpenTrial={() => setTrialPatient(selected)}
          onOpenMessaging={() => setMessagingPatient(selected)}
          onTogglePrescription={() => setShowPrescription(v => !v)}
          onSavePrescription={handleSavePrescription}
          showPrescription={showPrescription}
          earlyWarning={earlyWarnings[selected.id]}
          handoffNotes={handoffNotes}
          tasks={tasks}
          auditEntries={auditEntries}
          onAddHandoffNote={(text, taggedRole) => { if (selected) onAddHandoffNote(selected.id, CURRENT_AUTHOR.id, text, taggedRole); showToast('Handoff note posted to care team', 'success'); }}
          onAssignTask={(assigneeRole, title) => { if (selected) onAssignTask(selected.id, CURRENT_AUTHOR.id, assigneeRole, title); showToast(`Task assigned to ${assigneeRole}`, 'success'); }}
          onToggleTask={(taskId) => { onToggleTask(taskId); showToast('Task status updated', 'success'); }}
          onSaveAidConfig={handleSaveAidConfig}
          autotuningRecs={autotuningRecs.filter(r => r.patientId === selected.id)}
          onApplyAutotuning={handleApplyAutotuning}
          onDismissAutotuning={handleDismissAutotuning}
        />
        <AGPModal patient={agpPatient} anomalies={ANOMALIES} onClose={() => setAgpPatient(null)} dark={dark} />
        {trialPatient && (
          <VirtualTrialModal patient={trialPatient} draftParams={draftParams} onClose={() => setTrialPatient(null)} dark={dark} />
        )}
        <SecureMessagingDrawer
          open={Boolean(messagingPatient)}
          onClose={() => setMessagingPatient(null)}
          patientId={messagingPatient?.id ?? ''}
          patientName={messagingPatient?.name ?? ''}
          messages={chats}
          onSend={handleSendChat}
        />
      </>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">Clinician Portal</h2>
          <p className="text-xs text-blue-600 dark:text-blue-500">Multi-patient triage, CDS analytics &amp; remote care planning</p>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </div>
          {(Object.keys(FILTER_LABELS) as TriageFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === f ? 'bg-blue-500 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}>
              {FILTER_LABELS[f]}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sort:</span>
            <select value={sort} onChange={e => setSort(e.target.value as SortField)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {(Object.keys(SORT_LABELS) as SortField[]).map(s => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button onClick={() => setBroadcastOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
            <Radio className="h-3.5 w-3.5" /> Broadcast Tip to High-Risk
          </button>
          <button onClick={() => { patients.filter(p => p.riskLevel === 'High Risk').forEach(p => onToggleFlag(p.id)); showToast('High-risk cohort flagged for weekly review', 'success'); }}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            <Flag className="h-3.5 w-3.5" /> Flag High-Risk for Weekly Review
          </button>
          <span className="ml-auto text-xs text-slate-400">{filteredSorted.length} of {patients.length} patients</span>
        </div>
      </div>

      {/* Patient table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Patient Triage Feed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700">
                <th className="pb-2 pr-3 font-medium">Patient</th>
                <th className="pb-2 px-3 font-medium">Type</th>
                <th className="pb-2 px-3 font-medium">TIR</th>
                <th className="pb-2 px-3 font-medium">HbA1c</th>
                <th className="pb-2 px-3 font-medium">Peak</th>
                <th className="pb-2 px-3 font-medium">4h Forecast</th>
                <th className="pb-2 px-3 font-medium">Risk</th>
                <th className="pb-2 pl-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map(p => {
                const cfg = RISK_CONFIG[p.riskLevel];
                const RiskIcon = cfg.icon;
                const pAnomalies = ANOMALIES.filter(a => a.patientId === p.id);
                const ew = earlyWarnings[p.id];
                const isPreCrisis = ew && (ew.level === 'high' || ew.level === 'critical');
                return (
                  <tr key={p.id} onClick={() => handleSelectPatient(p)}
                    className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.age} yrs · {p.weightKg} kg{p.flagged && ' · 🚩'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">{p.diabetesType}</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold tabular-nums ${p.tir >= 70 ? 'text-emerald-600 dark:text-emerald-400' : p.tir >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{p.tir}%</span>
                    </td>
                    <td className="py-3 px-3 tabular-nums text-slate-700 dark:text-slate-200">{p.hba1c}%</td>
                    <td className="py-3 px-3 tabular-nums text-slate-700 dark:text-slate-200">{p.recentPeak}</td>
                    <td className="py-3 px-3">
                      {ew && (
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs font-bold tabular-nums ${ew.hyperRisk > 50 ? 'text-red-600 dark:text-red-400' : ew.hypoRisk > 50 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                            {ew.projectedGlucose} mg/dL
                          </span>
                          {isPreCrisis && (
                            <span className="pre-crisis-indicator inline-flex w-fit items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                              <Zap className="h-2.5 w-2.5" /> Pre-Crisis
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
                        <RiskIcon className="h-3 w-3" />{p.riskLevel}
                      </span>
                      {pAnomalies.length > 0 && (
                        <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                          <Sparkles className="h-2.5 w-2.5" />{pAnomalies.length}
                        </span>
                      )}
                      {autotuningPendingCounts[p.id] > 0 && (
                        <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                          <SlidersHorizontal className="h-2.5 w-2.5" />{autotuningPendingCounts[p.id]}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setAgpPatient(p)} title="AGP Report" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800">
                          <Activity className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setMessagingPatient(p)} title="Message" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-teal-600 dark:hover:bg-slate-800">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setBroadcastOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Broadcast Educational Tip</h2>
              <button onClick={() => setBroadcastOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-xs text-slate-400">Sends to {patients.filter(p => p.riskLevel === 'High Risk' || p.tir < 70).length} high-risk patients</p>
            <textarea value={broadcastTip} onChange={e => setBroadcastTip(e.target.value)} rows={3}
              placeholder="Enter educational tip for high-risk cohort..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button onClick={handleBroadcast} disabled={!broadcastTip.trim()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-600 disabled:opacity-40">
              <Radio className="h-4 w-4" /> Send Broadcast
            </button>
          </div>
        </div>
      )}

      <AGPModal patient={agpPatient} anomalies={ANOMALIES} onClose={() => setAgpPatient(null)} dark={dark} />
      <SecureMessagingDrawer
        open={Boolean(messagingPatient)}
        onClose={() => setMessagingPatient(null)}
        patientId={messagingPatient?.id ?? ''}
        patientName={messagingPatient?.name ?? ''}
        messages={chats}
        onSend={handleSendChat}
      />
    </div>
  );
}

function baseDraftParams(): SimParams {
  return { carbs_g: 45, walk_mins: 15, sleep_hrs: 7, protein_g: 20, fat_g: 15, exercise_timing: 'after' };
}

interface PatientDetailViewProps {
  patient: DoctorPatient;
  dark: boolean;
  onBack: () => void;
  draftParams: SimParams;
  setDraftParams: (p: SimParams) => void;
  draftArchetypeId: string;
  setDraftArchetypeId: (id: string) => void;
  draftPeak: number;
  draftCurve: ReturnType<typeof generateGlucoseCurve>;
  draftCGM: ReturnType<typeof computeCGMMetrics>;
  noteText: string;
  setNoteText: (t: string) => void;
  patientNotes: ClinicalNote[];
  patientPrescriptions: Prescription[];
  onAddNote: () => void;
  onPushPlan: () => void;
  onToggleFlag: (id: string) => void;
  onOpenAGP: () => void;
  onOpenTrial: () => void;
  onOpenMessaging: () => void;
  onTogglePrescription: () => void;
  onSavePrescription: (rx: Omit<Prescription, 'id' | 'createdAt'>) => void;
  showPrescription: boolean;
  earlyWarning: ReturnType<typeof computeEarlyWarning>;
  handoffNotes: HandoffNote[];
  tasks: HandoffTask[];
  auditEntries: AuditEntry[];
  onAddHandoffNote: (text: string, taggedRole: SpecialistRole | null) => void;
  onAssignTask: (assigneeRole: SpecialistRole, title: string) => void;
  onToggleTask: (taskId: string) => void;
  onSaveAidConfig: (config: AIDConfig) => void;
  autotuningRecs: AutotuningRecommendation[];
  onApplyAutotuning: (rec: AutotuningRecommendation, newConfig: AIDConfig) => void;
  onDismissAutotuning: (recId: string, note: string) => void;
}

function PatientDetailView({
  patient, dark, onBack, draftParams, setDraftParams, draftArchetypeId, setDraftArchetypeId,
  draftPeak, draftCurve, draftCGM, noteText, setNoteText, patientNotes,
  patientPrescriptions, onAddNote, onPushPlan, onToggleFlag, onOpenAGP, onOpenTrial,
  onOpenMessaging, onTogglePrescription, onSavePrescription, showPrescription,
  earlyWarning, handoffNotes, tasks, auditEntries,
  onAddHandoffNote, onAssignTask, onToggleTask, onSaveAidConfig,
  autotuningRecs, onApplyAutotuning, onDismissAutotuning,
}: PatientDetailViewProps) {
  const origCurve = useMemo(() => generateGlucoseCurve(patient.params, getArchetypeByIdSync(patient.archetypeId)), [patient]);
  const origCGM = useMemo(() => computeCGMMetrics(origCurve), [origCurve]);
  const patientAnomalies = ANOMALIES.filter(a => a.patientId === patient.id);
  const isAidPatient = patient.diabetesType === 'Type 1 (AID)';
  const aidConfig = patient.aidConfig ?? DEFAULT_AID_CONFIG;

  const profileMetrics = [
    { icon: Clock, label: 'Age', value: `${patient.age} yrs` },
    { icon: Weight, label: 'Weight', value: `${patient.weightKg} kg` },
    { icon: Gauge, label: 'HbA1c', value: `${patient.hba1c}%` },
    { icon: Droplet, label: 'Fasting', value: `${patient.fastingGlucose} mg/dL` },
    { icon: TrendingUp, label: 'TIR', value: `${patient.tir}%` },
  ];

  const sliderConfigs = [
    { key: 'carbs_g' as keyof SimParams, label: 'Carbs', min: 0, max: 100, step: 1, unit: 'g' },
    { key: 'protein_g' as keyof SimParams, label: 'Protein', min: 0, max: 60, step: 1, unit: 'g' },
    { key: 'fat_g' as keyof SimParams, label: 'Fat', min: 0, max: 50, step: 1, unit: 'g' },
    { key: 'walk_mins' as keyof SimParams, label: 'Walk', min: 0, max: 60, step: 1, unit: 'min' },
    { key: 'sleep_hrs' as keyof SimParams, label: 'Sleep', min: 4, max: 10, step: 0.5, unit: 'hrs' },
  ];

  const peakDelta = draftPeak - computePeak(patient.params, getArchetypeByIdSync(patient.archetypeId));
  const tirDelta = draftCGM.tir - origCGM.tir;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
          <ArrowLeft className="h-4 w-4" /> Back to Triage Feed
        </button>
        <button onClick={() => onToggleFlag(patient.id)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            patient.flagged
              ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
          }`}>
          <Flag className="h-3 w-3" /> {patient.flagged ? 'Flagged' : 'Flag for Review'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{patient.name}</h2>
            <p className="text-sm text-slate-400">{patient.diabetesType} · Last visit: {patient.lastVisit} · Last active: {patient.lastActivity}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onOpenAGP} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Activity className="h-3.5 w-3.5" /> AGP Report
            </button>
            <button onClick={onOpenMessaging} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </button>
            <button onClick={onOpenTrial} className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400">
              <FlaskConical className="h-3.5 w-3.5" /> Virtual Trial
            </button>
          </div>
        </div>

        {/* Anomaly badges */}
        {patientAnomalies.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {patientAnomalies.map(a => {
              const Icon = a.severity === 'critical' ? AlertOctagon : AlertTriangle;
              const colors = a.severity === 'critical'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
              return (
                <span key={a.id} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${colors}`}>
                  <Icon className="h-3 w-3" /> {a.label}
                </span>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {profileMetrics.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500"><Icon className="h-3.5 w-3.5" />{m.label}</div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{m.value}</span>
              </div>
            );
          })}
        </div>

        {/* Wearable metrics row */}
        {patient.wearable && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-3 dark:border-teal-900 dark:bg-teal-950/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400">
              <Watch className="h-3.5 w-3.5" /> {patient.wearable.source}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Brain className="h-3 w-3" /> Sleep: <span className={`font-bold ${patient.wearable.sleepScore < 60 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{patient.wearable.sleepScore}/100</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Heart className="h-3 w-3" /> RHR: <span className={`font-bold ${patient.wearable.restingHr > 75 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>{patient.wearable.restingHr} bpm</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Activity className="h-3 w-3" /> Stress: <span className={`font-bold ${patient.wearable.stressScore > 70 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{patient.wearable.stressScore}/100</span>
            </div>
          </div>
        )}
      </div>

      {/* Early Warning Indicator */}
      <EarlyWarningIndicator prediction={earlyWarning} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlucoseChart data={draftCurve} dark={dark} compareMode={false} />
        <CGMMetricsPanel metrics={draftCGM} dark={dark} />
      </div>

      {/* Pump Telemetry for AID patients */}
      {isAidPatient && (
        <PumpTelemetryView patient={patient} config={aidConfig} onSaveConfig={onSaveAidConfig} dark={dark} />
      )}

      {/* Insulin Autotuning Panel */}
      <AutotuningPanel
        patient={patient}
        existingRecommendations={autotuningRecs}
        onApply={onApplyAutotuning}
        onDismiss={onDismissAutotuning}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* What-If Prescription */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Remote What-If Prescription</h3>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Patient Archetype</label>
            <select value={draftArchetypeId} onChange={e => setDraftArchetypeId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <option value="athletic">Athletic / Insulin Sensitive</option>
              <option value="standard">Standard Adult</option>
              <option value="prediabetic">Prediabetic / Insulin Resistant</option>
            </select>
          </div>
          <div className="space-y-4">
            {sliderConfigs.map(s => {
              const value = draftParams[s.key] as number;
              const pct = ((value - s.min) / (s.max - s.min)) * 100;
              return (
                <div key={s.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.label}</label>
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold tabular-nums text-teal-700 dark:bg-teal-950 dark:text-teal-400">{value}{s.unit}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={value}
                    onChange={e => setDraftParams({ ...draftParams, [s.key]: parseFloat(e.target.value) })}
                    className="glucotwin-slider w-full" style={{ '--pct': `${pct}%` } as React.CSSProperties} />
                </div>
              );
            })}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Exercise Timing</label>
              <div className="grid grid-cols-2 gap-2">
                {(['before', 'after'] as ExerciseTiming[]).map(t => (
                  <button key={t} onClick={() => setDraftParams({ ...draftParams, exercise_timing: t })}
                    className={`rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                      draftParams.exercise_timing === t ? 'border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-400' : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                    }`}>{t === 'before' ? 'Before Meal' : 'After Meal'}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Projected Peak</span><span className="font-bold tabular-nums text-slate-900 dark:text-white">{draftPeak} mg/dL</span></div>
            <div className="mt-1.5 flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">vs. Current</span><span className={`font-bold tabular-nums ${peakDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : peakDelta > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>{peakDelta > 0 ? '+' : ''}{peakDelta} mg/dL</span></div>
            <div className="mt-1.5 flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">TIR Delta</span><span className={`font-bold tabular-nums ${tirDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : tirDelta < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>{tirDelta > 0 ? '+' : ''}{tirDelta}%</span></div>
          </div>
          <button onClick={onPushPlan} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-700">
            <Send className="h-4 w-4" /> Push Plan to Patient
          </button>
          <button onClick={onTogglePrescription} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40">
            <Pill className="h-3.5 w-3.5" /> {showPrescription ? 'Hide' : 'Show'} Prescription Builder
          </button>
        </div>

        <div className="space-y-5 lg:col-span-2">
          {showPrescription && <PrescriptionBuilder patient={patient} onSave={onSavePrescription} />}

          {/* Care Team Collaboration */}
          <CareTeamCollaboration
            patient={patient}
            handoffNotes={handoffNotes}
            tasks={tasks}
            auditEntries={auditEntries}
            onAddHandoffNote={onAddHandoffNote}
            onAssignTask={onAssignTask}
            onToggleTask={onToggleTask}
            currentAuthor={CURRENT_AUTHOR}
          />

          {/* Clinical Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Clinical Notes &amp; Recommendations</h3>
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Add a timestamped clinical note..." rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button onClick={onAddNote} disabled={!noteText.trim()}
              className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <StickyNote className="h-3.5 w-3.5" /> Add Note
            </button>
            <div className="mt-4 space-y-2">
              {patientNotes.length === 0 ? <p className="text-sm text-slate-400">No clinical notes yet.</p> : patientNotes.map(note => (
                <div key={note.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{note.author}</span>
                    <span className="text-xs text-slate-400">{formatTime(note.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recent Simulation History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700">
                  <th className="pb-2 pr-3 font-medium">Timestamp</th><th className="pb-2 px-3 font-medium">Carbs</th><th className="pb-2 px-3 font-medium">Walk</th><th className="pb-2 px-3 font-medium">Sleep</th><th className="pb-2 px-3 font-medium">Peak</th><th className="pb-2 pl-3 font-medium">Risk</th>
                </tr></thead>
                <tbody>{patient.history.map(run => (
                  <tr key={run.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{formatTime(run.created_at)}</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-700 dark:text-slate-200">{run.carbs_g}g</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-700 dark:text-slate-200">{run.walk_mins}min</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-700 dark:text-slate-200">{run.sleep_hrs}h</td>
                    <td className="py-2.5 px-3 font-semibold tabular-nums text-slate-900 dark:text-white">{run.projected_peak_mgdl}</td>
                    <td className="py-2.5 pl-3 text-xs text-slate-500">{run.risk_level}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
