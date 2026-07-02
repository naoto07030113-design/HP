-- ============================================================
-- 未適用マイグレーションの一括適用スクリプト（冪等・何度実行してもOK）
-- Supabase ダッシュボード → SQL Editor に全文コピペして実行してください
-- 対象: 005_closed_days / 006_closed_days_enhanced / 007_merchandise
-- ============================================================

-- ── 005: 休診日テーブル ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS closed_days (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID        REFERENCES clinics(id) ON DELETE CASCADE,
  closed_date  DATE,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_closed_days_updated_at ON closed_days;
CREATE TRIGGER trg_closed_days_updated_at
  BEFORE UPDATE ON closed_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_closed_days_clinic_id ON closed_days(clinic_id);
CREATE INDEX IF NOT EXISTS idx_closed_days_date ON closed_days(closed_date);

ALTER TABLE closed_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_closed_days" ON closed_days;
CREATE POLICY "authenticated_all_closed_days"
  ON closed_days FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_closed_days" ON closed_days;
CREATE POLICY "anon_select_closed_days"
  ON closed_days FOR SELECT TO anon USING (true);

-- ── 006: 休診日の拡張（リピート・時間帯指定） ──────────────────

ALTER TABLE closed_days ALTER COLUMN closed_date DROP NOT NULL;

ALTER TABLE closed_days
  ADD COLUMN IF NOT EXISTS repeat_type TEXT NOT NULL DEFAULT 'none'
    CHECK (repeat_type IN ('none', 'weekly')),
  ADD COLUMN IF NOT EXISTS day_of_week SMALLINT
    CHECK (day_of_week BETWEEN 0 AND 6),
  ADD COLUMN IF NOT EXISTS close_type  TEXT NOT NULL DEFAULT 'all_day'
    CHECK (close_type IN ('all_day', 'morning', 'afternoon', 'time_range')),
  ADD COLUMN IF NOT EXISTS close_from  TIME,
  ADD COLUMN IF NOT EXISTS close_to    TIME;

CREATE INDEX IF NOT EXISTS idx_closed_days_repeat ON closed_days(repeat_type, day_of_week)
  WHERE repeat_type = 'weekly';

-- ── 007: 物販商品・物販予約テーブル ──────────────────────────

CREATE TABLE IF NOT EXISTS merchandise (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  price       INTEGER     NOT NULL DEFAULT 0,
  stock       INTEGER,                           -- NULL = 在庫無制限
  image_url   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchandise_bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchandise_id   UUID        NOT NULL REFERENCES merchandise(id) ON DELETE CASCADE,
  clinic_id        UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_name     TEXT        NOT NULL,
  patient_phone    TEXT,
  patient_id       UUID        REFERENCES patients(id) ON DELETE SET NULL,
  quantity         INTEGER     NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'confirmed', 'cancelled', 'delivered')),
  notes            TEXT,
  booked_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchandise_clinic        ON merchandise(clinic_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_bookings_merc ON merchandise_bookings(merchandise_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_bookings_clinic ON merchandise_bookings(clinic_id);

-- 物販: RLS 設定（管理画面 = authenticated が全操作、患者予約ページ = anon が閲覧+予約作成）

ALTER TABLE merchandise          ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_merchandise" ON merchandise;
CREATE POLICY "authenticated_all_merchandise"
  ON merchandise FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_merchandise" ON merchandise;
CREATE POLICY "anon_select_merchandise"
  ON merchandise FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "authenticated_all_merchandise_bookings" ON merchandise_bookings;
CREATE POLICY "authenticated_all_merchandise_bookings"
  ON merchandise_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_merchandise_bookings" ON merchandise_bookings;
CREATE POLICY "anon_select_merchandise_bookings"
  ON merchandise_bookings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_merchandise_bookings" ON merchandise_bookings;
CREATE POLICY "anon_insert_merchandise_bookings"
  ON merchandise_bookings FOR INSERT TO anon WITH CHECK (true);

-- リアルタイム反映（既に追加済みならエラーになるため個別に無視）

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE closed_days;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE merchandise;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE merchandise_bookings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
