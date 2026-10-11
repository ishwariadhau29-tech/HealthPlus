/*
# GlucoTwin — Initial Schema (profiles + simulation_runs)

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users ON DELETE CASCADE) — one row per user, keyed to their auth identity.
  - `full_name` (text) — display name of the patient.
  - `age` (int) — patient age in years.
  - `weight_kg` (numeric) — body weight in kilograms.
  - `baseline_hba1c` (numeric) — baseline HbA1c percentage (e.g. 5.6).
  - `fasting_glucose` (numeric) — fasting blood glucose in mg/dL.
  - `updated_at` (timestamptz, default now()) — last modification timestamp.
- `simulation_runs`
  - `id` (uuid, primary key, default gen_random_uuid()) — unique run identifier.
  - `user_id` (uuid, references auth.users ON DELETE CASCADE, default auth.uid()) — owner of the run.
  - `carbs_g` (numeric) — carbohydrate intake in grams for this run.
  - `walk_mins` (numeric) — post-meal walk duration in minutes.
  - `sleep_hrs` (numeric) — sleep duration in hours.
  - `projected_peak_mgdl` (numeric) — model-projected glucose peak in mg/dL.
  - `risk_level` (text) — risk classification: 'Optimal', 'Moderate Spike Risk', or 'Severe Excursion Risk'.
  - `created_at` (timestamptz, default now()) — run creation timestamp.

2. Security
- Enable RLS on both tables.
- `profiles`: owner-scoped CRUD — a user can only read/insert/update/delete the profile row whose id equals their auth.uid().
- `simulation_runs`: owner-scoped CRUD — a user can only access runs where user_id equals their auth.uid(). The user_id column defaults to auth.uid() so client inserts that omit user_id still satisfy the WITH CHECK policy.

3. Indexes
- `simulation_runs_user_id_idx` on `simulation_runs(user_id)` for fast per-user history queries.
- `simulation_runs_created_at_idx` on `simulation_runs(created_at DESC)` for ordered history retrieval.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  age int,
  weight_kg numeric,
  baseline_hba1c numeric,
  fasting_glucose numeric,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS simulation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  carbs_g numeric NOT NULL DEFAULT 45,
  walk_mins numeric NOT NULL DEFAULT 15,
  sleep_hrs numeric NOT NULL DEFAULT 7,
  projected_peak_mgdl numeric NOT NULL DEFAULT 120,
  risk_level text NOT NULL DEFAULT 'Optimal',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_runs" ON simulation_runs;
CREATE POLICY "select_own_runs"
ON simulation_runs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_runs" ON simulation_runs;
CREATE POLICY "insert_own_runs"
ON simulation_runs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_runs" ON simulation_runs;
CREATE POLICY "update_own_runs"
ON simulation_runs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_runs" ON simulation_runs;
CREATE POLICY "delete_own_runs"
ON simulation_runs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS simulation_runs_user_id_idx ON simulation_runs(user_id);
CREATE INDEX IF NOT EXISTS simulation_runs_created_at_idx ON simulation_runs(created_at DESC);