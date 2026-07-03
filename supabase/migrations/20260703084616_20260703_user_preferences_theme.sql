/*
# User Preferences & Theme Persistence

## Purpose
Stores all user personalization settings for Aethelis OS in a key-value store.
This enables the theme engine (OS theme, wallpaper, accent color, fonts, layout)
to persist across sessions and page reloads without requiring user accounts.

## New Tables
- `user_preferences`
  - `id` (uuid, primary key)
  - `preference_key` (text, unique) — e.g. "os_theme", "wallpaper_id", "accent_color"
  - `preference_value` (jsonb) — flexible value storage for any preference type
  - `updated_at` (timestamptz) — last updated timestamp

## Security
- RLS enabled. Single-tenant no-auth app — anon + authenticated can CRUD.
- All policies scoped `TO anon, authenticated` since there is no sign-in flow.
- `USING (true)` is intentional: the OS personalization data is local/shared, not multi-user.

## Notes
1. Uses UPSERT pattern via `preference_key` unique constraint for easy updates.
2. `preference_value` is jsonb to flexibly store strings, numbers, objects, and arrays.
3. This is a single-tenant schema — no user_id columns needed.
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  preference_key  text        NOT NULL UNIQUE,
  preference_value jsonb      NOT NULL DEFAULT 'null'::jsonb,
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_preferences" ON user_preferences;
CREATE POLICY "anon_select_preferences" ON user_preferences
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_preferences" ON user_preferences;
CREATE POLICY "anon_insert_preferences" ON user_preferences
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_preferences" ON user_preferences;
CREATE POLICY "anon_update_preferences" ON user_preferences
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_preferences" ON user_preferences;
CREATE POLICY "anon_delete_preferences" ON user_preferences
  FOR DELETE TO anon, authenticated USING (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS preferences_updated_at ON user_preferences;
CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_preferences_updated_at();

-- Seed default preferences so the app has them on first load
INSERT INTO user_preferences (preference_key, preference_value)
VALUES
  ('os_theme',         '"aethelis"'),
  ('wallpaper_id',     '"default"'),
  ('wallpaper_custom', 'null'),
  ('accent_color',     '"cyan"'),
  ('font_family',      '"inter"'),
  ('dock_position',    '"bottom"'),
  ('glass_blur',       '12'),
  ('border_radius',    '"default"'),
  ('animation_speed',  '"normal"'),
  ('icon_size',        '"medium"')
ON CONFLICT (preference_key) DO NOTHING;
