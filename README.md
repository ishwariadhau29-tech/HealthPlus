# HealthPlus — GlucoTwin

> **Note on naming:** The GitHub repository is named **HealthPlus**. The application itself is called **GlucoTwin** — a metabolic and glucose control digital twin. Both names refer to this project.

**Hackathon Demo · Educational, Not Medical Advice**

---

## Table of Contents

1. [Team Details](#1-team-details)
2. [College / Institution](#2-college--institution)
3. [Hackathon](#3-hackathon)
4. [Project Title & Overview](#4-project-title--overview)
5. [Problem Statement](#5-problem-statement)
6. [Healthcare Use Case](#6-healthcare-use-case)
7. [Key Features](#7-key-features)
8. [Technical Stack](#8-technical-stack)
9. [Simulation Approach & Rule-Based Engine](#9-simulation-approach--rule-based-engine)
10. [Architecture & Data Flow](#10-architecture--data-flow)
11. [Local Setup & Run Instructions](#11-local-setup--run-instructions)
12. [Environment Variables](#12-environment-variables)
13. [Supabase Setup](#13-supabase-setup)
14. [Demo Mode (No Account Required)](#14-demo-mode-no-account-required)
15. [Demo Walkthrough for Judges](#15-demo-walkthrough-for-judges)
16. [Submission Materials](#16-submission-materials)
17. [Current Limitations & Future Scope](#17-current-limitations--future-scope)
18. [Open-Source License](#18-open-source-license)
19. [Submission Checklist](#19-submission-checklist)

---

## 1. Team Details

**Team name:** HackNova

| Member | LinkedIn |
|---|---|
| Ishwari Adhau | [linkedin.com/in/ishwari-adhau-6b222b404](https://www.linkedin.com/in/ishwari-adhau-6b222b404) |
| Aditi Dange | [linkedin.com/in/aditi-dange-1a8585369](https://www.linkedin.com/in/aditi-dange-1a8585369) |
| Dhanshri Zade | [linkedin.com/in/dhanshri-zade-a6480a401](https://www.linkedin.com/in/dhanshri-zade-a6480a401) |

> **TODO:** Add individual roles (e.g. Full-Stack Dev, UI/UX, Simulation Logic) once confirmed by the team.

---

## 2. College / Institution

**Prof. Ram Meghe Institute of Technology & Research**
Badnera, Amravati, Maharashtra, India
Department of Information Technology

---

## 3. Hackathon
## Digital Twin Challenge 2026

| Field | Detail |
|---|---|
| Event | [Digital Twin Challenge 2026 – Happiest Health](https://unstop.com/hackathons/crp-digital-twin-challenge-2026-happiest-health-1757873) |
| Format | National-level healthcare challenge |
| Mode | Online |
| Track | Healthcare Digital Twin |
| Project | HealthPlus |
| Team Size | 1–4 members |

---

## 4. Project Title & Overview

### GlucoTwin — Metabolic & Glucose Control Digital Twin

GlucoTwin is an educational web prototype that lets patients and clinicians explore how everyday lifestyle choices affect postprandial blood glucose — *before* acting on them. By adjusting meal macros (carbs, protein, fat), physical activity, and sleep, users can run scenario simulations and see a projected 24-hour glucose curve in real time.

The application has two role-based views:

- **Patient view** — Adjust inputs, view the projected glucose curve and CGM-style metrics, compare two scenarios side by side, and save simulation history to the cloud.
- **Clinician portal** — Review a panel of six demo patients, add clinical notes, write prescriptions, push a recommended plan to the patient, manage a care-team handoff board, and review an audit trail.

**This is a hackathon prototype for educational purposes. It is not a medical device, does not connect to real CGM hardware or patient records, and does not constitute medical advice.**

---

## 5. Problem Statement

According to a WHO estimate (2022), approximately 830 million people worldwide were living with diabetes. Of adults aged 30 and over with diabetes, 59 % were not taking medication. A core barrier is that patients lack a clear, personalised picture of how their daily choices — what they eat, how much they walk, how long they sleep — affect their glucose levels.

Clinicians, in turn, face scale and communication challenges: conveying the causal link between lifestyle and glycaemic response to each patient individually is time-consuming, and patients often cannot experiment with changes safely before a follow-up appointment.

GlucoTwin addresses this by making glucose response **explorable** — a patient can run "what if I walk 20 minutes after dinner instead of 10?" and see the projected difference immediately, without any risk to their health.

---

## 6. Healthcare Use Case

### Intended users

| User | Role |
|---|---|
| **Patients** with Type 1, Type 2, LADA, gestational, or high-variability diabetes | Primary end-users of the simulation |
| **Endocrinologists, dietitians, diabetes educators (CDCES), and primary care physicians** | Clinician portal users |

### The problem

Patients make lifestyle decisions (meal composition, exercise, sleep) without a concrete sense of their glycaemic impact. Clinicians need a shared, visual language to explain those relationships and to delegate plan adjustments between specialist roles.

### Concrete patient/clinician workflow

1. **Patient opens GlucoTwin** and enters Demo Mode (no account needed) or signs in.
2. **Patient adjusts meal macros** — carbs, protein, and fat — using sliders, and optionally selects a patient archetype (athletic, standard, prediabetic).
3. **Simulation runs immediately** in the browser. A 24-hour glucose curve, projected peak, risk classification (Optimal / Moderate Spike Risk / Severe Excursion Risk), and CGM-style metrics (Time-in-Range, eA1c, CV%) are displayed.
4. **Patient compares scenarios** — pins Scenario A, adjusts inputs, and sees Scenario B overlaid on the same chart.
5. **Patient saves the run** to their history (locally in Demo Mode; synced to Supabase if signed in).
6. **Clinician switches to the Doctor portal** via the role toggle in the top bar.
7. **Clinician reviews the patient panel**, triage-sorted by risk level or early-warning score.
8. **Clinician writes a clinical note**, builds a prescription, and pushes a recommended plan to the patient.
9. **Patient receives the plan** via an in-app notification modal and accepts or requests clarification.
10. **Clinician exports** the simulation summary as a printable PDF or JSON file for the patient record.

---

## 7. Key Features

### Patient simulator

| Feature | Status |
|---|---|
| Macro input sliders (carbs, protein, fat, walk, sleep, exercise timing) | ✅ Implemented |
| Patient archetype selector (Athletic / Standard / Prediabetic) | ✅ Implemented |
| 24-hour Gaussian glucose curve chart | ✅ Implemented |
| Projected peak glucose & risk classification | ✅ Implemented |
| CGM metrics panel (TIR, eA1c, mean glucose, SD, CV%) | ✅ Implemented |
| Rule-based advisory text | ✅ Implemented |
| Scenario A/B comparison mode | ✅ Implemented |
| Simulation run history table | ✅ Implemented |
| Export as printable PDF or JSON download | ✅ Implemented |
| XAI attribution card (meal load, sleep deficit, walk effect, ISF drift) | ✅ Implemented |
| Clinician notes archive (patient-side view) | ✅ Implemented |
| MealVision modal (UI prototype — see §9) | ⚠️ UI prototype only |
| Simulated CGM live stream (stable / spike / hypo modes) | ⚠️ Simulated, not real hardware |
| Wearable metrics integration | ⚠️ Demo data only |

### Clinician portal

| Feature | Status |
|---|---|
| Patient panel with triage filter and sort | ✅ Implemented |
| Early-warning prediction (velocity/acceleration on simulated curve) | ✅ Implemented |
| SBAR auto-generated summary per patient | ✅ Implemented |
| Clinical notes | ✅ Implemented |
| Prescription builder | ✅ Implemented |
| Plan push to patient with safety pre-check | ✅ Implemented |
| Secure messaging drawer (doctor ↔ patient) | ✅ Implemented |
| Care-team handoff notes & task board | ✅ Implemented |
| Audit trail | ✅ Implemented |
| AID (automated insulin delivery) config panel | ✅ Implemented |
| Autotuning recommendations (Basal / ISF / ICR) | ✅ Implemented |
| Virtual trial modal (7-day simulation of an intervention) | ✅ Implemented |
| Pump telemetry view | ⚠️ Simulated, not real hardware |
| Anomaly detection panel | ✅ Implemented (rule-based, demo data) |
| AGP (ambulatory glucose profile) modal | ✅ Implemented |

### Authentication & data

| Feature | Status |
|---|---|
| Email/password sign-in and sign-up via Supabase Auth | ✅ Implemented |
| User profile (name, age, weight, HbA1c, fasting glucose) | ✅ Implemented |
| Simulation run cloud sync (Supabase, row-level security) | ✅ Implemented |
| Demo Mode — fully functional without credentials | ✅ Implemented |
| Doctor portal state persisted to localStorage | ✅ Implemented |
| Dark / light theme toggle | ✅ Implemented |

---

## 8. Technical Stack

| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 18.3 | Component-based UI, dual-role views, state management |
| [TypeScript](https://www.typescriptlang.org/) | 5.5 | Type safety across the entire codebase |
| [Vite](https://vitejs.dev/) | 5.4 | Development server and production build tool |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Utility-first styling, dark mode, responsive layout |
| [Recharts](https://recharts.org/) | 3.10 | 24-hour glucose curve chart, TIR bar, virtual trial bar chart |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | 2.57 | Authentication, `profiles` and `simulation_runs` tables, row-level security |
| [Lucide React](https://lucide.dev/) | 0.446 | Icon set throughout the UI |
| [ESLint](https://eslint.org/) | 9.9 | Linting with React Hooks and React Refresh plugins |
| [PostCSS / Autoprefixer](https://postcss.org/) | 8.4 / 10.4 | CSS processing pipeline for Tailwind |

No external AI/ML API is called. No native-app framework, testing framework, or bundler other than Vite is used.

---

## 9. Simulation Approach & Rule-Based Engine

> **Accuracy note:** GlucoTwin does not use a trained machine-learning model and does not call any external AI inference API. All glucose projections are produced by a deterministic, formula-based simulation engine implemented in [`src/lib/glucoseEngine.ts`](src/lib/glucoseEngine.ts).

### How the glucose simulation works

The engine models postprandial glucose as a sum of Gaussian curves centred on three standard meal times (08:00, 13:00, 19:00). Each curve's amplitude and width are modified by the following rules, derived from established glycaemic physiology principles:

| Input | Modelled effect |
|---|---|
| Carbohydrate load (g) | Scales peak amplitude proportionally |
| Dietary fat (g) | Delays time-to-peak ("pizza effect") and broadens the curve |
| Protein (g) | Provides mild dampening via a buffering factor |
| Post-meal walk (mins) | Suppresses peak; post-meal timing is modelled as 2.2× more effective than pre-meal (GLUT4 mechanism) |
| Sleep duration (hrs) | Deficit below 7 hours raises baseline and increases resistance factor |
| Patient archetype | Scales fasting glucose, amplitude, width, and clearance rate per archetype preset |

The **advisory text** is generated by rule-based threshold comparisons (e.g. "if carbs > 50 g, suggest reducing by X g"). The **autotuning recommendations** for Basal, ISF, and ICR are produced by the same rule engine applied to the simulated curve — they are not inferred from real CGM data.

### Simulated / demo features (not real hardware or ML)

| Feature | Current implementation |
|---|---|
| **MealVision (Snap/Upload Meal)** | UI prototype. The modal accepts a file drop or click, displays a 1.8-second "analysing" animation, then returns one of three hardcoded meal presets. **No image is decoded or analysed.** This is a placeholder UI for a planned multimodal vision integration. |
| **CGM live stream** | `generateCGMReading()` produces values using `Math.random()` noise around a fixed base (stable / spike / hypo mode). No CGM device is connected. |
| **Pump telemetry** | `simulatePumpTelemetry()` runs the Gaussian simulation through AID rule logic. No physical pump is connected. |
| **Wearable metrics** | Oura, Whoop, Apple Watch, and Fitbit data shown in the clinician portal are hardcoded demo objects in `src/lib/doctorData.ts`. No device sync exists. |
| **Demo patients** | Six demo patients (Alex Rivera, Sarah Jenkins, David Chen, Maria Gonzalez, James Wilson, Emily Park) with their histories, anomalies, and wearable data are all hardcoded. |
| **Early warning prediction** | Computed from velocity and acceleration of the simulated curve, not from a real CGM stream. |

---

## 10. Architecture & Data Flow

The architecture diagram below shows the four layers of the system.

```
User inputs → React interface → Glucose simulation → Trend visualisation → Clinician review
```

```
┌─────────────────────┐       ┌──────────────────────────────────────────────────┐
│   USER EXPERIENCE   │       │                  APPLICATION LAYER                │
│                     │       │                                                    │
│  PATIENT            │──────▶│  REACT WEB APPLICATION                           │
│  Meal / carb inputs │       │  TypeScript · Vite · Tailwind CSS                 │
│  Activity & scenario│       │  Role-based patient / clinician views             │
│  controls           │       │                                                    │
│                     │       └──────────────┬───────────────────────┬────────────┘
│  CLINICIAN          │──────▶               │                       │
│  Patient insights   │              ┌───────▼──────────┐  ┌────────▼──────────┐
│  Review & monitoring│              │ GLUCOSE DIGITAL  │  │  VISUAL ANALYTICS │
└─────────────────────┘              │ TWIN ENGINE      │  │                   │
                                     │ Gaussian-curve   │  │ Recharts          │
                                     │ simulation       │  │ Glucose trends    │
                                     │ Scenario-driven  │  │ Scenario          │
                                     │ glucose estimates│  │ comparisons       │
                                     └───────┬──────────┘  └────────┬──────────┘
                                             │                       │
                                     ┌───────▼───────────────────────▼────────────┐
                                     │              BACKEND SERVICES               │
                                     │              SUPABASE                       │
                                     │   Authentication · Database                 │
                                     │   Row-level security policies               │
                                     └────────────────────────────────────────────┘
```

*Architecture based on source-code inspection. Glucose predictions are simulated estimates, not clinical measurements.*

### Data flow detail

1. **Patient inputs** carb/protein/fat/walk/sleep/timing values via sliders in `ControlPanel`.
2. **`glucoseEngine.ts`** computes — entirely in the browser, with no network call — a 24-point Gaussian curve, projected peak, risk classification, CGM metrics, and advisory text using `useMemo` hooks.
3. **Recharts** renders the curve in `GlucoseChart`. CGM metrics appear in `CGMMetricsPanel`.
4. **Save run** — if Supabase is configured and the user is signed in, the run is inserted into the `simulation_runs` table. In Demo Mode it is stored in React state only.
5. **Clinician portal** reads demo patients from `doctorData.ts` (localStorage-persisted). SBAR summaries and early-warning predictions are computed client-side from the same engine.
6. **Plan push** creates a `PatientPlanNotification` in React state; the patient-side modal presents it for acceptance.

> The architecture diagram image provided by the team is referenced in the [Architecture Diagram](#architecture-diagram) section below. A PDF/PPT version is pending.

---

## 11. Local Setup & Run Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later (bundled with Node.js 18+)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/ishwariadhau29-tech/HealthPlus.git
cd HealthPlus

# 2. Install dependencies
npm install

# 3. Configure environment variables (see §12)
#    Copy the example below into a new .env file, or skip for Demo Mode.

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available scripts

| Script | Command | Purpose |
|---|---|---|
| Dev server | `npm run dev` | Starts Vite dev server with HMR |
| Production build | `npm run build` | Compiles TypeScript and bundles for production |
| Preview build | `npm run preview` | Serves the production build locally |
| Type check | `npm run typecheck` | Runs `tsc --noEmit` without emitting files |
| Lint | `npm run lint` | Runs ESLint across the project |

> No test runner is configured in this project. `npm test` will not work.

---

## 12. Environment Variables

Create a `.env` file in the repository root (this file is listed in `.gitignore` and must never be committed):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

These are the only two variables the application reads. Both are prefixed with `VITE_` so Vite exposes them to the browser bundle.

**If neither variable is set, the application starts in Demo Mode automatically** (see §14). No `.env` file is required for a quick demo.

Do not commit real credentials. The repository's `.gitignore` already excludes `.env*` files.

---

## 13. Supabase Setup

If you want cloud sync of profiles and simulation history, set up a Supabase project and apply the schema.

### Create the schema

The migration file is at [`supabase/migrations/20261007014711_01_init.sql`](supabase/migrations/20261007014711_01_init.sql). Apply it in one of two ways:

**Option A — Supabase CLI (recommended)**

```bash
supabase login
supabase link --project-ref your-project-id
supabase db push
```

**Option B — Supabase Dashboard SQL editor**

1. Open your project at [supabase.com](https://supabase.com) → SQL Editor.
2. Paste the full contents of `supabase/migrations/20261007014711_01_init.sql`.
3. Click **Run**.

### What the migration creates

| Table | Description |
|---|---|
| `profiles` | One row per user: `full_name`, `age`, `weight_kg`, `baseline_hba1c`, `fasting_glucose`. |
| `simulation_runs` | One row per saved run: `carbs_g`, `walk_mins`, `sleep_hrs`, `projected_peak_mgdl`, `risk_level`. |

Both tables have Row Level Security enabled. Users can only read and write their own rows. The `user_id` column defaults to `auth.uid()` so inserts that omit it are still correctly attributed.

---

## 14. Demo Mode (No Account Required)

The application checks for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at startup. If either is absent or empty, `isSupabaseConfigured` is `false` and the auth modal offers a **"Continue as Demo"** button.

In Demo Mode:
- The patient profile defaults to Alex Rivera (age 34, HbA1c 5.6%, fasting glucose 92 mg/dL).
- All simulation, comparison, advisory, and export features work normally.
- Simulation runs are saved to React state for the session (not persisted to a database).
- The clinician portal loads six hardcoded demo patients from `src/lib/doctorData.ts`, persisted to `localStorage`.

**Judges can evaluate the full application without creating a Supabase account.**

---

## 15. Demo Walkthrough for Judges

The presentation describes three steps to reach the simulation:

> "Open the welcome screen → choose a path (sign in or Demo Mode) → enter the patient profile and simulation experience."

Suggested judge walkthrough (≈ 10 minutes):

1. **Open the app** and click **Get Started** on the welcome screen.
2. **Select Demo Mode** — no account required.
3. **Patient view — simulate a meal:**
   - The default profile is Alex Rivera (Standard archetype, fasting 92 mg/dL).
   - Change **Carbs** to 75 g and observe the curve shift and risk level change to "Moderate Spike Risk".
   - Set **Walk** to 25 minutes, **Exercise timing** to "After meal" — watch the peak drop.
   - Set **Sleep** to 5 hours — observe the baseline rise.
   - Review the **CGM metrics panel** (TIR, eA1c, mean glucose, CV%).
   - Review the **advisory text** in the Insights panel.
   - Click **Save Run** to add it to the history table.
4. **Compare scenarios:**
   - Click **Compare Mode**, pin the current scenario as Scenario A.
   - Reduce carbs to 40 g — the chart overlays both curves.
5. **Switch archetypes:**
   - Select "Prediabetic / Insulin Resistant" in the Archetype Switcher — the fasting baseline and curve shape change.
6. **Export:**
   - Click **Export PDF** in the History table to open the printable clinical summary.
7. **Switch to Clinician portal:**
   - Toggle **Doctor** in the role switcher (top bar).
   - Review the patient panel — David Chen and James Wilson appear flagged with critical risk.
   - Open a patient, view the SBAR summary, write a clinical note, and push a plan.
   - Review the care-team handoff notes and task board.
   - Check the audit trail.
8. **Switch back to Patient** — accept the pushed plan from the notification modal.

---

## 16. Submission Materials

### Demo Video

🎥 Project Demo

Watch the project demonstration video here:

"▶️ Click here to watch the video" (https://1drv.ms/v/c/a2c46c9f5caf6bfb/IQA6pQY9E3kjTo0rcZ6rRLs6AQe8p6G7FTD9hRS-CCZQpAE?e=yT53Bx)

  
### Architecture Diagram

[📄 View Architecture PDF](https://github.com/ishwariadhau29-tech/HealthPlus/blob/main/Architecture.pdf)


### Project Presentation

[📄 View Overall Project PDF](https://github.com/ishwariadhau29-tech/HealthPlus/blob/main/overall.pdf)


---

## 17. Current Limitations & Future Scope

### Limitations (as of hackathon submission)

| Area | Current state |
|---|---|
| Glucose model | Formula-based Gaussian simulation with hardcoded archetype presets. Not trained on clinical data and not clinically validated. |
| MealVision | UI prototype returning hardcoded presets; no real image analysis. |
| CGM / pump / wearable | Fully simulated; no real device integration. |
| Demo patients | Six hardcoded synthetic patient profiles; no real patient data. |
| Clinical validation | Model accuracy, safety limits, and clinical outcomes have not been validated. Privacy, consent, and full audit infrastructure for real patient use are not in place. |
| Secure messaging | Clinician–patient chat is concept-level UI; messages are stored in `localStorage` only. |
| Auth | Email/password only; no OAuth, MFA, or password reset flow. |
| Persistence | Doctor portal state is `localStorage`-only; cleared if the browser storage is wiped. |

### Future scope

- Replace the formula simulation with a validated physiological model (e.g. Hovorka, UVa/Padova) trained on anonymised CGM datasets.
- Integrate real CGM data via Dexcom or Libre APIs.
- Add genuine multimodal vision (e.g. a food-image classification model) to power the MealVision feature.
- Connect wearable APIs (Oura, Fitbit, Apple HealthKit) for live sleep and HRV data.
- Clinical validation study and IRB approval for any use with real patients.
- HIPAA / DPDP-compliant data handling, encryption at rest, and proper consent management.
- Mobile-responsive PWA packaging.
- Role-based access control with institutional SSO.

---

## 18. Open-Source License

> ⚖️ **LICENSE PENDING**
> The team has not yet selected an open-source license for this repository. A LICENSE file will be added once a license is chosen.
> This repository is currently **not explicitly licensed**. Until a license is added, standard copyright law applies.

---

## 19. Submission Checklist

Use this checklist to track submission completeness. Items marked **⬜ Pending** must be resolved before the submission can be considered complete.

### Mandatory hackathon requirements

| # | Requirement | Status |
|---|---|---|
| 1 | Team name and member list with profile links | ✅ Complete |
| 2 | Individual member roles | ⬜ Pending — to be added by team |
| 3 | College / institution name and department | ✅ Complete |
| 4 | Project title | ✅ Complete |
| 5 | Problem statement | ✅ Complete |
| 6 | Healthcare use case with user types and workflow | ✅ Complete |
| 7 | Technical stack with purpose of each technology | ✅ Complete |
| 8 | AI/ML model or framework description | ✅ Complete (simulation engine described accurately) |
| 9 | Demo video — 15–20 min unlisted YouTube link | ⬜ Pending — link not yet provided |
| 10 | Open-source license | ⬜ Pending — license not yet selected |
| 11 | Architecture diagram — PDF or PPT link | ⬜ Pending — hosted link not yet provided |
| 12 | Project presentation — PDF or PPT link | ⬜ Pending — hosted link not yet provided |
| 13 | Accessibility checklist — all files and links publicly accessible without additional permissions | ⬜ Pending — cannot confirm until all links are provided |

### Verified technical content

| Item | Verified |
|---|---|
| All `npm run` scripts checked against `package.json` | ✅ |
| Environment variable names checked against `src/lib/supabase.ts` | ✅ |
| Supabase migration file path and SQL checked | ✅ |
| Demo Mode behaviour checked against `AuthContext.tsx` | ✅ |
| Glucose engine described as formula-based (not ML) | ✅ |
| MealVision described as UI prototype (not real vision API) | ✅ |
| Unsupported clinical numbers (34%, 98.2%, 90s) omitted | ✅ |
| No real patient data or credentials included | ✅ |

---

> **⚠️ This README is a working draft. It is not submission-ready until all ⬜ Pending items in the checklist above are resolved.**

---

*GlucoTwin is an educational healthcare prototype. It does not constitute medical advice. Always consult a qualified healthcare provider for clinical decisions.*
