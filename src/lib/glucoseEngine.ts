import {
  GlucosePoint,
  RiskLevel,
  SimParams,
  Archetype,
  CGMMetrics,
  DEFAULT_ARCHETYPE,
  ARCHETYPES,
  WearableMetrics,
  EarlyWarningPrediction,
  EarlyWarningLevel,
  PumpTelemetryPoint,
  AIDConfig,
  DoctorPatient,
  AutotuningRecommendation,
} from './types';

const MEAL_TIMES = [8, 13, 19];

function gaussian(hour: number, center: number, amplitude: number, width: number): number {
  const d = hour - center;
  return amplitude * Math.exp(-(d * d) / (2 * width * width));
}

function fatDelayHours(fatG: number): number {
  if (fatG <= 20) return 0;
  const extra = fatG - 20;
  return Math.min(1.25, (extra / 30) * 1.25);
}

function fatWidthBroadening(fatG: number): number {
  if (fatG <= 20) return 0;
  const extra = fatG - 20;
  return Math.min(1.0, (extra / 30) * 1.0);
}

function proteinBuffering(proteinG: number): number {
  return Math.min(18, proteinG * 0.25);
}

function exerciseEffectiveness(params: SimParams): number {
  return params.exercise_timing === 'after' ? 1.0 : 1 / 2.2;
}

export function computePeak(
  params: SimParams,
  archetype: Archetype = DEFAULT_ARCHETYPE,
): number {
  const carbScale = params.carbs_g / 45;
  const walkEff = exerciseEffectiveness(params);
  const walkSuppression = Math.min(1, params.walk_mins / 30) * 35 * walkEff;
  const sleepPenalty = params.sleep_hrs < 7 ? ((7 - params.sleep_hrs) / 3) * 25 : 0;
  const proteinBuf = proteinBuffering(params.protein_g);
  const resistance = archetype.resistanceFactor;

  const basePeak = 135 * resistance;
  const carbContribution = (carbScale - 1) * 50 * resistance;
  const peak =
    basePeak +
    carbContribution +
    sleepPenalty -
    walkSuppression -
    proteinBuf;

  return Math.round(Math.max(60, peak));
}

export function classifyRisk(peak: number): RiskLevel {
  if (peak > 180) return 'Severe Excursion Risk';
  if (peak >= 140) return 'Moderate Spike Risk';
  return 'Optimal';
}

export function generateGlucoseCurve(
  params: SimParams,
  archetype: Archetype = DEFAULT_ARCHETYPE,
): GlucosePoint[] {
  const points: GlucosePoint[] = [];
  const fasting = archetype.fastingGlucose;
  const carbScale = params.carbs_g / 45;

  const walkEff = exerciseEffectiveness(params);
  const walkSuppression = Math.min(1, params.walk_mins / 30) * 28 * walkEff;
  const sleepPenalty = params.sleep_hrs < 7 ? ((7 - params.sleep_hrs) / 3) * 0.22 : 0;

  const delay = fatDelayHours(params.fat_g);
  const widthExtra = fatWidthBroadening(params.fat_g);
  const proteinBuf = proteinBuffering(params.protein_g);

  const baseAmp = archetype.baseAmp;
  const baseWidth = archetype.baseWidth;

  const simAmp =
    baseAmp * carbScale * archetype.resistanceFactor -
    walkSuppression +
    sleepPenalty * 40 -
    proteinBuf;
  const simWidth = Math.max(
    0.7,
    baseWidth - params.walk_mins * 0.012 / archetype.clearanceRate + widthExtra,
  );
  const simBase = fasting * (1 + sleepPenalty) * archetype.resistanceFactor;

  for (let h = 0; h <= 23; h++) {
    let baseline = fasting;
    let simulated = simBase;

    for (const meal of MEAL_TIMES) {
      baseline += gaussian(h, meal, baseAmp, baseWidth);
      simulated += gaussian(h, meal + delay, Math.max(8, simAmp), simWidth);
    }

    points.push({
      hour: `${String(h).padStart(2, '0')}:00`,
      baseline: Math.round(baseline),
      simulated: Math.round(Math.max(50, simulated)),
    });
  }

  return points;
}

export function generateBaselineCurve(archetype: Archetype = DEFAULT_ARCHETYPE): GlucosePoint[] {
  const points: GlucosePoint[] = [];
  const fasting = archetype.fastingGlucose;

  for (let h = 0; h <= 23; h++) {
    let baseline = fasting;
    for (const meal of MEAL_TIMES) {
      baseline += gaussian(h, meal, archetype.baseAmp, archetype.baseWidth);
    }
    points.push({
      hour: `${String(h).padStart(2, '0')}:00`,
      baseline: Math.round(baseline),
      simulated: Math.round(baseline),
    });
  }
  return points;
}

export function computeCGMMetrics(curve: GlucosePoint[]): CGMMetrics {
  const values = curve.map((p) => p.simulated);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;
  const ea1c = (mean + 46.7) / 28.7;

  let inRange = 0;
  let high = 0;
  let low = 0;
  for (const v of values) {
    if (v < 70) low++;
    else if (v > 140) high++;
    else inRange++;
  }

  return {
    tir: Math.round((inRange / n) * 100),
    highPct: Math.round((high / n) * 100),
    lowPct: Math.round((low / n) * 100),
    sd: Math.round(sd * 10) / 10,
    cv: Math.round(cv * 10) / 10,
    ea1c: Math.round(ea1c * 10) / 10,
    meanGlucose: Math.round(mean),
  };
}

export function generateAdvisory(params: SimParams, peak: number): string {
  if (peak <= 140) {
    return `Projected glucose stays within the safe glycemic window (peak ${peak} mg/dL). Your current meal composition and activity level support stable postprandial control.`;
  }

  const tips: string[] = [];

  if (params.carbs_g > 50) {
    const excess = params.carbs_g - 45;
    tips.push(
      `Reducing carbohydrate intake by ${excess}g could lower the predicted peak by ~${Math.round(excess * 1.1)} mg/dL.`,
    );
  }

  if (params.walk_mins < 25) {
    const added = 25 - params.walk_mins;
    const factor = params.exercise_timing === 'after' ? 1.5 : 0.68;
    tips.push(
      `Extending your post-meal walk by ${added} min reduces the predicted peak by ~${Math.round(added * factor)} mg/dL. Post-meal exercise is ${params.exercise_timing === 'after' ? 'already' : '2.2x more'} effective via GLUT4 activation.`,
    );
  } else if (params.exercise_timing === 'before') {
    tips.push(`Switching to post-meal walking is 2.2x more effective at clearing peak glucose via muscle GLUT4 activation.`);
  }

  if (params.sleep_hrs < 7) {
    const deficit = (7 - params.sleep_hrs).toFixed(1);
    tips.push(
      `Sleeping ${deficit} hrs below the 7-hour target shifts your baseline upward, increasing insulin resistance. Prioritizing a full night's rest can lower fasting glucose by ~8–12 mg/dL.`,
    );
  }

  if (params.fat_g > 20) {
    const delayMin = Math.round(fatDelayHours(params.fat_g) * 60);
    tips.push(
      `High dietary fat (${params.fat_g}g) delays time-to-peak by ~${delayMin} min and broadens the postprandial curve ("pizza effect"). Consider lower-fat alternatives to sharpen glucose clearance.`,
    );
  }

  if (params.protein_g < 15 && peak > 160) {
    tips.push(`Increasing protein intake to 20–30g can provide mild delayed insulinogenic buffering, softening the postprandial rise.`);
  }

  if (tips.length === 0) {
    return `Projected peak of ${peak} mg/dL exceeds the target range. Consider redistributing carbohydrates across meals or adding a brief midday walk.`;
  }

  return `High excursion projected (peak ${peak} mg/dL). ${tips.join(' ')}`;
}

const WEARABLE_DEFAULTS: WearableMetrics = {
  sleepScore: 75, restingHr: 62, stressScore: 40, source: 'Oura', recordedAt: new Date().toISOString(),
};

export function getWearableImpact(w: WearableMetrics): {
  resistanceMultiplier: number;
  excursionMultiplier: number;
  label: string;
} {
  const sleepFactor = w.sleepScore < 60 ? 1.12 : w.sleepScore < 75 ? 1.05 : 1.0;
  const stressFactor = w.stressScore > 70 ? 1.08 : w.stressScore > 55 ? 1.04 : 1.0;
  const hrFactor = w.restingHr > 75 ? 1.04 : 1.0;
  const resistanceMultiplier = sleepFactor * stressFactor * hrFactor;
  const excursionMultiplier = w.sleepScore < 60 ? 1.15 : w.sleepScore < 70 ? 1.08 : 1.0;
  let label = 'Normal';
  if (w.sleepScore < 60 || w.stressScore > 70) label = 'High insulin resistance';
  else if (w.sleepScore < 75 || w.stressScore > 55) label = 'Mild resistance';
  return { resistanceMultiplier, excursionMultiplier, label };
}

export function generateGlucoseCurveWithWearable(
  params: SimParams,
  archetype: Archetype = DEFAULT_ARCHETYPE,
  wearable: WearableMetrics | null,
): GlucosePoint[] {
  const baseCurve = generateGlucoseCurve(params, archetype);
  if (!wearable) return baseCurve;
  const impact = getWearableImpact(wearable);
  return baseCurve.map((p) => ({
    ...p,
    simulated: Math.round(Math.max(50, p.simulated * impact.resistanceMultiplier)),
  }));
}

export function computeEarlyWarning(
  patient: DoctorPatient,
  archetype: Archetype,
): EarlyWarningPrediction {
  const curve = generateGlucoseCurve(patient.params, archetype);
  const values = curve.map((p) => p.simulated);

  const halfLen = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, halfLen);
  const secondHalf = values.slice(halfLen);
  const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const velocity = (secondMean - firstMean) / halfLen;

  const thirdLen = Math.floor(values.length / 3);
  const t1 = values.slice(0, thirdLen).reduce((a, b) => a + b, 0) / thirdLen;
  const t2 = values.slice(thirdLen, thirdLen * 2).reduce((a, b) => a + b, 0) / thirdLen;
  const t3 = values.slice(thirdLen * 2).reduce((a, b) => a + b, 0) / thirdLen;
  const accel1 = t2 - t1;
  const accel2 = t3 - t2;
  const acceleration = accel2 - accel1;

  const hoursAhead = 4;
  const lastVal = values[values.length - 1];
  const projectedGlucose = Math.round(Math.max(40, Math.min(300, lastVal + velocity * hoursAhead + 0.5 * acceleration * hoursAhead)));

  let hypoRisk = 0;
  let hyperRisk = 0;

  if (projectedGlucose < 70) {
    hypoRisk = Math.min(100, ((70 - projectedGlucose) / 30) * 100);
  }
  if (projectedGlucose > 180) {
    hyperRisk = Math.min(100, ((projectedGlucose - 180) / 70) * 100);
  }

  if (acceleration < -3 && projectedGlucose < 90) hypoRisk = Math.max(hypoRisk, 65);
  if (acceleration > 5 && projectedGlucose > 140) hyperRisk = Math.max(hyperRisk, 70);

  if (patient.wearable && patient.wearable.sleepScore < 55) hyperRisk = Math.min(100, hyperRisk + 10);
  if (patient.wearable && patient.wearable.stressScore > 75) hyperRisk = Math.min(100, hyperRisk + 8);

  const combinedRisk = Math.round(Math.max(hypoRisk, hyperRisk));

  let level: EarlyWarningLevel = 'low';
  if (combinedRisk >= 75) level = 'critical';
  else if (combinedRisk >= 50) level = 'high';
  else if (combinedRisk >= 25) level = 'moderate';

  const trend: 'rising' | 'falling' | 'stable' =
    velocity > 0.8 ? 'rising' : velocity < -0.8 ? 'falling' : 'stable';

  let recommendation: string;
  if (hypoRisk > hyperRisk) {
    recommendation = `Predicted glucose declining toward ${projectedGlucose} mg/dL in ${hoursAhead}h. Consider preemptive 15g fast-acting carb intake and verify basal rate. Suspend pump if IOB > 1.5U.`;
  } else if (hyperRisk > hypoRisk) {
    recommendation = `Predicted glucose rising toward ${projectedGlucose} mg/dL in ${hoursAhead}h. Recommend 20-min post-meal walk, verify correction bolus delivery, and reduce next-meal carbs by 15g.`;
  } else {
    recommendation = `Glucose trajectory stable at ${projectedGlucose} mg/dL. No preventive intervention required at this time. Continue current regimen.`;
  }

  return {
    patientId: patient.id,
    hypoRisk: Math.round(hypoRisk),
    hyperRisk: Math.round(hyperRisk),
    combinedRisk,
    level,
    velocity: Math.round(velocity * 100) / 100,
    acceleration: Math.round(acceleration * 100) / 100,
    projectedGlucose,
    hoursAhead,
    trend,
    recommendation,
  };
}

export function simulatePumpTelemetry(
  patient: DoctorPatient,
  config: AIDConfig,
): PumpTelemetryPoint[] {
  const arch = { fastingGlucose: patient.fastingGlucose, clearanceRate: 1.35, resistanceFactor: 0.85, baseAmp: 42, baseWidth: 1.3 } as Archetype;
  const curve = generateGlucoseCurve(patient.params, arch);
  const points: PumpTelemetryPoint[] = [];
  let iob = 0;
  let basalActive = true;

  for (let i = 0; i < curve.length; i++) {
    const glucose = curve[i].simulated;
    const time = curve[i].hour;

    if (glucose < config.basalSuspendThreshold) {
      basalActive = false;
      iob = Math.max(0, iob - 0.3);
    } else if (glucose < config.predictiveLowCutoff && i > 0 && curve[i - 1].simulated > glucose) {
      basalActive = false;
      iob = Math.max(0, iob - 0.2);
    } else {
      basalActive = true;
    }

    let bolusAmount = 0;
    if (glucose > config.targetRangeHigh && basalActive) {
      const excess = glucose - config.targetGlucose;
      bolusAmount = Math.min(config.maxMicroBolus, Math.round((excess / 50) * 10) / 10);
      iob += bolusAmount;
    }

    iob = Math.max(0, iob - 0.15);

    let status: PumpTelemetryPoint['status'] = 'normal';
    if (!basalActive && glucose < config.basalSuspendThreshold) status = 'basal_suspended';
    else if (!basalActive) status = 'predictive_low';
    else if (bolusAmount > 0) status = 'auto_correction';

    points.push({
      time,
      glucose,
      basalRate: basalActive ? 0.9 : 0,
      bolusAmount,
      iob: Math.round(iob * 100) / 100,
      status,
    });
  }

  return points;
}

export const DEFAULT_AID_CONFIG: AIDConfig = {
  targetGlucose: 110,
  targetRangeLow: 80,
  targetRangeHigh: 140,
  maxMicroBolus: 3.0,
  basalSuspendThreshold: 70,
  predictiveLowCutoff: 85,
};

const MAX_SHIFT_PERCENT = 10;
const MIN_WEAR_TIME = 80;

const TIME_WINDOWS = [
  { label: 'Overnight (00:00–06:00)', start: 0, end: 6 },
  { label: 'Morning (06:00–11:00)', start: 6, end: 11 },
  { label: 'Afternoon (11:00–17:00)', start: 11, end: 17 },
  { label: 'Evening (17:00–23:00)', start: 17, end: 23 },
];

function clampShift(current: number, target: number): number {
  const maxChange = current * (MAX_SHIFT_PERCENT / 100);
  const diff = target - current;
  if (Math.abs(diff) <= maxChange) return target;
  return current + Math.sign(diff) * maxChange;
}

function calcDataSufficiency(patient: DoctorPatient): number {
  const historyDays = patient.history.length;
  const baseWear = Math.min(95, 60 + historyDays * 5);
  if (patient.wearable) {
    return Math.min(98, baseWear + 10);
  }
  return baseWear;
}

export function computeAutotuningRecommendations(patient: DoctorPatient): AutotuningRecommendation[] {
  const arch = ARCHETYPES.find(a => a.id === patient.archetypeId) ?? DEFAULT_ARCHETYPE;
  const curve = generateGlucoseCurve(patient.params, arch);
  const cgmMetrics = computeCGMMetrics(curve);
  const dataSufficiency = calcDataSufficiency(patient);
  const recommendations: AutotuningRecommendation[] = [];

  if (dataSufficiency < MIN_WEAR_TIME) {
    return recommendations;
  }

  const now = new Date().toISOString();

  for (const tw of TIME_WINDOWS) {
    const windowPoints = curve.filter((_, i) => i >= tw.start && i < tw.end);
    if (windowPoints.length === 0) continue;

    const windowValues = windowPoints.map(p => p.simulated);
    const windowMean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
    const windowLow = windowValues.filter(v => v < 70).length / windowValues.length;
    const windowHigh = windowValues.filter(v => v > 180).length / windowValues.length;
    const windowLowCount = windowValues.filter(v => v < 70).length;
    const windowHighCount = windowValues.filter(v => v > 180).length;

    // Basal autotuning: detect chronic overnight lows or elevated fasting
    if (tw.start === 0 && (windowLow > 0.2 || (windowMean < 85 && windowLowCount > 0))) {
      const currentBasal = patient.aidConfig?.basalSuspendThreshold ?? 70;
      const targetBasal = Math.min(85, currentBasal + 5);
      const recommended = Math.round(clampShift(currentBasal, targetBasal));
      if (recommended !== currentBasal) {
        const pctChange = Math.round(((recommended - currentBasal) / currentBasal) * 1000) / 10;
        const confidence = Math.min(95, 60 + windowLowCount * 8);
        recommendations.push({
          id: `at-${patient.id}-basal-${tw.start}`,
          patientId: patient.id,
          paramType: 'basal',
          timeWindow: tw.label,
          currentVal: currentBasal,
          recommendedVal: recommended,
          percentChange: pctChange,
          confidenceScore: confidence,
          reasoning: `Chronic overnight hypoglycemia detected: ${windowLowCount} of ${windowValues.length} readings below 70 mg/dL in ${tw.label}. Mean glucose ${Math.round(windowMean)} mg/dL. Recommending basal suspend threshold increase to reduce automated insulin delivery during vulnerable window.`,
          safetyFlag: confidence > 80 ? 'safe' : 'caution',
          status: 'pending',
          dismissedNote: null,
          dataSufficiency,
          createdAt: now,
          resolvedAt: null,
        });
      }
    }

    // ISF (Insulin Sensitivity Factor) autotuning: detect persistent post-prandial spikes
    if (windowHigh > 0.3 && windowHighCount > 2) {
      const currentIsf = 50; // mg/dL per unit, default
      const targetIsf = Math.round(currentIsf * (1 - (windowHigh * 0.08)));
      const recommended = Math.round(clampShift(currentIsf, targetIsf));
      if (recommended !== currentIsf) {
        const pctChange = Math.round(((recommended - currentIsf) / currentIsf) * 1000) / 10;
        const confidence = Math.min(92, 55 + windowHighCount * 6);
        recommendations.push({
          id: `at-${patient.id}-isf-${tw.start}`,
          patientId: patient.id,
          paramType: 'isf',
          timeWindow: tw.label,
          currentVal: currentIsf,
          recommendedVal: recommended,
          percentChange: pctChange,
          confidenceScore: confidence,
          reasoning: `Persistent post-prandial hyperglycemia in ${tw.label}: ${windowHighCount} of ${windowValues.length} readings above 180 mg/dL. Mean glucose ${Math.round(windowMean)} mg/dL. Detected insulin resistance pattern — recommending ISF reduction (more insulin per mg/dL above target) to improve correction bolus effectiveness.`,
          safetyFlag: confidence > 75 ? 'safe' : 'caution',
          status: 'pending',
          dismissedNote: null,
          dataSufficiency,
          createdAt: now,
          resolvedAt: null,
        });
      }
    }

    // ICR (Insulin-to-Carb Ratio) autotuning: detect meal-time excursions
    if ((tw.start === 6 || tw.start === 11 || tw.start === 17) && windowHigh > 0.25) {
      const currentIcr = 10; // g per unit, default
      const spikeSeverity = Math.min(0.08, windowHigh * 0.06);
      const targetIcr = Math.round(currentIcr * (1 - spikeSeverity));
      const recommended = Math.round(clampShift(currentIcr, targetIcr));
      if (recommended !== currentIcr) {
        const pctChange = Math.round(((recommended - currentIcr) / currentIcr) * 1000) / 10;
        const confidence = Math.min(90, 50 + windowHighCount * 7);
        recommendations.push({
          id: `at-${patient.id}-icr-${tw.start}`,
          patientId: patient.id,
          paramType: 'icr',
          timeWindow: tw.label,
          currentVal: currentIcr,
          recommendedVal: recommended,
          percentChange: pctChange,
          confidenceScore: confidence,
          reasoning: `Post-meal excursion pattern in ${tw.label}: ${windowHighCount} of ${windowValues.length} readings above 180 mg/dL after meal window. Current carb ratio may be too permissive. Recommending ICR reduction (more insulin per gram of carbs) to better match meal absorption profile.`,
          safetyFlag: confidence > 70 ? 'safe' : 'review_required',
          status: 'pending',
          dismissedNote: null,
          dataSufficiency,
          createdAt: now,
          resolvedAt: null,
        });
      }
    }
  }

  // Global basal recommendation if overall TIR is low with high time above range
  if (cgmMetrics.tir < 60 && cgmMetrics.highPct > 30) {
    const currentBasal = patient.aidConfig?.targetGlucose ?? 110;
    const targetBasal = Math.max(90, currentBasal - 10);
    const recommended = Math.round(clampShift(currentBasal, targetBasal));
    if (recommended !== currentBasal) {
      const pctChange = Math.round(((recommended - currentBasal) / currentBasal) * 1000) / 10;
      const confidence = Math.min(88, 65 + (cgmMetrics.highPct - 30) * 0.8);
      recommendations.push({
        id: `at-${patient.id}-basal-global`,
        patientId: patient.id,
        paramType: 'basal',
        timeWindow: 'All-day (global)',
        currentVal: currentBasal,
        recommendedVal: recommended,
        percentChange: pctChange,
        confidenceScore: confidence,
        reasoning: `Overall TIR ${cgmMetrics.tir}% with ${cgmMetrics.highPct}% time above range. Mean glucose ${cgmMetrics.meanGlucose} mg/dL. Systemic basal under-delivery suspected — recommending target glucose reduction to increase automated basal delivery across all time windows.`,
        safetyFlag: confidence > 80 ? 'safe' : 'review_required',
        status: 'pending',
        dismissedNote: null,
        dataSufficiency,
        createdAt: now,
        resolvedAt: null,
      });
    }
  }

  return recommendations;
}
