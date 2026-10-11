import {
  DoctorPatient,
  SimParams,
  SimulationRun,
  TriageRisk,
  TriageFilter,
  SortField,
  AnomalyDetection,
  ClinicalNote,
  ChatMessage,
  Prescription,
  ARCHETYPES,
  WearableMetrics,
  AIDConfig,
  CareTeamMember,
  HandoffNote,
  HandoffTask,
  AuditEntry,
  EarlyWarningPrediction,
  AutotuningRecommendation,
} from './types';
import { computeEarlyWarning, DEFAULT_AID_CONFIG } from './glucoseEngine';

function makeRun(userId: string, carbs: number, walk: number, sleep: number, peak: number, risk: SimulationRun['risk_level'], daysAgo: number): SimulationRun {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { id: `${userId}-run-${daysAgo}`, user_id: userId, carbs_g: carbs, walk_mins: walk, sleep_hrs: sleep, projected_peak_mgdl: peak, risk_level: risk, created_at: d.toISOString() };
}

const baseParams: SimParams = { carbs_g: 45, walk_mins: 15, sleep_hrs: 7, protein_g: 20, fat_g: 15, exercise_timing: 'after' };

function wear(sleep: number, hr: number, stress: number, source: WearableMetrics['source']): WearableMetrics {
  return { sleepScore: sleep, restingHr: hr, stressScore: stress, source, recordedAt: new Date().toISOString() };
}

const aidCfg: AIDConfig = { ...DEFAULT_AID_CONFIG };

const INITIAL_PATIENTS: DoctorPatient[] = [
  {
    id: 'p-alex', name: 'Alex Rivera', age: 34, weightKg: 74, hba1c: 5.6, fastingGlucose: 92,
    archetypeId: 'standard', diabetesType: 'Type 2 (GLP-1)', tir: 82, recentPeak: 138,
    riskLevel: 'Optimal', lastVisit: '2026-09-28', lastActivity: '2026-10-07', flagged: false,
    params: { ...baseParams },
    wearable: wear(78, 62, 35, 'Oura'), aidConfig: null,
    history: [
      makeRun('p-alex', 45, 15, 7, 138, 'Optimal', 1),
      makeRun('p-alex', 60, 10, 6.5, 162, 'Moderate Spike Risk', 4),
      makeRun('p-alex', 30, 25, 7.5, 118, 'Optimal', 7),
    ],
  },
  {
    id: 'p-sarah', name: 'Sarah Jenkins', age: 47, weightKg: 68, hba1c: 6.2, fastingGlucose: 105,
    archetypeId: 'prediabetic', diabetesType: 'LADA', tir: 58, recentPeak: 178,
    riskLevel: 'Moderate', lastVisit: '2026-09-22', lastActivity: '2026-10-06', flagged: false,
    params: { ...baseParams, carbs_g: 65, walk_mins: 10, sleep_hrs: 6, fat_g: 25 },
    wearable: wear(52, 71, 72, 'Whoop'), aidConfig: null,
    history: [
      makeRun('p-sarah', 65, 10, 6, 178, 'Moderate Spike Risk', 2),
      makeRun('p-sarah', 70, 5, 5.5, 195, 'Severe Excursion Risk', 5),
      makeRun('p-sarah', 50, 20, 7, 152, 'Moderate Spike Risk', 9),
    ],
  },
  {
    id: 'p-david', name: 'David Chen', age: 52, weightKg: 81, hba1c: 6.8, fastingGlucose: 112,
    archetypeId: 'prediabetic', diabetesType: 'Type 2 (GLP-1)', tir: 41, recentPeak: 205,
    riskLevel: 'High Risk', lastVisit: '2026-09-15', lastActivity: '2026-10-05', flagged: true,
    params: { ...baseParams, carbs_g: 75, walk_mins: 5, sleep_hrs: 5, fat_g: 30, protein_g: 10 },
    wearable: wear(45, 78, 78, 'Apple Watch'), aidConfig: null,
    history: [
      makeRun('p-david', 75, 5, 5, 205, 'Severe Excursion Risk', 3),
      makeRun('p-david', 80, 0, 4.5, 218, 'Severe Excursion Risk', 6),
      makeRun('p-david', 60, 15, 6, 172, 'Moderate Spike Risk', 10),
    ],
  },
  {
    id: 'p-maria', name: 'Maria Gonzalez', age: 29, weightKg: 62, hba1c: 5.4, fastingGlucose: 85,
    archetypeId: 'athletic', diabetesType: 'Type 1 (AID)', tir: 88, recentPeak: 125,
    riskLevel: 'Optimal', lastVisit: '2026-10-01', lastActivity: '2026-10-07', flagged: false,
    params: { ...baseParams, carbs_g: 35, walk_mins: 25, sleep_hrs: 8 },
    wearable: wear(88, 55, 25, 'Oura'), aidConfig: { ...aidCfg },
    history: [
      makeRun('p-maria', 35, 25, 8, 125, 'Optimal', 1),
      makeRun('p-maria', 40, 20, 7.5, 132, 'Optimal', 4),
      makeRun('p-maria', 50, 15, 7, 145, 'Moderate Spike Risk', 8),
    ],
  },
  {
    id: 'p-james', name: 'James Wilson', age: 38, weightKg: 95, hba1c: 7.4, fastingGlucose: 130,
    archetypeId: 'prediabetic', diabetesType: 'High Variability', tir: 34, recentPeak: 232,
    riskLevel: 'High Risk', lastVisit: '2026-09-10', lastActivity: '2026-10-04', flagged: false,
    params: { ...baseParams, carbs_g: 85, walk_mins: 0, sleep_hrs: 4.5, fat_g: 35, protein_g: 8 },
    wearable: wear(38, 82, 85, 'Fitbit'), aidConfig: null,
    history: [
      makeRun('p-james', 85, 0, 4.5, 232, 'Severe Excursion Risk', 2),
      makeRun('p-james', 70, 10, 5.5, 188, 'Severe Excursion Risk', 5),
      makeRun('p-james', 90, 5, 4, 245, 'Severe Excursion Risk', 9),
    ],
  },
  {
    id: 'p-emily', name: 'Emily Park', age: 33, weightKg: 58, hba1c: 5.8, fastingGlucose: 98,
    archetypeId: 'standard', diabetesType: 'Gestational', tir: 65, recentPeak: 165,
    riskLevel: 'Moderate', lastVisit: '2026-09-25', lastActivity: '2026-10-06', flagged: false,
    params: { ...baseParams, carbs_g: 55, walk_mins: 20, sleep_hrs: 7.5, protein_g: 25 },
    wearable: wear(68, 67, 52, 'Apple Watch'), aidConfig: null,
    history: [
      makeRun('p-emily', 55, 20, 7.5, 165, 'Moderate Spike Risk', 1),
      makeRun('p-emily', 60, 15, 7, 172, 'Moderate Spike Risk', 4),
      makeRun('p-emily', 45, 25, 8, 142, 'Moderate Spike Risk', 7),
    ],
  },
];

export const ANOMALIES: AnomalyDetection[] = [
  { id: 'a-1', patientId: 'p-david', severity: 'critical', label: 'Frequent nocturnal hypoglycemia', description: 'Detected over past 3 nights — glucose dipping below 60 mg/dL between 02:00-04:00' },
  { id: 'a-2', patientId: 'p-james', severity: 'critical', label: 'Post-prandial spikes >250 mg/dL at lunch', description: 'Consistent pattern over past 5 days at 13:00 — immediate carb reduction advised' },
  { id: 'a-3', patientId: 'p-sarah', severity: 'warning', label: 'Elevated dawn phenomenon', description: 'Fasting glucose trending upward 12% over past week — consider adjusting basal timing' },
  { id: 'a-4', patientId: 'p-emily', severity: 'warning', label: 'Gestational post-breakfast excursions', description: 'Morning peaks exceeding 160 mg/dL — review breakfast carbohydrate load' },
  { id: 'a-5', patientId: 'p-alex', severity: 'warning', label: 'Weekend variability increase', description: 'CV% rises from 22% to 31% on weekends — lifestyle pattern disruption detected' },
];

export const CARE_TEAM: CareTeamMember[] = [
  { id: 'ct-1', name: 'Dr. Amara Okafor', role: 'Endocrinologist', initials: 'AO', color: 'bg-blue-500' },
  { id: 'ct-2', name: 'Sarah Kim, RD', role: 'Dietitian', initials: 'SK', color: 'bg-emerald-500' },
  { id: 'ct-3', name: 'Mike Torres, CDCES', role: 'CDCES', initials: 'MT', color: 'bg-teal-500' },
  { id: 'ct-4', name: 'Dr. James Patel', role: 'Primary Care', initials: 'JP', color: 'bg-indigo-500' },
];

export function getCareTeamMember(id: string): CareTeamMember | undefined {
  return CARE_TEAM.find(m => m.id === id);
}

const INITIAL_HANDOFF_NOTES: HandoffNote[] = [
  { id: 'hn-1', patientId: 'p-david', authorId: 'ct-1', authorName: 'Dr. Amara Okafor', authorRole: 'Endocrinologist', text: 'David\'s nocturnal hypo pattern needs basal rate reduction. Recommend decreasing overnight basal by 20% starting tonight. Tagging Dietitian for meal plan review.', taggedSpecialist: 'Dietitian', timestamp: '2026-10-05T09:30:00Z' },
  { id: 'hn-2', patientId: 'p-david', authorId: 'ct-2', authorName: 'Sarah Kim, RD', authorRole: 'Dietitian', text: 'Reviewed meal log — David\'s dinner carb load averaging 75g. Will adjust to 45g with 25g protein replacement. CDCES to follow up on CGM training.', taggedSpecialist: 'CDCES', timestamp: '2026-10-05T14:15:00Z' },
  { id: 'hn-3', patientId: 'p-james', authorId: 'ct-1', authorName: 'Dr. Amara Okafor', authorRole: 'Endocrinologist', text: 'James is non-compliant with post-meal walks. High variability persists. Considering GLP-1 dose escalation. Primary Care to verify insurance coverage.', taggedSpecialist: 'Primary Care', timestamp: '2026-10-04T11:00:00Z' },
  { id: 'hn-4', patientId: 'p-maria', authorId: 'ct-3', authorName: 'Mike Torres, CDCES', authorRole: 'CDCES', text: 'Maria\'s AID system is performing well — TIR 88%. Tuned target glucose from 120 to 110 for tighter control. No handoff needed, logging for audit.', taggedSpecialist: null, timestamp: '2026-10-06T10:45:00Z' },
  { id: 'hn-5', patientId: 'p-sarah', authorId: 'ct-1', authorName: 'Dr. Amara Okafor', authorRole: 'Endocrinologist', text: 'Sarah\'s LADA progression may require insulin initiation within 3-6 months. Dawn phenomenon worsening. Dietitian to plan low-glycemic breakfast options.', taggedSpecialist: 'Dietitian', timestamp: '2026-10-03T08:20:00Z' },
];

const INITIAL_TASKS: HandoffTask[] = [
  { id: 'ht-1', patientId: 'p-david', authorId: 'ct-1', assigneeRole: 'Dietitian', title: 'Reduce dinner carb load to 45g and document patient education', status: 'in_progress', dueDate: '2026-10-10', createdAt: '2026-10-05T09:35:00Z', completedAt: null },
  { id: 'ht-2', patientId: 'p-david', authorId: 'ct-2', assigneeRole: 'CDCES', title: 'Schedule CGM sensor replacement and insertion site rotation training', status: 'open', dueDate: '2026-10-12', createdAt: '2026-10-05T14:20:00Z', completedAt: null },
  { id: 'ht-3', patientId: 'p-james', authorId: 'ct-1', assigneeRole: 'Primary Care', title: 'Verify insurance coverage for GLP-1 dose escalation', status: 'open', dueDate: '2026-10-09', createdAt: '2026-10-04T11:05:00Z', completedAt: null },
  { id: 'ht-4', patientId: 'p-sarah', authorId: 'ct-1', assigneeRole: 'Dietitian', title: 'Develop low-glycemic breakfast plan to address dawn phenomenon', status: 'completed', dueDate: '2026-10-07', createdAt: '2026-10-03T08:25:00Z', completedAt: '2026-10-06T16:00:00Z' },
];

const INITIAL_AUDIT: AuditEntry[] = [
  { id: 'au-1', patientId: 'p-maria', action: 'aid_config_updated', actorName: 'Mike Torres, CDCES', actorRole: 'CDCES', summary: 'AID target glucose adjusted from 120 to 110 mg/dL', timestamp: '2026-10-06T10:45:00Z' },
  { id: 'au-2', patientId: 'p-david', action: 'prescription_modified', actorName: 'Dr. Amara Okafor', actorRole: 'Endocrinologist', summary: 'Basal rate reduction of 20% recommended for nocturnal hypo prevention', timestamp: '2026-10-05T09:32:00Z' },
  { id: 'au-3', patientId: 'p-james', action: 'note_added', actorName: 'Dr. Amara Okafor', actorRole: 'Endocrinologist', summary: 'Documented non-compliance pattern and GLP-1 escalation consideration', timestamp: '2026-10-04T11:01:00Z' },
  { id: 'au-4', patientId: 'p-sarah', action: 'task_completed', actorName: 'Sarah Kim, RD', actorRole: 'Dietitian', summary: 'Completed low-glycemic breakfast plan development for dawn phenomenon', timestamp: '2026-10-06T16:01:00Z' },
];

const STORAGE_KEY = 'glucotwin-doctor-state';

interface DoctorPersistState {
  patients: DoctorPatient[];
  notes: ClinicalNote[];
  chats: ChatMessage[];
  prescriptions: Prescription[];
  handoffNotes: HandoffNote[];
  tasks: HandoffTask[];
  auditEntries: AuditEntry[];
  autotuningRecs: AutotuningRecommendation[];
}

export function loadDoctorState(): DoctorPersistState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DoctorPersistState>;
      return {
        patients: parsed.patients ?? INITIAL_PATIENTS,
        notes: parsed.notes ?? [],
        chats: parsed.chats ?? [],
        prescriptions: parsed.prescriptions ?? [],
        handoffNotes: parsed.handoffNotes ?? INITIAL_HANDOFF_NOTES,
        tasks: parsed.tasks ?? INITIAL_TASKS,
        auditEntries: parsed.auditEntries ?? INITIAL_AUDIT,
        autotuningRecs: parsed.autotuningRecs ?? [],
      };
    }
  } catch { /* ignore */ }
  return { patients: INITIAL_PATIENTS, notes: [], chats: [], prescriptions: [], handoffNotes: INITIAL_HANDOFF_NOTES, tasks: INITIAL_TASKS, auditEntries: INITIAL_AUDIT, autotuningRecs: [] };
}

export function saveDoctorState(state: DoctorPersistState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function getArchetypeByIdSync(id: string) {
  return ARCHETYPES.find(a => a.id === id) ?? ARCHETYPES[1];
}

export function filterAndSortPatients(
  patients: DoctorPatient[],
  filter: TriageFilter,
  sort: SortField,
): DoctorPatient[] {
  let filtered = [...patients];
  switch (filter) {
    case 'high-risk': filtered = filtered.filter(p => p.riskLevel === 'High Risk'); break;
    case 'urgent-tir': filtered = filtered.filter(p => p.tir < 70); break;
    case 'stable': filtered = filtered.filter(p => p.riskLevel === 'Optimal' && p.tir >= 70); break;
    case 'pre-crisis': {
      filtered = filtered.filter(p => {
        const arch = ARCHETYPES.find(a => a.id === p.archetypeId) ?? ARCHETYPES[1];
        const ew = computeEarlyWarning(p, arch);
        return ew.level === 'high' || ew.level === 'critical';
      });
      break;
    }
  }
  const riskOrder: Record<TriageRisk, number> = { 'High Risk': 0, 'Moderate': 1, 'Optimal': 2 };
  switch (sort) {
    case 'risk': filtered.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]); break;
    case 'hba1c': filtered.sort((a, b) => b.hba1c - a.hba1c); break;
    case 'tir': filtered.sort((a, b) => a.tir - b.tir); break;
    case 'activity': filtered.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()); break;
    case 'early-warning': {
      filtered.sort((a, b) => {
        const archA = ARCHETYPES.find(al => al.id === a.archetypeId) ?? ARCHETYPES[1];
        const archB = ARCHETYPES.find(al => al.id === b.archetypeId) ?? ARCHETYPES[1];
        return computeEarlyWarning(b, archB).combinedRisk - computeEarlyWarning(a, archA).combinedRisk;
      });
      break;
    }
  }
  return filtered;
}

export function getPatientName(patients: DoctorPatient[], id: string): string {
  return patients.find(p => p.id === id)?.name ?? 'Patient';
}
