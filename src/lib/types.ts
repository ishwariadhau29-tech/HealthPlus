export interface Profile {
  id: string;
  full_name: string | null;
  age: number | null;
  weight_kg: number | null;
  baseline_hba1c: number | null;
  fasting_glucose: number | null;
  updated_at: string | null;
}

export interface SimulationRun {
  id: string;
  user_id: string;
  carbs_g: number;
  walk_mins: number;
  sleep_hrs: number;
  projected_peak_mgdl: number;
  risk_level: RiskLevel;
  created_at: string;
}

export type RiskLevel = 'Optimal' | 'Moderate Spike Risk' | 'Severe Excursion Risk';

export type ExerciseTiming = 'before' | 'after';

export interface SimParams {
  carbs_g: number;
  walk_mins: number;
  sleep_hrs: number;
  protein_g: number;
  fat_g: number;
  exercise_timing: ExerciseTiming;
}

export interface GlucosePoint {
  hour: string;
  baseline: number;
  simulated: number;
  scenarioA?: number;
  scenarioB?: number;
}

export interface Archetype {
  id: string;
  label: string;
  description: string;
  fastingGlucose: number;
  clearanceRate: number;
  resistanceFactor: number;
  baseAmp: number;
  baseWidth: number;
}

export const ARCHETYPES: Archetype[] = [
  { id: 'athletic', label: 'Athletic / Insulin Sensitive', description: 'Fasting 80 mg/dL, steep clearance, low baseline resistance', fastingGlucose: 80, clearanceRate: 1.35, resistanceFactor: 0.85, baseAmp: 42, baseWidth: 1.3 },
  { id: 'standard', label: 'Standard Adult (Alex Rivera)', description: 'Fasting 92 mg/dL, moderate clearance', fastingGlucose: 92, clearanceRate: 1.0, resistanceFactor: 1.0, baseAmp: 55, baseWidth: 1.6 },
  { id: 'prediabetic', label: 'Prediabetic / Insulin Resistant', description: 'Fasting 110 mg/dL, elevated baseline, sluggish return', fastingGlucose: 110, clearanceRate: 0.7, resistanceFactor: 1.3, baseAmp: 68, baseWidth: 2.1 },
];

export interface CGMMetrics {
  tir: number;
  highPct: number;
  lowPct: number;
  sd: number;
  cv: number;
  ea1c: number;
  meanGlucose: number;
}

export interface ScenarioDelta {
  peakDelta: number;
  tirDelta: number;
}

export type AppRole = 'patient' | 'doctor';

export type TriageRisk = 'Optimal' | 'Moderate' | 'High Risk';

export type DiabetesType =
  | 'Type 1 (AID)'
  | 'Type 2 (GLP-1)'
  | 'Gestational'
  | 'LADA'
  | 'High Variability'
  | 'Post-Bariatric';

export interface ClinicalNote {
  id: string;
  patientId: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface PrescribedPlan {
  params: SimParams;
  archetypeId: string;
  note: string;
  pushedAt: string;
}

export interface ChatMessage {
  id: string;
  patientId: string;
  author: 'doctor' | 'patient';
  text: string;
  timestamp: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  carbRatio: number;
  proteinRatio: number;
  activityWindow: string;
  lowAlertMgDl: number;
  highAlertMgDl: number;
  rationale: string;
  createdAt: string;
}

export interface VirtualTrialResult {
  day: number;
  tir: number;
  peak: number;
  meanGlucose: number;
}

export interface AnomalyDetection {
  id: string;
  patientId: string;
  severity: 'warning' | 'critical';
  label: string;
  description: string;
}

export interface DoctorPatient {
  id: string;
  name: string;
  age: number;
  weightKg: number;
  hba1c: number;
  fastingGlucose: number;
  archetypeId: string;
  diabetesType: DiabetesType;
  tir: number;
  recentPeak: number;
  riskLevel: TriageRisk;
  lastVisit: string;
  lastActivity: string;
  flagged: boolean;
  params: SimParams;
  history: SimulationRun[];
  wearable: WearableMetrics | null;
  aidConfig: AIDConfig | null;
}

export type TriageFilter = 'all' | 'high-risk' | 'urgent-tir' | 'stable' | 'pre-crisis';
export type SortField = 'risk' | 'hba1c' | 'tir' | 'activity' | 'early-warning';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

export interface PatientPlanNotification {
  patientName: string;
  params: SimParams;
  note: string;
  prescription?: Prescription;
  chatMessage?: string;
  timestamp: string;
}

export const DEFAULT_PROFILE: Profile = {
  id: 'demo-patient',
  full_name: 'Alex Rivera',
  age: 34,
  weight_kg: 74,
  baseline_hba1c: 5.6,
  fasting_glucose: 92,
  updated_at: null,
};

export const DEFAULT_PARAMS: SimParams = {
  carbs_g: 45,
  walk_mins: 15,
  sleep_hrs: 7,
  protein_g: 20,
  fat_g: 15,
  exercise_timing: 'after',
};

export const DEFAULT_ARCHETYPE = ARCHETYPES[1];

export interface WearableMetrics {
  sleepScore: number;
  restingHr: number;
  stressScore: number;
  source: 'Oura' | 'Whoop' | 'Apple Watch' | 'Fitbit';
  recordedAt: string;
}

export type EarlyWarningLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface EarlyWarningPrediction {
  patientId: string;
  hypoRisk: number;
  hyperRisk: number;
  combinedRisk: number;
  level: EarlyWarningLevel;
  velocity: number;
  acceleration: number;
  projectedGlucose: number;
  hoursAhead: number;
  trend: 'rising' | 'falling' | 'stable';
  recommendation: string;
}

export interface PumpTelemetryPoint {
  time: string;
  glucose: number;
  basalRate: number;
  bolusAmount: number;
  iob: number;
  status: 'normal' | 'basal_suspended' | 'auto_correction' | 'predictive_low';
}

export interface AIDConfig {
  targetGlucose: number;
  targetRangeLow: number;
  targetRangeHigh: number;
  maxMicroBolus: number;
  basalSuspendThreshold: number;
  predictiveLowCutoff: number;
}

export type SpecialistRole = 'Endocrinologist' | 'Dietitian' | 'CDCES' | 'Primary Care';

export interface CareTeamMember {
  id: string;
  name: string;
  role: SpecialistRole;
  initials: string;
  color: string;
}

export interface HandoffNote {
  id: string;
  patientId: string;
  authorId: string;
  authorName: string;
  authorRole: SpecialistRole;
  text: string;
  taggedSpecialist: SpecialistRole | null;
  timestamp: string;
}

export type HandoffTaskStatus = 'open' | 'in_progress' | 'completed';

export interface HandoffTask {
  id: string;
  patientId: string;
  authorId: string;
  assigneeRole: SpecialistRole;
  title: string;
  status: HandoffTaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
}

export type AuditAction =
  | 'plan_pushed' | 'prescription_created' | 'prescription_modified'
  | 'note_added' | 'message_sent' | 'flag_toggled' | 'broadcast_sent'
  | 'aid_config_updated' | 'task_assigned' | 'task_completed'
  | 'autotuning_applied' | 'autotuning_dismissed';

export interface AuditEntry {
  id: string;
  patientId: string;
  action: AuditAction;
  actorName: string;
  actorRole: SpecialistRole;
  summary: string;
  timestamp: string;
}

export type TuningParamType = 'basal' | 'isf' | 'icr';

export type TuningStatus = 'pending' | 'applied' | 'dismissed';

export interface AutotuningRecommendation {
  id: string;
  patientId: string;
  paramType: TuningParamType;
  timeWindow: string;
  currentVal: number;
  recommendedVal: number;
  percentChange: number;
  confidenceScore: number;
  reasoning: string;
  safetyFlag: 'safe' | 'caution' | 'review_required';
  status: TuningStatus;
  dismissedNote: string | null;
  dataSufficiency: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface MealMacroAnalysis {
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  calories: number;
  label: string;
}

export type MealPresetId = 'pasta' | 'keto' | 'burger';

export interface MealPreset {
  id: MealPresetId;
  label: string;
  description: string;
  macros: MealMacroAnalysis;
}

export interface XaiAttribution {
  label: string;
  impact: number;
  color: 'red' | 'amber' | 'green' | 'gray';
}

export type CGMStreamMode = 'off' | 'stable' | 'spike' | 'hypo';

export interface CGMLiveReading {
  value: number;
  trend: 'rising' | 'falling' | 'stable';
  timestamp: string;
}

export type CrisisStatus = 'none' | 'active';

export interface CrisisAlert {
  patientId: string;
  glucose: number;
  timestamp: string;
  status: CrisisStatus;
}

export interface SBARSummary {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

export type SafetyCheckStatus = 'verified' | 'warning';

export interface SafetyCheckResult {
  status: SafetyCheckStatus;
  messages: string[];
}

export interface CalibrationPoint {
  day: number;
  isf: number;
  icr: number;
}

export interface ArchitectureModalTab {
  id: 'data-flow' | 'clinical-impact';
}
