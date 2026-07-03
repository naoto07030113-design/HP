-- ================================================================
-- 鍼灸整骨院 統合業務システム: 完全セットアップスクリプト
--
-- ・Supabase ダッシュボード → SQL Editor に全文コピペして実行してください
-- ・冪等（何度実行してもエラーになりません）。新規プロジェクトでも、
--   過去のマイグレーション(001〜007)を部分的に実行済みのDBでも、
--   実行後は同じ最終状態に収束します
-- ・実行後にすること:
--   1. Authentication → Users で管理者ユーザーを作成（メール+パスワード）
--   2. Database → Replication で各テーブルの Realtime を確認
--      （下部の ALTER PUBLICATION で自動追加済みですが念のため）
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 1. テーブル定義（存在しなければ作成）
-- ================================================================

CREATE TABLE IF NOT EXISTS clinics (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  address      TEXT,
  phone        TEXT,
  open_time    TEXT        NOT NULL DEFAULT '09:00',
  close_time   TEXT        NOT NULL DEFAULT '18:00',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID        REFERENCES clinics(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  role         TEXT,
  is_bookable  BOOLEAN     NOT NULL DEFAULT true,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menus (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID        REFERENCES clinics(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  duration_min  INTEGER     NOT NULL DEFAULT 30,
  price         INTEGER     NOT NULL DEFAULT 0,
  visit_type    TEXT        NOT NULL DEFAULT 'both'
                  CHECK (visit_type IN ('first', 'return', 'both')),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shifts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id     UUID        REFERENCES staff(id) ON DELETE CASCADE,
  clinic_id    UUID        REFERENCES clinics(id) ON DELETE CASCADE,
  work_date    DATE        NOT NULL,
  shift_type   TEXT        NOT NULL DEFAULT 'work'
                 CHECK (shift_type IN ('work', 'off', 'paid', 'sick', 'special')),
  start_time   TEXT        NOT NULL DEFAULT '09:00',
  end_time     TEXT        NOT NULL DEFAULT '18:00',
  break_start  TEXT,
  break_end    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, work_date)
);

CREATE TABLE IF NOT EXISTS shift_blocks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID        REFERENCES staff(id) ON DELETE CASCADE,
  block_date  DATE        NOT NULL,
  start_time  TEXT        NOT NULL,
  end_time    TEXT        NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id           UUID        REFERENCES clinics(id),
  name                TEXT        NOT NULL,
  name_kana           TEXT        NOT NULL DEFAULT '',
  gender              TEXT        NOT NULL DEFAULT 'unknown'
                        CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  birth_date          DATE,
  phone               TEXT,
  email               TEXT,
  postal_code         TEXT,
  address             TEXT,
  first_visit_date    DATE,
  primary_staff_id    UUID        REFERENCES staff(id),
  insurance_type      TEXT        NOT NULL DEFAULT 'none'
                        CHECK (insurance_type IN ('national', 'employee', 'other', 'none')),
  referral_source     TEXT,
  chief_complaint     TEXT,
  medical_history     TEXT,
  current_medications TEXT,
  allergies           TEXT,
  notes               TEXT,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      UUID        REFERENCES clinics(id),
  staff_id       UUID        REFERENCES staff(id),
  menu_id        UUID        REFERENCES menus(id),
  patient_id     UUID        REFERENCES patients(id),
  patient_name   TEXT        NOT NULL,
  patient_phone  TEXT,
  referral_name  TEXT,
  start_at       TIMESTAMPTZ NOT NULL,
  end_at         TIMESTAMPTZ NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'confirmed'
                   CHECK (status IN ('confirmed', 'visited', 'cancelled', 'no_show')),
  memo           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_records (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id               UUID        REFERENCES patients(id) ON DELETE CASCADE,
  patient_name             TEXT        NOT NULL,
  reservation_id           UUID        REFERENCES reservations(id),
  clinic_id                UUID        REFERENCES clinics(id),
  staff_id                 UUID        REFERENCES staff(id),
  visit_date               DATE        NOT NULL,
  subjective               TEXT,
  objective                TEXT,
  assessment               TEXT,
  plan                     TEXT,
  blood_pressure_systolic  INTEGER,
  blood_pressure_diastolic INTEGER,
  pulse                    INTEGER,
  temperature              NUMERIC(4,1),
  treatment_areas          TEXT[]      NOT NULL DEFAULT '{}',
  treatment_methods        TEXT[]      NOT NULL DEFAULT '{}',
  treatment_duration_min   INTEGER,
  treatment_notes          TEXT,
  next_visit_plan          TEXT,
  memo                     TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_mode     TEXT        NOT NULL DEFAULT 'text'
                    CHECK (banner_mode IN ('text', 'image')),
  title           TEXT        NOT NULL,
  body            TEXT,
  image_url       TEXT,
  image_path      TEXT,
  image_alt       TEXT,
  attachment_name TEXT,
  scope           TEXT        NOT NULL DEFAULT 'company'
                    CHECK (scope IN ('company', 'clinic')),
  clinic_id       UUID        REFERENCES clinics(id),
  type            TEXT        NOT NULL DEFAULT 'normal'
                    CHECK (type IN ('normal', 'important', 'campaign', 'closed', 'warning')),
  start_date      DATE        NOT NULL,
  end_date        DATE        NOT NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  link_url        TEXT,
  link_label      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   TEXT           NOT NULL UNIQUE,
  reservation_id   UUID           REFERENCES reservations(id),
  patient_id       UUID           REFERENCES patients(id),
  patient_name     TEXT           NOT NULL,
  clinic_id        UUID           REFERENCES clinics(id),
  staff_id         UUID           REFERENCES staff(id),
  visit_date       DATE           NOT NULL,
  subtotal         INTEGER        NOT NULL DEFAULT 0,
  discount_total   INTEGER        NOT NULL DEFAULT 0,
  tax_rate         NUMERIC(4,3)   NOT NULL DEFAULT 0.1,
  tax_amount       INTEGER        NOT NULL DEFAULT 0,
  total_amount     INTEGER        NOT NULL DEFAULT 0,
  insurance_type   TEXT           NOT NULL DEFAULT 'none'
                     CHECK (insurance_type IN ('none', 'health_insurance', 'workers_comp', 'auto_accident')),
  insurance_copay  INTEGER        NOT NULL DEFAULT 0,
  payment_method   TEXT           NOT NULL DEFAULT 'cash'
                     CHECK (payment_method IN ('cash', 'card', 'paypay', 'line_pay', 'insurance', 'other')),
  payment_amount   INTEGER        NOT NULL DEFAULT 0,
  change_amount    INTEGER        NOT NULL DEFAULT 0,
  status           TEXT           NOT NULL DEFAULT 'unpaid'
                     CHECK (status IN ('unpaid', 'paid', 'cancelled')),
  memo             TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          TEXT    PRIMARY KEY,
  invoice_id  UUID    REFERENCES invoices(id) ON DELETE CASCADE,
  menu_id     UUID    REFERENCES menus(id),
  name        TEXT    NOT NULL,
  unit_price  INTEGER NOT NULL DEFAULT 0,
  quantity    INTEGER NOT NULL DEFAULT 1,
  discount    INTEGER NOT NULL DEFAULT 0,
  subtotal    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app_settings (
  id                        INTEGER     PRIMARY KEY DEFAULT 1
                              CHECK (id = 1),
  company_name              TEXT        NOT NULL DEFAULT '有限会社イトーメディカルケア',
  timezone                  TEXT        NOT NULL DEFAULT 'Asia/Tokyo',
  max_advance_booking_days  INTEGER     NOT NULL DEFAULT 60,
  min_cancellation_hours    INTEGER     NOT NULL DEFAULT 24,
  slot_interval_min         INTEGER     NOT NULL DEFAULT 30,
  reminder_enabled          BOOLEAN     NOT NULL DEFAULT false,
  reminder_days_before      INTEGER     NOT NULL DEFAULT 1,
  reminder_time_of_day      TEXT        NOT NULL DEFAULT '10:00',
  line_reminder_enabled     BOOLEAN     NOT NULL DEFAULT false,
  sms_reminder_enabled      BOOLEAN     NOT NULL DEFAULT false,
  email_reminder_enabled    BOOLEAN     NOT NULL DEFAULT false,
  reminder_template         TEXT        NOT NULL DEFAULT '',
  thank_you_template        TEXT        NOT NULL DEFAULT '',
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS closed_days (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID        REFERENCES clinics(id) ON DELETE CASCADE,
  closed_date  DATE,
  reason       TEXT,
  repeat_type  TEXT        NOT NULL DEFAULT 'none'
                 CHECK (repeat_type IN ('none', 'weekly')),
  day_of_week  SMALLINT    CHECK (day_of_week BETWEEN 0 AND 6),
  close_type   TEXT        NOT NULL DEFAULT 'all_day'
                 CHECK (close_type IN ('all_day', 'morning', 'afternoon', 'time_range')),
  close_from   TIME,
  close_to     TIME,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchandise (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  price       INTEGER     NOT NULL DEFAULT 0,
  stock       INTEGER,
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

-- 月次レポート（経営会議AI・月次レポートページ用）
CREATE TABLE IF NOT EXISTS monthly_reports (
  id          TEXT        PRIMARY KEY,
  month       TEXT        NOT NULL,
  clinic_id   TEXT        NOT NULL DEFAULT 'all',
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================================
-- 2. 旧バージョンのテーブルに不足しているカラムを補完
--    （002〜004ベースで作成されたDBを001相当に収束させる）
-- ================================================================

ALTER TABLE shifts        ADD COLUMN IF NOT EXISTS shift_type TEXT NOT NULL DEFAULT 'work';
ALTER TABLE reservations  ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE reservations  ADD COLUMN IF NOT EXISTS referral_name TEXT;
ALTER TABLE reservations  ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE closed_days   ADD COLUMN IF NOT EXISTS repeat_type TEXT NOT NULL DEFAULT 'none';
ALTER TABLE closed_days   ADD COLUMN IF NOT EXISTS day_of_week SMALLINT;
ALTER TABLE closed_days   ADD COLUMN IF NOT EXISTS close_type TEXT NOT NULL DEFAULT 'all_day';
ALTER TABLE closed_days   ADD COLUMN IF NOT EXISTS close_from TIME;
ALTER TABLE closed_days   ADD COLUMN IF NOT EXISTS close_to TIME;
ALTER TABLE closed_days   ALTER COLUMN closed_date DROP NOT NULL;

-- ================================================================
-- 3. トリガー（存在しなければ作成）
-- ================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clinics', 'staff', 'menus', 'shifts', 'patients', 'reservations',
    'medical_records', 'announcements', 'invoices', 'closed_days',
    'merchandise', 'merchandise_bookings', 'monthly_reports'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
        AND tgrelid = t::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ================================================================
-- 4. インデックス
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_staff_clinic_id            ON staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_menus_clinic_id            ON menus(clinic_id);
CREATE INDEX IF NOT EXISTS idx_shifts_staff_id            ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_clinic_id           ON shifts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_shifts_work_date           ON shifts(work_date);
CREATE INDEX IF NOT EXISTS idx_shift_blocks_staff_id      ON shift_blocks(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_blocks_block_date    ON shift_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id         ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name_kana         ON patients(name_kana);
CREATE INDEX IF NOT EXISTS idx_patients_phone             ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_reservations_clinic_id     ON reservations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reservations_staff_id      ON reservations(staff_id);
CREATE INDEX IF NOT EXISTS idx_reservations_patient_id    ON reservations(patient_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_at      ON reservations(start_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status        ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient    ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date       ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_announcements_dates        ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id        ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_visit_date        ON invoices(visit_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id   ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_closed_days_clinic_id      ON closed_days(clinic_id);
CREATE INDEX IF NOT EXISTS idx_closed_days_date           ON closed_days(closed_date);
CREATE INDEX IF NOT EXISTS idx_closed_days_repeat         ON closed_days(repeat_type, day_of_week)
  WHERE repeat_type = 'weekly';
CREATE INDEX IF NOT EXISTS idx_merchandise_clinic         ON merchandise(clinic_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_bookings_merc  ON merchandise_bookings(merchandise_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_bookings_clinic ON merchandise_bookings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_month      ON monthly_reports(month);

-- ================================================================
-- 5. Row Level Security
--    方針:
--    ・ログイン済みスタッフ(authenticated): 全テーブル全操作可
--    ・患者(anon): 予約に必要な最小限のみ
--      - 公開情報(院・スタッフ・メニュー・お知らせ・休診日・商品・設定)の閲覧
--      - 予約の作成/閲覧/変更（Web予約・キャンセル・日時変更に必要）
--      - 患者情報(問診票)の作成のみ ※閲覧は不可
--      - 物販予約の作成のみ ※閲覧は不可
--    ・カルテ・会計・月次レポートは anon 完全不可
-- ================================================================

ALTER TABLE clinics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus                ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_blocks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE closed_days          ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise          ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports      ENABLE ROW LEVEL SECURITY;

-- ---- 過去のマイグレーションで作られた全ポリシーを削除（重複・過剰権限の掃除） ----

-- 001系
DROP POLICY IF EXISTS "authenticated_all_clinics"          ON clinics;
DROP POLICY IF EXISTS "authenticated_all_staff"            ON staff;
DROP POLICY IF EXISTS "authenticated_all_menus"            ON menus;
DROP POLICY IF EXISTS "authenticated_all_shifts"           ON shifts;
DROP POLICY IF EXISTS "authenticated_all_shift_blocks"     ON shift_blocks;
DROP POLICY IF EXISTS "authenticated_all_patients"         ON patients;
DROP POLICY IF EXISTS "authenticated_all_reservations"     ON reservations;
DROP POLICY IF EXISTS "authenticated_all_medical_records"  ON medical_records;
DROP POLICY IF EXISTS "authenticated_all_announcements"    ON announcements;
DROP POLICY IF EXISTS "authenticated_all_invoices"         ON invoices;
DROP POLICY IF EXISTS "authenticated_all_invoice_items"    ON invoice_items;
DROP POLICY IF EXISTS "authenticated_all_app_settings"     ON app_settings;
DROP POLICY IF EXISTS "anon_select_active_clinics"         ON clinics;
DROP POLICY IF EXISTS "anon_select_bookable_staff"         ON staff;
DROP POLICY IF EXISTS "anon_select_active_menus"           ON menus;
DROP POLICY IF EXISTS "anon_select_active_announcements"   ON announcements;
DROP POLICY IF EXISTS "anon_insert_reservations"           ON reservations;

-- 002系（デモ用の過剰権限）
DROP POLICY IF EXISTS "auth_all_clinics"       ON clinics;
DROP POLICY IF EXISTS "auth_all_staff"         ON staff;
DROP POLICY IF EXISTS "auth_all_menus"         ON menus;
DROP POLICY IF EXISTS "auth_all_shifts"        ON shifts;
DROP POLICY IF EXISTS "auth_all_shift_blocks"  ON shift_blocks;
DROP POLICY IF EXISTS "auth_all_reservations"  ON reservations;
DROP POLICY IF EXISTS "anon_read_clinics"      ON clinics;
DROP POLICY IF EXISTS "anon_all_staff"         ON staff;
DROP POLICY IF EXISTS "anon_all_menus"         ON menus;
DROP POLICY IF EXISTS "anon_all_shifts"        ON shifts;
DROP POLICY IF EXISTS "anon_all_shift_blocks"  ON shift_blocks;
DROP POLICY IF EXISTS "anon_all_reservations"  ON reservations;

-- 003系
DROP POLICY IF EXISTS "anon_read_announcements" ON announcements;
DROP POLICY IF EXISTS "auth_all_announcements"  ON announcements;

-- 004系（患者テーブルの anon 全権限 = 重大なプライバシーホール）
DROP POLICY IF EXISTS "anon_all_patients" ON patients;
DROP POLICY IF EXISTS "auth_all_patients" ON patients;

-- 005系
DROP POLICY IF EXISTS "authenticated_all_closed_days" ON closed_days;
DROP POLICY IF EXISTS "anon_select_closed_days"       ON closed_days;

-- apply_pending.sql（旧版）系
DROP POLICY IF EXISTS "authenticated_all_merchandise"          ON merchandise;
DROP POLICY IF EXISTS "anon_select_merchandise"                ON merchandise;
DROP POLICY IF EXISTS "authenticated_all_merchandise_bookings" ON merchandise_bookings;
DROP POLICY IF EXISTS "anon_select_merchandise_bookings"       ON merchandise_bookings;
DROP POLICY IF EXISTS "anon_insert_merchandise_bookings"       ON merchandise_bookings;

-- 本スクリプトが作るポリシー（再実行時の掃除）
DROP POLICY IF EXISTS "staff_all_clinics"              ON clinics;
DROP POLICY IF EXISTS "staff_all_staff"                ON staff;
DROP POLICY IF EXISTS "staff_all_menus"                ON menus;
DROP POLICY IF EXISTS "staff_all_shifts"               ON shifts;
DROP POLICY IF EXISTS "staff_all_shift_blocks"         ON shift_blocks;
DROP POLICY IF EXISTS "staff_all_patients"             ON patients;
DROP POLICY IF EXISTS "staff_all_reservations"         ON reservations;
DROP POLICY IF EXISTS "staff_all_medical_records"      ON medical_records;
DROP POLICY IF EXISTS "staff_all_announcements"        ON announcements;
DROP POLICY IF EXISTS "staff_all_invoices"             ON invoices;
DROP POLICY IF EXISTS "staff_all_invoice_items"        ON invoice_items;
DROP POLICY IF EXISTS "staff_all_app_settings"         ON app_settings;
DROP POLICY IF EXISTS "staff_all_closed_days"          ON closed_days;
DROP POLICY IF EXISTS "staff_all_merchandise"          ON merchandise;
DROP POLICY IF EXISTS "staff_all_merchandise_bookings" ON merchandise_bookings;
DROP POLICY IF EXISTS "staff_all_monthly_reports"      ON monthly_reports;
DROP POLICY IF EXISTS "public_select_clinics"          ON clinics;
DROP POLICY IF EXISTS "public_select_staff"            ON staff;
DROP POLICY IF EXISTS "public_select_menus"            ON menus;
DROP POLICY IF EXISTS "public_select_shifts"           ON shifts;
DROP POLICY IF EXISTS "public_select_shift_blocks"     ON shift_blocks;
DROP POLICY IF EXISTS "public_select_announcements"    ON announcements;
DROP POLICY IF EXISTS "public_select_closed_days"      ON closed_days;
DROP POLICY IF EXISTS "public_select_app_settings"     ON app_settings;
DROP POLICY IF EXISTS "public_select_merchandise"      ON merchandise;
DROP POLICY IF EXISTS "public_select_reservations"     ON reservations;
DROP POLICY IF EXISTS "public_insert_reservations"     ON reservations;
DROP POLICY IF EXISTS "public_update_reservations"     ON reservations;
DROP POLICY IF EXISTS "public_insert_patients"         ON patients;
DROP POLICY IF EXISTS "public_insert_merch_bookings"   ON merchandise_bookings;

-- ---- ログイン済みスタッフ: 全操作可 ----

CREATE POLICY "staff_all_clinics"              ON clinics              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_staff"                ON staff                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_menus"                ON menus                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_shifts"               ON shifts               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_shift_blocks"         ON shift_blocks         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_patients"             ON patients             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_reservations"         ON reservations         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_medical_records"      ON medical_records      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_announcements"        ON announcements        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_invoices"             ON invoices             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_invoice_items"        ON invoice_items        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_app_settings"         ON app_settings         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_closed_days"          ON closed_days          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_merchandise"          ON merchandise          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_merchandise_bookings" ON merchandise_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff_all_monthly_reports"      ON monthly_reports      FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---- 患者(anon): 予約に必要な最小限 ----

CREATE POLICY "public_select_clinics"       ON clinics       FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_select_staff"         ON staff         FOR SELECT TO anon USING (is_active = true AND is_bookable = true);
CREATE POLICY "public_select_menus"         ON menus         FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_select_shifts"        ON shifts        FOR SELECT TO anon USING (true);
CREATE POLICY "public_select_shift_blocks"  ON shift_blocks  FOR SELECT TO anon USING (true);
CREATE POLICY "public_select_announcements" ON announcements FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_select_closed_days"   ON closed_days   FOR SELECT TO anon USING (true);
CREATE POLICY "public_select_app_settings"  ON app_settings  FOR SELECT TO anon USING (true);
CREATE POLICY "public_select_merchandise"   ON merchandise   FOR SELECT TO anon USING (is_active = true);

-- 予約: 空き枠計算・キャンセル検索に閲覧が、Web予約に作成が、
-- キャンセル・日時変更に更新が必要（削除は不可）
CREATE POLICY "public_select_reservations" ON reservations FOR SELECT TO anon USING (true);
CREATE POLICY "public_insert_reservations" ON reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "public_update_reservations" ON reservations FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 患者情報: 問診票の登録のみ（閲覧・変更・削除は不可）
CREATE POLICY "public_insert_patients" ON patients FOR INSERT TO anon WITH CHECK (true);

-- 物販予約: 作成のみ（他の患者の予約は見えない）
CREATE POLICY "public_insert_merch_bookings" ON merchandise_bookings FOR INSERT TO anon WITH CHECK (true);

-- ================================================================
-- 6. リアルタイム配信（既に追加済みのテーブルはスキップ）
-- ================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clinics', 'staff', 'menus', 'shifts', 'shift_blocks', 'patients',
    'reservations', 'medical_records', 'announcements', 'invoices',
    'invoice_items', 'app_settings', 'closed_days', 'merchandise',
    'merchandise_bookings', 'monthly_reports'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ================================================================
-- 7. 初期データ
-- ================================================================

INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
