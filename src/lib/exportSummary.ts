import { Profile, SimParams, CGMMetrics, Archetype, RiskLevel, SimulationRun } from '@/lib/types';

interface ExportData {
  profile: Profile;
  archetype: Archetype;
  params: SimParams;
  peak: number;
  risk: RiskLevel;
  metrics: CGMMetrics;
  advisory: string;
  history: SimulationRun[];
}

export function exportClinicalSummary(data: ExportData) {
  const { profile, archetype, params, peak, risk, metrics, advisory, history } = data;
  const now = new Date().toLocaleString();

  const reportHtml = `
<!DOCTYPE html>
<html>
<head>
<title>GlucoTwin Clinical Summary — ${profile.full_name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; background: #f8fafc; padding: 32px; }
  .report { max-width: 720px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #14b8a6, #0891b2); color: white; padding: 28px 32px; }
  .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .header p { font-size: 13px; opacity: 0.9; }
  .header .meta { font-size: 11px; opacity: 0.75; margin-top: 8px; }
  .section { padding: 24px 32px; border-bottom: 1px solid #e2e8f0; }
  .section:last-child { border-bottom: none; }
  .section h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 16px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
  .card .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px; }
  .card .value { font-size: 16px; font-weight: 700; color: #0f172a; }
  .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .risk-optimal { background: #d1fae5; color: #065f46; }
  .risk-moderate { background: #fef3c7; color: #92400e; }
  .risk-severe { background: #fee2e2; color: #991b1b; }
  .tir-bar { display: flex; height: 24px; border-radius: 6px; overflow: hidden; margin: 12px 0; }
  .tir-in { background: #10b981; }
  .tir-high { background: #f59e0b; }
  .tir-low { background: #ef4444; }
  .tir-legend { display: flex; gap: 16px; font-size: 12px; color: #64748b; margin-top: 8px; }
  .tir-legend span { display: flex; align-items: center; gap: 4px; }
  .tir-legend .dot { width: 8px; height: 8px; border-radius: 50%; }
  .advisory { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 14px 16px; font-size: 13px; line-height: 1.6; color: #134e4a; }
  .notes { font-size: 13px; line-height: 1.6; color: #475569; }
  .notes ul { margin-top: 8px; padding-left: 20px; }
  .notes li { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table th { text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; }
  table td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
  .footer { padding: 16px 32px; background: #f8fafc; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; background: white; } .report { box-shadow: none; max-width: 100%; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="report">
  <div class="header">
    <h1>GlucoTwin Clinical Summary</h1>
    <p>Metabolic &amp; Glucose Control Digital Twin</p>
    <div class="meta">Generated: ${now} | Patient Archetype: ${archetype.label}</div>
  </div>

  <div class="section">
    <h2>Patient Profile</h2>
    <div class="grid">
      <div class="card"><div class="label">Patient Name</div><div class="value">${profile.full_name ?? 'N/A'}</div></div>
      <div class="card"><div class="label">Age</div><div class="value">${profile.age ?? 'N/A'} yrs</div></div>
      <div class="card"><div class="label">Weight</div><div class="value">${profile.weight_kg ?? 'N/A'} kg</div></div>
      <div class="card"><div class="label">Baseline HbA1c</div><div class="value">${profile.baseline_hba1c ?? 'N/A'}%</div></div>
      <div class="card"><div class="label">Fasting Glucose</div><div class="value">${profile.fasting_glucose ?? 'N/A'} mg/dL</div></div>
      <div class="card"><div class="label">Archetype</div><div class="value" style="font-size:13px">${archetype.label}</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Simulation Inputs (Macro Profile)</h2>
    <div class="grid-3">
      <div class="card"><div class="label">Carbohydrates</div><div class="value">${params.carbs_g} g</div></div>
      <div class="card"><div class="label">Protein</div><div class="value">${params.protein_g} g</div></div>
      <div class="card"><div class="label">Dietary Fat</div><div class="value">${params.fat_g} g</div></div>
      <div class="card"><div class="label">Walk Duration</div><div class="value">${params.walk_mins} min</div></div>
      <div class="card"><div class="label">Sleep</div><div class="value">${params.sleep_hrs} hrs</div></div>
      <div class="card"><div class="label">Exercise Timing</div><div class="value" style="font-size:13px">${params.exercise_timing === 'after' ? 'After Meal' : 'Before Meal'}</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Projected Outcomes</h2>
    <div class="grid">
      <div class="card"><div class="label">Projected Peak</div><div class="value">${peak} mg/dL</div></div>
      <div class="card"><div class="label">Risk Level</div><div class="value" style="padding-top:4px"><span class="risk-badge ${risk === 'Optimal' ? 'risk-optimal' : risk === 'Moderate Spike Risk' ? 'risk-moderate' : 'risk-severe'}">${risk}</span></div></div>
      <div class="card"><div class="label">Estimated HbA1c (eA1c)</div><div class="value">${metrics.ea1c}%</div></div>
      <div class="card"><div class="label">Mean Glucose</div><div class="value">${metrics.meanGlucose} mg/dL</div></div>
    </div>
  </div>

  <div class="section">
    <h2>CGM Time-in-Range Analysis</h2>
    <div class="tir-bar">
      <div class="tir-in" style="width:${metrics.tir}%"></div>
      <div class="tir-high" style="width:${metrics.highPct}%"></div>
      <div class="tir-low" style="width:${metrics.lowPct}%"></div>
    </div>
    <div class="tir-legend">
      <span><span class="dot" style="background:#10b981"></span> In Target (70-140): ${metrics.tir}%</span>
      <span><span class="dot" style="background:#f59e0b"></span> High (>140): ${metrics.highPct}%</span>
      <span><span class="dot" style="background:#ef4444"></span> Low (<70): ${metrics.lowPct}%</span>
    </div>
    <div class="grid-3" style="margin-top:16px">
      <div class="card"><div class="label">Std Deviation</div><div class="value">${metrics.sd} mg/dL</div></div>
      <div class="card"><div class="label">CV%</div><div class="value">${metrics.cv}%</div></div>
      <div class="card"><div class="label">eA1c</div><div class="value">${metrics.ea1c}%</div></div>
    </div>
  </div>

  <div class="section">
    <h2>AI Advisory</h2>
    <div class="advisory">${advisory}</div>
  </div>

  <div class="section">
    <h2>Physician Notes</h2>
    <div class="notes">
      <ul>
        <li>Patient archetype: ${archetype.label}. ${archetype.description}.</li>
        <li>Current projected peak of ${peak} mg/dL falls in the "${risk}" category.</li>
        <li>Time-in-Range is ${metrics.tir}% (target: >70% per international consensus).</li>
        <li>Glycemic variability (CV) is ${metrics.cv}% (${metrics.cv < 36 ? 'within' : 'above'} the <36% stability target).</li>
        <li>Estimated HbA1c from 24-hr mean: ${metrics.ea1c}% (lab baseline: ${profile.baseline_hba1c}%).</li>
        <li>${params.fat_g > 20 ? `High fat intake (${params.fat_g}g) is delaying time-to-peak ("pizza effect").` : 'Fat intake is within normal range.'}</li>
        <li>${params.exercise_timing === 'after' ? 'Post-meal exercise timing is optimal for GLUT4-mediated clearance.' : 'Pre-meal exercise is less effective; consider switching to post-meal walking for 2.2x greater glucose clearance.'}</li>
      </ul>
    </div>
  </div>

  ${history.length > 0 ? `
  <div class="section">
    <h2>Recent Simulation History</h2>
    <table>
      <thead><tr><th>Timestamp</th><th>Carbs</th><th>Walk</th><th>Sleep</th><th>Peak</th><th>Risk</th></tr></thead>
      <tbody>
        ${history.slice(0, 10).map((r) => `<tr><td>${new Date(r.created_at).toLocaleString()}</td><td>${r.carbs_g}g</td><td>${r.walk_mins}min</td><td>${r.sleep_hrs}h</td><td>${r.projected_peak_mgdl} mg/dL</td><td>${r.risk_level}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    GlucoTwin is a simulation tool for educational purposes and does not constitute medical advice. Always consult your healthcare provider.
    <br/>Generated by GlucoTwin Digital Twin Engine on ${now}
  </div>
</div>
<div class="no-print" style="text-align:center; margin-top:24px;">
  <button onclick="window.print()" style="padding:12px 28px; background:#14b8a6; color:white; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer;">Print / Save as PDF</button>
</div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(reportHtml);
    w.document.close();
  }
}

export function exportJsonSummary(data: ExportData) {
  const { profile, archetype, params, peak, risk, metrics, advisory, history } = data;
  const report = {
    reportType: 'GlucoTwin Clinical Summary',
    generatedAt: new Date().toISOString(),
    patient: {
      name: profile.full_name,
      age: profile.age,
      weightKg: profile.weight_kg,
      baselineHbA1c: profile.baseline_hba1c,
      fastingGlucoseMgDl: profile.fasting_glucose,
      archetype: archetype.label,
    },
    inputs: {
      carbsGrams: params.carbs_g,
      proteinGrams: params.protein_g,
      fatGrams: params.fat_g,
      walkMinutes: params.walk_mins,
      sleepHours: params.sleep_hrs,
      exerciseTiming: params.exercise_timing,
    },
    outcomes: {
      projectedPeakMgDl: peak,
      riskLevel: risk,
      estimatedHbA1c: metrics.ea1c,
      meanGlucose: metrics.meanGlucose,
    },
    cgmMetrics: {
      timeInRange: metrics.tir,
      highPct: metrics.highPct,
      lowPct: metrics.lowPct,
      standardDeviation: metrics.sd,
      cvPct: metrics.cv,
    },
    advisory,
    recentRuns: history.slice(0, 10).map((r) => ({
      timestamp: r.created_at,
      carbsGrams: r.carbs_g,
      walkMinutes: r.walk_mins,
      sleepHours: r.sleep_hrs,
      projectedPeakMgDl: r.projected_peak_mgdl,
      riskLevel: r.risk_level,
    })),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `glucotwin-summary-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
