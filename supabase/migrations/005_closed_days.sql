-- 休診日管理テーブル

CREATE TABLE IF NOT EXISTS closed_days (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID        REFERENCES clinics(id) ON DELETE CASCADE,
  closed_date  DATE        NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_closed_days_updated_at
  BEFORE UPDATE ON closed_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_closed_days_clinic_id ON closed_days(clinic_id);
CREATE INDEX IF NOT EXISTS idx_closed_days_date ON closed_days(closed_date);

ALTER TABLE closed_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_closed_days"
  ON closed_days FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_select_closed_days"
  ON closed_days FOR SELECT TO anon USING (true);
