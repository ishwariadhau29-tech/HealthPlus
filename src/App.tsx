import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider, useToast } from '@/context/ToastContext';
import { TopBar } from '@/components/TopBar';
import { AuthModal } from '@/components/AuthModal';
import { ProfileBanner } from '@/components/ProfileBanner';
import { ControlPanel } from '@/components/ControlPanel';
import { GlucoseChart } from '@/components/GlucoseChart';
import { InsightsPanel } from '@/components/InsightsPanel';
import { HistoryTable } from '@/components/HistoryTable';
import { ArchetypeSwitcher } from '@/components/ArchetypeSwitcher';
import { CGMMetricsPanel } from '@/components/CGMMetricsPanel';
import { ScenarioComparison } from '@/components/ScenarioComparison';
import { DoctorDashboard } from '@/components/DoctorDashboard';
import { PatientConfirmModal } from '@/components/PatientConfirmModal';
import { ClinicianNotesArchive } from '@/components/ClinicianNotesArchive';
import { useTheme } from '@/hooks/useTheme';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  DEFAULT_PARAMS, DEFAULT_ARCHETYPE, SimParams, SimulationRun, Archetype,
  GlucosePoint, AppRole, ClinicalNote, ChatMessage, Prescription, DoctorPatient,
  PatientPlanNotification, HandoffNote, HandoffTask, AuditEntry, SpecialistRole, AIDConfig, AutotuningRecommendation,
} from '@/lib/types';
import {
  computePeak, classifyRisk, generateGlucoseCurve, generateAdvisory, computeCGMMetrics,
} from '@/lib/glucoseEngine';
import { exportClinicalSummary, exportJsonSummary } from '@/lib/exportSummary';
import { loadDoctorState, saveDoctorState, getPatientName, ANOMALIES, CARE_TEAM } from '@/lib/doctorData';

function GlucoTwinApp() {
  const { user, isDemo, profile, isConfigured } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [saving, setSaving] = useState(false);
  const [archetype, setArchetype] = useState<Archetype>(DEFAULT_ARCHETYPE);
  const [role, setRole] = useState<AppRole>('patient');

  // Doctor portal state with localStorage persistence
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [handoffNotes, setHandoffNotes] = useState<HandoffNote[]>([]);
  const [tasks, setTasks] = useState<HandoffTask[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [autotuningRecs, setAutotuningRecs] = useState<AutotuningRecommendation[]>([]);

  const [planNotification, setPlanNotification] = useState<PatientPlanNotification | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [scenarioAPinned, setScenarioAPinned] = useState<{
    params: SimParams; archetype: Archetype; peak: number; tir: number;
  } | null>(null);

  // Load persisted doctor state on mount
  useEffect(() => {
    const state = loadDoctorState();
    setPatients(state.patients);
    setNotes(state.notes);
    setChats(state.chats);
    setPrescriptions(state.prescriptions);
    setHandoffNotes(state.handoffNotes);
    setTasks(state.tasks);
    setAuditEntries(state.auditEntries);
    setAutotuningRecs(state.autotuningRecs ?? []);
  }, []);

  // Persist doctor state on changes
  useEffect(() => {
    if (patients.length > 0) {
      saveDoctorState({ patients, notes, chats, prescriptions, handoffNotes, tasks, auditEntries, autotuningRecs });
    }
  }, [patients, notes, chats, prescriptions, handoffNotes, tasks, auditEntries, autotuningRecs]);

  const loadRuns = useCallback(async () => {
    if (!isConfigured || (!user && !isDemo)) return;
    if (user) {
      const { data } = await supabase.from('simulation_runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      if (data) setRuns(data as SimulationRun[]);
    }
  }, [user, isDemo, isConfigured]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const peak = useMemo(() => computePeak(params, archetype), [params, archetype]);
  const risk = useMemo(() => classifyRisk(peak), [peak]);
  const curve = useMemo(() => generateGlucoseCurve(params, archetype), [params, archetype]);
  const cgmMetrics = useMemo(() => computeCGMMetrics(curve), [curve]);
  const advisory = useMemo(() => generateAdvisory(params, peak), [params, peak]);

  const chartData = useMemo<GlucosePoint[]>(() => {
    if (!compareMode || !scenarioAPinned) return curve;
    const curveA = generateGlucoseCurve(scenarioAPinned.params, scenarioAPinned.archetype);
    return curve.map((point, i) => ({ ...point, scenarioA: curveA[i]?.simulated, scenarioB: point.simulated }));
  }, [curve, compareMode, scenarioAPinned]);

  const scenarioBStats = { peak, tir: cgmMetrics.tir };

  const handleSave = async () => {
    setSaving(true);
    if (isConfigured && user) {
      const { data } = await supabase.from('simulation_runs').insert({
        carbs_g: params.carbs_g, walk_mins: params.walk_mins, sleep_hrs: params.sleep_hrs,
        projected_peak_mgdl: peak, risk_level: risk,
      }).select('*').maybeSingle();
      if (data) setRuns(prev => [data as SimulationRun, ...prev]);
    } else {
      const demoRun: SimulationRun = { id: crypto.randomUUID(), user_id: 'demo-patient', carbs_g: params.carbs_g, walk_mins: params.walk_mins, sleep_hrs: params.sleep_hrs, projected_peak_mgdl: peak, risk_level: risk, created_at: new Date().toISOString() };
      setRuns(prev => [demoRun, ...prev]);
    }
    setSaving(false);
    showToast('Simulation run saved', 'success');
  };

  const exportProfile = { id: 'demo', full_name: archetype.label.split(' (')[0], age: 34, weight_kg: 74, baseline_hba1c: 5.6, fasting_glucose: archetype.fastingGlucose, updated_at: null };

  const handleExportPdf = () => exportClinicalSummary({ profile: profile ?? exportProfile, archetype, params, peak, risk, metrics: cgmMetrics, advisory, history: runs });
  const handleExportJson = () => exportJsonSummary({ profile: profile ?? exportProfile, archetype, params, peak, risk, metrics: cgmMetrics, advisory, history: runs });

  const handlePinA = () => setScenarioAPinned({ params: { ...params }, archetype, peak, tir: cgmMetrics.tir });
  const handleClearA = () => setScenarioAPinned(null);

  // Doctor handlers
  const handleAddNote = (patientId: string, text: string) => {
    setNotes(prev => [...prev, { id: crypto.randomUUID(), patientId, author: 'Dr. Clinician', text, timestamp: new Date().toISOString() }]);
  };

  const handlePushPlan = (patientId: string, planParams: SimParams, _archetypeId: string, note: string, prescription?: Prescription) => {
    const patientName = getPatientName(patients, patientId);
    setPlanNotification({ patientName, params: { ...planParams }, note, prescription, timestamp: new Date().toISOString() });
    setNotes(prev => [...prev, { id: crypto.randomUUID(), patientId, author: 'Dr. Clinician', text: `[Plan Pushed] ${note}`, timestamp: new Date().toISOString() }]);
  };

  const handleSendChat = (patientId: string, text: string) => {
    setChats(prev => [...prev, { id: crypto.randomUUID(), patientId, author: 'doctor', text, timestamp: new Date().toISOString() }]);
  };

  const handleAddPrescription = (rx: Prescription) => {
    setPrescriptions(prev => [...prev, rx]);
  };

  const handleToggleFlag = (patientId: string) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, flagged: !p.flagged } : p));
  };

  const handleBroadcastTip = (patientIds: string[], tip: string) => {
    const newNotes = patientIds.map(id => ({ id: crypto.randomUUID(), patientId: id, author: 'Dr. Clinician', text: `[Broadcast] ${tip}`, timestamp: new Date().toISOString() } as ClinicalNote));
    setNotes(prev => [...prev, ...newNotes]);
  };

  const addAuditEntry = (patientId: string, action: AuditEntry['action'], summary: string) => {
    const author = CARE_TEAM[0];
    setAuditEntries(prev => [...prev, {
      id: crypto.randomUUID(), patientId, action, actorName: author.name, actorRole: author.role, summary, timestamp: new Date().toISOString(),
    }]);
  };

  const handleAddHandoffNote = (patientId: string, authorId: string, text: string, taggedRole: SpecialistRole | null) => {
    const author = CARE_TEAM.find(m => m.id === authorId) ?? CARE_TEAM[0];
    setHandoffNotes(prev => [...prev, {
      id: crypto.randomUUID(), patientId, authorId, authorName: author.name, authorRole: author.role,
      text, taggedSpecialist: taggedRole, timestamp: new Date().toISOString(),
    }]);
    addAuditEntry(patientId, 'note_added', `Handoff note posted by ${author.name}${taggedRole ? ` tagging ${taggedRole}` : ''}`);
  };

  const handleAssignTask = (patientId: string, authorId: string, assigneeRole: SpecialistRole, title: string) => {
    setTasks(prev => [...prev, {
      id: crypto.randomUUID(), patientId, authorId, assigneeRole, title,
      status: 'open', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(), completedAt: null,
    }]);
    addAuditEntry(patientId, 'task_assigned', `Task "${title}" assigned to ${assigneeRole}`);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const completed = t.status !== 'completed';
      if (completed) addAuditEntry(t.patientId, 'task_completed', `Task "${t.title}" marked complete`);
      return { ...t, status: completed ? 'completed' : 'open', completedAt: completed ? new Date().toISOString() : null };
    }));
  };

  const handleSaveAidConfig = (patientId: string, config: AIDConfig) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, aidConfig: config } : p));
    const patient = patients.find(p => p.id === patientId);
    addAuditEntry(patientId, 'aid_config_updated', `AID config updated for ${patient?.name ?? 'patient'} — target ${config.targetGlucose} mg/dL, max bolus ${config.maxMicroBolus}U`);
  };

  const handleApplyAutotuning = (rec: AutotuningRecommendation, newConfig: AIDConfig) => {
    setPatients(prev => prev.map(p => p.id === rec.patientId ? { ...p, aidConfig: newConfig } : p));
    setAutotuningRecs(prev => [...prev, { ...rec, status: 'applied', resolvedAt: new Date().toISOString() }]);
    const patient = patients.find(p => p.id === rec.patientId);
    addAuditEntry(rec.patientId, 'autotuning_applied', `${rec.paramType.toUpperCase()} autotuning applied for ${patient?.name ?? 'patient'} — ${rec.timeWindow}: ${rec.currentVal} → ${rec.recommendedVal} (${rec.percentChange > 0 ? '+' : ''}${rec.percentChange}%, confidence ${rec.confidenceScore}%)`);
  };

  const handleDismissAutotuning = (recId: string, note: string) => {
    setAutotuningRecs(prev => prev.map(r => r.id === recId ? { ...r, status: 'dismissed', dismissedNote: note, resolvedAt: new Date().toISOString() } : r));
    const rec = autotuningRecs.find(r => r.id === recId);
    if (rec) addAuditEntry(rec.patientId, 'autotuning_dismissed', `${rec.paramType.toUpperCase()} autotuning recommendation dismissed — ${rec.timeWindow}. Clinical note: ${note}`);
  };

  // Patient-side handlers
  const handleAcceptPlan = () => {
    if (!planNotification) return;
    setParams({ ...planNotification.params });
    showToast('Clinician plan applied to active simulation', 'success');
    setPlanNotification(null);
  };

  const handleRequestClarification = () => {
    if (!planNotification) return;
    setChats(prev => [...prev, { id: crypto.randomUUID(), patientId: 'demo-patient', author: 'patient', text: `Requesting clarification on prescribed plan: ${planNotification.note}`, timestamp: new Date().toISOString() }]);
    showToast('Clarification request sent to your clinician', 'info');
    setPlanNotification(null);
  };

  const showAuthPrompt = !user && !isDemo;
  const patientNotes = notes.filter(n => n.patientId === 'demo-patient' || n.patientId === 'p-alex');
  const patientMessages = chats.filter(c => c.patientId === 'demo-patient' || c.patientId === 'p-alex');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <TopBar onAuthClick={() => setAuthOpen(true)} role={role} onRoleChange={setRole} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <PatientConfirmModal notification={planNotification} onAccept={handleAcceptPlan} onRequestClarification={handleRequestClarification} onDismiss={() => setPlanNotification(null)} />

      {showAuthPrompt ? (
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight">Welcome to GlucoTwin</h2>
          <p className="mb-6 max-w-md text-slate-500 dark:text-slate-400">Your Metabolic &amp; Glucose Control Digital Twin. Sign in to sync your patient profile and simulation history to the cloud, or jump straight in as a demo patient.</p>
          <button onClick={() => setAuthOpen(true)} className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:from-teal-600 hover:to-cyan-700">Get Started</button>
        </div>
      ) : role === 'doctor' ? (
        <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <DoctorDashboard
            dark={theme === 'dark'} patients={patients} notes={notes} chats={chats} prescriptions={prescriptions}
            handoffNotes={handoffNotes} tasks={tasks} auditEntries={auditEntries}
            onAddNote={handleAddNote} onPushPlan={handlePushPlan} onSendChat={handleSendChat}
            onAddPrescription={handleAddPrescription} onToggleFlag={handleToggleFlag} onBroadcastTip={handleBroadcastTip}
            onAddHandoffNote={handleAddHandoffNote} onAssignTask={handleAssignTask} onToggleTask={handleToggleTask}
            onSaveAidConfig={handleSaveAidConfig}
            autotuningRecs={autotuningRecs}
            onApplyAutotuning={handleApplyAutotuning}
            onDismissAutotuning={handleDismissAutotuning}
          />
          <footer className="pt-4 pb-8 text-center text-xs text-slate-400 dark:text-slate-600">GlucoTwin Clinician Portal — for educational simulation purposes only. Not a substitute for professional medical judgment.</footer>
        </main>
      ) : (
        <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2"><ProfileBanner /></div>
            <div className="lg:col-span-1"><ArchetypeSwitcher archetype={archetype} onSelect={setArchetype} /></div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5">
              <ControlPanel params={params} onChange={setParams} onSave={handleSave} saving={saving} isConfigured={isConfigured && Boolean(user)} />
              <ScenarioComparison
                compareMode={compareMode}
                onToggleCompare={() => { setCompareMode(v => !v); if (compareMode) setScenarioAPinned(null); }}
                scenarioA={scenarioAPinned} scenarioB={scenarioBStats} onPinA={handlePinA} onClearA={handleClearA}
              />
            </div>
            <div className="space-y-5 lg:col-span-2">
              <GlucoseChart data={chartData} dark={theme === 'dark'} compareMode={compareMode && Boolean(scenarioAPinned)} />
              <CGMMetricsPanel metrics={cgmMetrics} dark={theme === 'dark'} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <InsightsPanel risk={risk} peak={peak} advisory={advisory} />
            <HistoryTable runs={runs} onExportPdf={handleExportPdf} onExportJson={handleExportJson} />
          </div>

          {/* Clinician Notes Archive toggle */}
          <div>
            <button onClick={() => setShowArchive(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showArchive ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
              {showArchive ? 'Hide' : 'Show'} Clinician Notes Archive
            </button>
            {showArchive && (
              <div className="mt-3">
                <ClinicianNotesArchive notes={patientNotes} messages={patientMessages} prescriptions={prescriptions.filter(p => p.patientId === 'p-alex' || p.patientId === 'demo-patient')} />
              </div>
            )}
          </div>

          <footer className="pt-4 pb-8 text-center text-xs text-slate-400 dark:text-slate-600">GlucoTwin is a simulation tool for educational purposes and does not constitute medical advice. Always consult your healthcare provider.</footer>
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <GlucoTwinApp />
      </ToastProvider>
    </AuthProvider>
  );
}
