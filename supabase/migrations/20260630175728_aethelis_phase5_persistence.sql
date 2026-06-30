/*
# Aethelis OS — Phase 5 Persistence Schema

## Summary
Adds four new tables to transition Aethelis from a stateless UI into a persistent,
database-backed Operating System. All tables are single-tenant (no sign-in screen)
so policies use `TO anon, authenticated` with `USING (true)` — the data is intentionally
shared/public across the OS instance.

## New Tables

1. `system_logs` — Kernel terminal & Dashboard Autonomous Ledger log stream.
   Replaces hardcoded in-memory arrays. The Kernel terminal subscribes to this table
   in realtime so new rows appear instantly without manual refresh.
   - `id` (uuid PK)
   - `source` (text): 'kernel' | 'dashboard' | 'nexus' | 'oracle' | 'vault'
   - `level` (text): 'sys' | 'info' | 'warn' | 'err' | 'user'
   - `message` (text): the log line content
   - `created_at` (timestamptz, default now())

2. `sovereign_assets` — The Proprietor's real ATH token balance and active NFT/asset
   count, fetched by the Sovereign Ledger app. Single row (singleton) keyed by `id = 1`.
   - `id` (int PK, fixed = 1)
   - `ath_balance` (numeric, default 0)
   - `nft_count` (int, default 0)
   - `updated_at` (timestamptz, default now())

3. `oracle_memory` — Gemini Oracle chat history, persisted across OS reboots so the
   AI remembers previous conversations.
   - `id` (uuid PK)
   - `role` (text): 'user' | 'oracle'
   - `content` (text): the message text
   - `created_at` (timestamptz, default now())

4. `vault_files` — Encrypted archive files revealed in the Bio-Pulse Vault only after
   a successful Supabase anonymous auth (zero-trust gate).
   - `id` (uuid PK)
   - `name` (text): codename e.g. 'GENESIS-001'
   - `file_type` (text): 'Key' | 'Contract' | 'Genetic' | 'Protocol' | etc.
   - `encrypted` (boolean, default true): whether the file is still sealed
   - `created_at` (timestamptz, default now())

## Security
- RLS enabled on all four tables.
- `TO anon, authenticated` CRUD policies (single-tenant, no sign-in screen).
- `USING (true)` is intentional and documented: this is a shared single-tenant OS dashboard.

## Notes
1. Existing tables (ledger_transactions, logistics_orders, market_modules, system_events)
   are untouched.
2. Seed data is inserted for sovereign_assets (singleton) and vault_files so the UI
   has content on first boot.
*/

-- ── 1. system_logs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source     text NOT NULL CHECK (source IN ('kernel','dashboard','nexus','oracle','vault')),
  level      text NOT NULL CHECK (level IN ('sys','info','warn','err','user')) DEFAULT 'sys',
  message    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_system_logs" ON system_logs;
CREATE POLICY "anon_select_system_logs" ON system_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_system_logs" ON system_logs;
CREATE POLICY "anon_insert_system_logs" ON system_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_system_logs" ON system_logs;
CREATE POLICY "anon_update_system_logs" ON system_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_system_logs" ON system_logs;
CREATE POLICY "anon_delete_system_logs" ON system_logs FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);

INSERT INTO system_logs (source, level, message)
VALUES
  ('kernel',   'sys',  'Aethelis Planetary Kernel [v10.0.0-Vision]'),
  ('kernel',   'sys',  'Proprietorship: Evolution Sphere Pvt Ltd.'),
  ('kernel',   'info', 'Type "help" for available commands.'),
  ('dashboard','sys',  'Atmosphere Control telemetry stream initialized.'),
  ('vault',    'info', 'Bio-Pulse Vault sealed. Awaiting retinal sync.')
ON CONFLICT DO NOTHING;

-- ── 2. sovereign_assets ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sovereign_assets (
  id          int PRIMARY KEY DEFAULT 1,
  ath_balance numeric(18,4) NOT NULL DEFAULT 0,
  nft_count   int NOT NULL DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  CONSTRAINT singleton_row CHECK (id = 1)
);

ALTER TABLE sovereign_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sovereign_assets" ON sovereign_assets;
CREATE POLICY "anon_select_sovereign_assets" ON sovereign_assets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sovereign_assets" ON sovereign_assets;
CREATE POLICY "anon_insert_sovereign_assets" ON sovereign_assets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sovereign_assets" ON sovereign_assets;
CREATE POLICY "anon_update_sovereign_assets" ON sovereign_assets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sovereign_assets" ON sovereign_assets;
CREATE POLICY "anon_delete_sovereign_assets" ON sovereign_assets FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO sovereign_assets (id, ath_balance, nft_count)
VALUES (1, 124500.0000, 42)
ON CONFLICT (id) DO NOTHING;

-- ── 3. oracle_memory ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oracle_memory (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role       text NOT NULL CHECK (role IN ('user','oracle')),
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE oracle_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_oracle_memory" ON oracle_memory;
CREATE POLICY "anon_select_oracle_memory" ON oracle_memory FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_oracle_memory" ON oracle_memory;
CREATE POLICY "anon_insert_oracle_memory" ON oracle_memory FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_oracle_memory" ON oracle_memory;
CREATE POLICY "anon_update_oracle_memory" ON oracle_memory FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_oracle_memory" ON oracle_memory;
CREATE POLICY "anon_delete_oracle_memory" ON oracle_memory FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_oracle_memory_created_at ON oracle_memory (created_at);

INSERT INTO oracle_memory (role, content)
VALUES
  ('oracle', 'I am the Oracle of Aethelis. Ask, and the prophetic circuits shall reveal.')
ON CONFLICT DO NOTHING;

-- ── 4. vault_files ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_files (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  file_type  text NOT NULL,
  encrypted  boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vault_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vault_files" ON vault_files;
CREATE POLICY "anon_select_vault_files" ON vault_files FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vault_files" ON vault_files;
CREATE POLICY "anon_insert_vault_files" ON vault_files FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vault_files" ON vault_files;
CREATE POLICY "anon_update_vault_files" ON vault_files FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vault_files" ON vault_files;
CREATE POLICY "anon_delete_vault_files" ON vault_files FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO vault_files (name, file_type, encrypted)
VALUES
  ('GENESIS-001', 'Key',       false),
  ('ALPHA-7B',    'Contract',  false),
  ('NEXUS-KEY',   'Key',       false),
  ('BIO-SYN',     'Genetic',   true),
  ('CORE-X9',     'Protocol', false),
  ('VAULT-0',     'Genesis',   false),
  ('REALM-1',     'Domain',    false),
  ('DARK-ARC',    'Archive',   true),
  ('PULSE-3',     'Bio',       false),
  ('NODE-99',     'Node',      false),
  ('CRYPT-42',    'Cipher',    false),
  ('OMEGA-K',     'Master',    true)
ON CONFLICT DO NOTHING;
