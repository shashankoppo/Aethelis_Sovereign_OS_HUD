/*
# Aethelis OS — Core Schema

## Summary
Creates four tables to back the Aethelis Sovereign OS application:

1. `ledger_transactions` — Sovereign Ledger CRUD: every ATH transfer, NFT trade, or yield event.
2. `logistics_orders` — ELSX Enterprise logistics pipeline rows (transactions, routes, status).
3. `market_modules` — Tracks which Omni-Market modules are installed (persisted across sessions).
4. `system_events` — Global event log shown in the Dashboard Atmosphere Control live feed.

## Security
- No authentication required (single-tenant app).
- RLS enabled on all tables with `TO anon, authenticated` policies so the anon-key Supabase client can read/write freely.
- `USING (true)` is intentional: this is a shared single-tenant dashboard, not a multi-user product.
*/

-- ── 1. ledger_transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('transfer','nft_trade','yield','acquisition')),
  asset       text NOT NULL DEFAULT 'ATH',
  amount      numeric(18,4) NOT NULL,
  direction   text NOT NULL CHECK (direction IN ('in','out')),
  label       text NOT NULL,
  note        text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ledger" ON ledger_transactions;
CREATE POLICY "anon_select_ledger" ON ledger_transactions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ledger" ON ledger_transactions;
CREATE POLICY "anon_insert_ledger" ON ledger_transactions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ledger" ON ledger_transactions;
CREATE POLICY "anon_update_ledger" ON ledger_transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ledger" ON ledger_transactions;
CREATE POLICY "anon_delete_ledger" ON ledger_transactions FOR DELETE TO anon, authenticated USING (true);

-- Seed a few rows
INSERT INTO ledger_transactions (type, asset, amount, direction, label, note)
SELECT 'yield',    'ATH', 1842.00, 'in',  'Monthly Yield Q2',         'Algorithmic floor guardian' WHERE NOT EXISTS (SELECT 1 FROM ledger_transactions LIMIT 1);
INSERT INTO ledger_transactions (type, asset, amount, direction, label, note)
SELECT 'transfer', 'ATH',  400.50, 'out', 'Node Infrastructure Fee',  'Planetary bridge maintenance' WHERE NOT EXISTS (SELECT 1 FROM ledger_transactions WHERE type='transfer' LIMIT 1);
INSERT INTO ledger_transactions (type, asset, amount, direction, label, note)
SELECT 'nft_trade','ATH', 3200.00, 'in',  'NFT-GENESIS-001 Sale',     'Collector premium' WHERE NOT EXISTS (SELECT 1 FROM ledger_transactions WHERE type='nft_trade' LIMIT 1);

-- ── 2. logistics_orders ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistics_orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id     text NOT NULL,
  route       text NOT NULL,
  delta       numeric(12,2) NOT NULL,
  currency    text NOT NULL DEFAULT '₹',
  status      text NOT NULL CHECK (status IN ('en_route','pending','complete','failed')) DEFAULT 'pending',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE logistics_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_logistics" ON logistics_orders;
CREATE POLICY "anon_select_logistics" ON logistics_orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_logistics" ON logistics_orders;
CREATE POLICY "anon_insert_logistics" ON logistics_orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_logistics" ON logistics_orders;
CREATE POLICY "anon_update_logistics" ON logistics_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_logistics" ON logistics_orders;
CREATE POLICY "anon_delete_logistics" ON logistics_orders FOR DELETE TO anon, authenticated USING (true);

INSERT INTO logistics_orders (node_id, route, delta, status)
SELECT 'TRX-0042','Food Proxy (Zomato)', 2400, 'en_route' WHERE NOT EXISTS (SELECT 1 FROM logistics_orders LIMIT 1);
INSERT INTO logistics_orders (node_id, route, delta, status)
SELECT 'TRX-0043','Hardware Sourcing',  -8200, 'pending'  WHERE NOT EXISTS (SELECT 1 FROM logistics_orders WHERE node_id='TRX-0043');
INSERT INTO logistics_orders (node_id, route, delta, status)
SELECT 'TRX-0039','Media Stream CDN',  14800, 'complete'  WHERE NOT EXISTS (SELECT 1 FROM logistics_orders WHERE node_id='TRX-0039');

-- ── 3. market_modules ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_modules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name   text UNIQUE NOT NULL,
  installed     boolean NOT NULL DEFAULT false,
  installed_at  timestamptz
);

ALTER TABLE market_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_modules" ON market_modules;
CREATE POLICY "anon_select_modules" ON market_modules FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_modules" ON market_modules;
CREATE POLICY "anon_insert_modules" ON market_modules FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_modules" ON market_modules;
CREATE POLICY "anon_update_modules" ON market_modules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_modules" ON market_modules;
CREATE POLICY "anon_delete_modules" ON market_modules FOR DELETE TO anon, authenticated USING (true);

INSERT INTO market_modules (module_name, installed, installed_at)
VALUES
  ('WP Backbone',     true,  now()),
  ('Food Proxy',      false, null),
  ('Media Stream',    false, null),
  ('Auto-Legal',      false, null),
  ('Nexus Bridge',    false, null),
  ('Sovereign Vault', false, null)
ON CONFLICT (module_name) DO NOTHING;

-- ── 4. system_events ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category   text NOT NULL CHECK (category IN ('network','enterprise','security','ledger','system')),
  message    text NOT NULL,
  severity   text NOT NULL CHECK (severity IN ('info','warn','critical')) DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON system_events;
CREATE POLICY "anon_select_events" ON system_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON system_events;
CREATE POLICY "anon_insert_events" ON system_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON system_events;
CREATE POLICY "anon_update_events" ON system_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON system_events;
CREATE POLICY "anon_delete_events" ON system_events FOR DELETE TO anon, authenticated USING (true);

INSERT INTO system_events (category, message, severity)
VALUES
  ('network',    'SKU-992 pricing parity confirmed across 7 marketplaces.', 'info'),
  ('enterprise', '42 autonomous CRM responses executed via ELSX Engine.',   'info'),
  ('system',     'RAM bridge acquired 34.2GB from background processes.',   'warn'),
  ('security',   'Nexus subnet scan complete — 0 critical exposures.',      'info')
ON CONFLICT DO NOTHING;
