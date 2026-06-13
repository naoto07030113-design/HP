-- IMPORTANT NOTES --
-- 1. Run this entire file in the Supabase SQL Editor (Project > SQL Editor > New query).
-- 2. After running, go to Supabase Dashboard > Database > Replication and enable Realtime
--    for every table created here so that live updates reach connected clients.
-- 3. Create admin (staff) users via Supabase Dashboard > Authentication > Users.
--    The application uses Supabase Auth; this migration does not create auth users.

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Utility: auto-update updated_at column
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Table: clinics
-- ============================================================
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

CREATE TRIGGER trg_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: staff
-- ============================================================
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

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: menus
-- ============================================================
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

CREATE TRIGGER trg_menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: shifts
-- ============================================================
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

CREATE TRIGGER trg_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: shift_blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS shift_blocks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID        REFERENCES staff(id) ON DELETE CASCADE,
  block_date  DATE        NOT NULL,
  start_time  TEXT        NOT NULL,
  end_time    TEXT        NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: patients
-- ============================================================
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

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: reservations
-- ============================================================
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

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: medical_records
-- ============================================================
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

CREATE TRIGGER trg_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: announcements
-- ============================================================
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

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: invoices
-- ============================================================
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

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: invoice_items
-- Note: id is TEXT to allow locally-generated IDs before server sync.
-- ============================================================
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

-- ============================================================
-- Table: app_settings  (single-row table enforced by CHECK)
-- ============================================================
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

-- ============================================================
-- Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_staff_clinic_id          ON staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_menus_clinic_id          ON menus(clinic_id);
CREATE INDEX IF NOT EXISTS idx_shifts_staff_id          ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_clinic_id         ON shifts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_shifts_work_date         ON shifts(work_date);
CREATE INDEX IF NOT EXISTS idx_shift_blocks_staff_id    ON shift_blocks(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_blocks_block_date  ON shift_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id       ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name_kana       ON patients(name_kana);
CREATE INDEX IF NOT EXISTS idx_reservations_clinic_id   ON reservations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reservations_staff_id    ON reservations(staff_id);
CREATE INDEX IF NOT EXISTS idx_reservations_patient_id  ON reservations(patient_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_at    ON reservations(start_at);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient  ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date     ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_announcements_dates      ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id      ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_visit_date      ON invoices(visit_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE clinics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff           ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus           ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings    ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Authenticated users: full access to all tables
-- ------------------------------------------------------------
CREATE POLICY "authenticated_all_clinics"
  ON clinics FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_staff"
  ON staff FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_menus"
  ON menus FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_shifts"
  ON shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_shift_blocks"
  ON shift_blocks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_patients"
  ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_reservations"
  ON reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_medical_records"
  ON medical_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_announcements"
  ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_invoices"
  ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_invoice_items"
  ON invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_app_settings"
  ON app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- Anon users: SELECT active public data
-- ------------------------------------------------------------
CREATE POLICY "anon_select_active_clinics"
  ON clinics FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "anon_select_bookable_staff"
  ON staff FOR SELECT TO anon USING (is_active = true AND is_bookable = true);

CREATE POLICY "anon_select_active_menus"
  ON menus FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "anon_select_active_announcements"
  ON announcements FOR SELECT TO anon USING (is_active = true);

-- ------------------------------------------------------------
-- Anon users: INSERT into reservations (patient portal booking)
-- ------------------------------------------------------------
CREATE POLICY "anon_insert_reservations"
  ON reservations FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- Default app_settings row (single row guaranteed by PK check)
-- ============================================================
INSERT INTO app_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
-- 鍼灸整骨院 統合業務システム: 予約管理テーブル
-- Supabase SQL Editor で実行してください

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 院
CREATE TABLE IF NOT EXISTS clinics (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  address     text,
  phone       text,
  open_time   time NOT NULL DEFAULT '09:00',
  close_time  time NOT NULL DEFAULT '18:00',
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- スタッフ
CREATE TABLE IF NOT EXISTS staff (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       uuid REFERENCES clinics(id) ON DELETE CASCADE,
  name            text NOT NULL,
  role            text,
  is_bookable     boolean NOT NULL DEFAULT true,
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- メニュー
CREATE TABLE IF NOT EXISTS menus (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       uuid REFERENCES clinics(id) ON DELETE CASCADE,
  name            text NOT NULL,
  duration_min    integer NOT NULL DEFAULT 60,
  price           integer NOT NULL DEFAULT 0,
  visit_type      text NOT NULL DEFAULT 'both'
                  CHECK (visit_type IN ('first','return','both')),
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- シフト
CREATE TABLE IF NOT EXISTS shifts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id        uuid REFERENCES staff(id) ON DELETE CASCADE,
  clinic_id       uuid REFERENCES clinics(id) ON DELETE CASCADE,
  work_date       date NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  break_start     time,
  break_end       time,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, work_date)
);

-- 予約不可ブロック
CREATE TABLE IF NOT EXISTS shift_blocks (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id        uuid REFERENCES staff(id) ON DELETE CASCADE,
  block_date      date NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 予約（patient_id は将来 patients テーブルへの外部キー）
CREATE TABLE IF NOT EXISTS reservations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       uuid REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id        uuid REFERENCES staff(id) ON DELETE SET NULL,
  menu_id         uuid REFERENCES menus(id) ON DELETE SET NULL,
  patient_id      uuid,   -- 将来: REFERENCES patients(id)
  patient_name    text NOT NULL,
  patient_phone   text,
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed','visited','cancelled','no_show')),
  memo            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_staff_clinic_id ON staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_menus_clinic_id ON menus(clinic_id);
CREATE INDEX IF NOT EXISTS idx_shifts_staff_id ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_work_date ON shifts(work_date);
CREATE INDEX IF NOT EXISTS idx_reservations_clinic_id ON reservations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_at ON reservations(start_at);
CREATE INDEX IF NOT EXISTS idx_reservations_staff_id ON reservations(staff_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clinics_updated_at') THEN
    CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_staff_updated_at') THEN
    CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menus_updated_at') THEN
    CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shifts_updated_at') THEN
    CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reservations_updated_at') THEN
    CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全操作可能（サービスロールはRLSをバイパス）
CREATE POLICY "auth_all_clinics"      ON clinics      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_staff"        ON staff        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_menus"        ON menus        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_shifts"       ON shifts       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_shift_blocks" ON shift_blocks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_reservations" ON reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- anon ユーザーも読み取り可能（デモ用）
CREATE POLICY "anon_read_clinics"      ON clinics      FOR SELECT TO anon USING (true);
CREATE POLICY "anon_all_staff"         ON staff        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_menus"         ON menus        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_shifts"        ON shifts       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_shift_blocks"  ON shift_blocks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_reservations"  ON reservations FOR ALL TO anon USING (true) WITH CHECK (true);
-- お知らせ・バナー管理テーブル
-- 将来: トップページ・採用・LP・ブログ告知・LINE誘導にも流用可能

CREATE TABLE IF NOT EXISTS announcements (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  banner_mode    text NOT NULL DEFAULT 'text' CHECK (banner_mode IN ('text','image')),
  title          text NOT NULL,
  body           text,
  image_url      text,          -- Supabase Storage 公開URL
  image_path     text,          -- Supabase Storage パス
  image_alt      text,
  scope          text NOT NULL DEFAULT 'company' CHECK (scope IN ('company','clinic')),
  clinic_id      uuid REFERENCES clinics(id) ON DELETE CASCADE,
  type           text NOT NULL DEFAULT 'normal'
                 CHECK (type IN ('normal','important','campaign','closed','warning')),
  start_date     date NOT NULL,
  end_date       date NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  display_order  integer NOT NULL DEFAULT 0,
  link_url       text,
  link_label     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_scope ON announcements(scope);
CREATE INDEX IF NOT EXISTS idx_announcements_clinic_id ON announcements(clinic_id);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_order ON announcements(display_order);

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_announcements"  ON announcements FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_announcements"   ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Supabase Storage バケット（SQL Editorで別途実行）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('announcement-banners', 'announcement-banners', true);
-- 第2段階: 患者管理テーブル

CREATE TABLE IF NOT EXISTS patients (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id            uuid REFERENCES clinics(id) ON DELETE CASCADE,
  -- 基本情報
  name                 text NOT NULL,
  name_kana            text NOT NULL DEFAULT '',
  gender               text NOT NULL DEFAULT 'unknown'
                       CHECK (gender IN ('male','female','other','unknown')),
  birth_date           date,
  phone                text,
  email                text,
  postal_code          text,
  address              text,
  -- 医療管理
  first_visit_date     date,
  primary_staff_id     uuid REFERENCES staff(id) ON DELETE SET NULL,
  insurance_type       text NOT NULL DEFAULT 'none'
                       CHECK (insurance_type IN ('national','employee','other','none')),
  referral_source      text,
  -- 問診情報
  chief_complaint      text,
  medical_history      text,
  current_medications  text,
  allergies            text,
  notes                text,    -- 院内メモ（患者非表示）
  -- 管理
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- reservations.patient_id に外部キー制約を追加
ALTER TABLE reservations
  ADD CONSTRAINT fk_reservations_patient
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_name_kana ON patients(name_kana);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_first_visit ON patients(first_visit_date);

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_patients"  ON patients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_patients"  ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ============================================================
-- 005_payroll.sql  給与人事労務システム
-- ============================================================

-- ============================================================
-- Table: payroll_employees  従業員給与マスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_employees (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id                    UUID        REFERENCES staff(id) ON DELETE CASCADE,
  employee_number             TEXT        UNIQUE,
  contract_type               TEXT        NOT NULL DEFAULT '正社員'
                                CHECK (contract_type IN ('正社員','パート','業務委託')),
  hire_date                   DATE        NOT NULL,
  resignation_date            DATE,
  birth_date                  DATE,
  -- 賃金設定
  basic_salary                INTEGER     NOT NULL DEFAULT 0,  -- 基本給（月給）
  hourly_wage                 INTEGER     NOT NULL DEFAULT 0,  -- 時給（パート）
  fixed_overtime_hours        NUMERIC(5,2) NOT NULL DEFAULT 0, -- 固定残業時間
  fixed_overtime_amount       INTEGER     NOT NULL DEFAULT 0,  -- 固定残業代
  -- 社会保険
  health_insurance_enrolled   BOOLEAN     NOT NULL DEFAULT true,
  pension_enrolled            BOOLEAN     NOT NULL DEFAULT true,
  employment_insurance_enrolled BOOLEAN   NOT NULL DEFAULT true,
  -- 税務
  dependent_count             INTEGER     NOT NULL DEFAULT 0,
  resident_tax_monthly        INTEGER     NOT NULL DEFAULT 0,  -- 住民税月額（前年確定）
  -- 通勤
  commute_allowance_monthly   INTEGER     NOT NULL DEFAULT 0,  -- 通勤手当月額（非課税）
  commute_allowance_taxable   INTEGER     NOT NULL DEFAULT 0,  -- 課税通勤手当
  -- 銀行口座
  bank_name                   TEXT,
  bank_branch                 TEXT,
  bank_account_type           TEXT        DEFAULT '普通' CHECK (bank_account_type IN ('普通','当座')),
  bank_account_number         TEXT,
  bank_account_holder         TEXT,
  -- メタ
  notes                       TEXT,
  is_active                   BOOLEAN     NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payroll_employees_updated_at
  BEFORE UPDATE ON payroll_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: payroll_attendance  月次勤怠記録
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_attendance (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_employee_id     UUID        NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  year                    INTEGER     NOT NULL,
  month                   INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  -- 出勤情報
  scheduled_work_days     INTEGER     NOT NULL DEFAULT 0,  -- 所定労働日数
  actual_work_days        INTEGER     NOT NULL DEFAULT 0,  -- 出勤日数
  paid_leave_days         NUMERIC(4,1) NOT NULL DEFAULT 0, -- 有給取得日数
  absence_days            NUMERIC(4,1) NOT NULL DEFAULT 0, -- 欠勤日数
  late_early_leave_times  INTEGER     NOT NULL DEFAULT 0,  -- 遅刻・早退回数
  -- 労働時間
  scheduled_work_hours    NUMERIC(6,2) NOT NULL DEFAULT 0, -- 所定労働時間
  actual_work_hours       NUMERIC(6,2) NOT NULL DEFAULT 0, -- 実労働時間
  overtime_hours          NUMERIC(6,2) NOT NULL DEFAULT 0, -- 時間外労働（月60H以内）
  overtime_hours_over60   NUMERIC(6,2) NOT NULL DEFAULT 0, -- 時間外（月60H超）
  late_night_hours        NUMERIC(6,2) NOT NULL DEFAULT 0, -- 深夜労働
  holiday_work_hours      NUMERIC(6,2) NOT NULL DEFAULT 0, -- 休日労働
  -- 備考
  notes                   TEXT,
  submitted_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payroll_employee_id, year, month)
);

CREATE TRIGGER trg_payroll_attendance_updated_at
  BEFORE UPDATE ON payroll_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: payroll_calculations  月次給与計算結果
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_calculations (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_employee_id         UUID        NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  year                        INTEGER     NOT NULL,
  month                       INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  payment_date                DATE,
  -- 支給項目
  basic_salary                INTEGER     NOT NULL DEFAULT 0,  -- 基本給
  fixed_overtime_pay          INTEGER     NOT NULL DEFAULT 0,  -- 固定残業代
  excess_overtime_pay         INTEGER     NOT NULL DEFAULT 0,  -- 超過残業手当
  late_night_pay              INTEGER     NOT NULL DEFAULT 0,  -- 深夜手当
  holiday_work_pay            INTEGER     NOT NULL DEFAULT 0,  -- 休日手当
  absence_deduction           INTEGER     NOT NULL DEFAULT 0,  -- 欠勤控除（マイナス）
  commute_allowance           INTEGER     NOT NULL DEFAULT 0,  -- 非課税通勤手当
  commute_allowance_taxable   INTEGER     NOT NULL DEFAULT 0,  -- 課税通勤手当
  performance_allowance       INTEGER     NOT NULL DEFAULT 0,  -- 業績手当
  other_allowances            INTEGER     NOT NULL DEFAULT 0,  -- その他手当合計
  gross_pay                   INTEGER     NOT NULL DEFAULT 0,  -- 支給合計
  taxable_gross               INTEGER     NOT NULL DEFAULT 0,  -- 課税支給額
  -- 控除項目
  health_insurance            INTEGER     NOT NULL DEFAULT 0,  -- 健康保険料
  nursing_care_insurance      INTEGER     NOT NULL DEFAULT 0,  -- 介護保険料
  welfare_pension             INTEGER     NOT NULL DEFAULT 0,  -- 厚生年金保険料
  employment_insurance        INTEGER     NOT NULL DEFAULT 0,  -- 雇用保険料
  income_tax                  INTEGER     NOT NULL DEFAULT 0,  -- 所得税（源泉徴収）
  resident_tax                INTEGER     NOT NULL DEFAULT 0,  -- 住民税
  other_deductions            INTEGER     NOT NULL DEFAULT 0,  -- その他控除
  total_deductions            INTEGER     NOT NULL DEFAULT 0,  -- 控除合計
  -- 差引
  net_pay                     INTEGER     NOT NULL DEFAULT 0,  -- 差引支給額
  -- 標準報酬月額
  standard_monthly_salary     INTEGER     NOT NULL DEFAULT 0,  -- 標準報酬月額
  -- ステータス
  status                      TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','confirmed','paid')),
  insurance_rate_id           UUID,  -- 適用した保険料率
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payroll_employee_id, year, month)
);

CREATE TRIGGER trg_payroll_calculations_updated_at
  BEFORE UPDATE ON payroll_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: payroll_allowances  手当明細
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_allowances (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id  UUID        NOT NULL REFERENCES payroll_calculations(id) ON DELETE CASCADE,
  category        TEXT        NOT NULL,  -- 基本/業績手当/通勤手当/特別手当/有給手当/残業手当/その他
  description     TEXT        NOT NULL,  -- 詳細説明
  amount          INTEGER     NOT NULL DEFAULT 0,
  is_taxable      BOOLEAN     NOT NULL DEFAULT true,
  is_deduction    BOOLEAN     NOT NULL DEFAULT false,  -- 控除の場合true
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: payroll_submissions  月次給与申請書（PDF）
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_submissions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  year                INTEGER     NOT NULL,
  month               INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  department          TEXT        NOT NULL,  -- 部署名
  submitted_by        TEXT,
  submitted_date      DATE,
  file_name           TEXT,
  file_url            TEXT,
  raw_text            TEXT,  -- PDF抽出テキスト
  status              TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','parsed','validated','error','processed')),
  employee_count      INTEGER,
  parsed_data         JSONB,  -- AI解析結果
  discrepancies       JSONB,  -- 整合性エラー一覧
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payroll_submissions_updated_at
  BEFORE UPDATE ON payroll_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: payroll_submission_items  申請書の個人明細
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_submission_items (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id           UUID        NOT NULL REFERENCES payroll_submissions(id) ON DELETE CASCADE,
  line_number             INTEGER,    -- 申請書の番号
  employee_name           TEXT        NOT NULL,
  contract_type           TEXT,       -- 正社員/パート/業務委託
  items                   JSONB       NOT NULL DEFAULT '[]',  -- [{category, description, amount}]
  total_amount            INTEGER     NOT NULL DEFAULT 0,
  is_validated            BOOLEAN     NOT NULL DEFAULT false,
  discrepancy_notes       TEXT,
  matched_employee_id     UUID        REFERENCES payroll_employees(id),
  payroll_calculation_id  UUID        REFERENCES payroll_calculations(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: social_insurance_rates  社会保険料率マスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS social_insurance_rates (
  id                                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_date                      DATE        NOT NULL,
  prefecture                          TEXT        NOT NULL DEFAULT '東京',
  association                         TEXT        NOT NULL DEFAULT '協会けんぽ',
  health_insurance_employee_rate      NUMERIC(6,4) NOT NULL,  -- 健保料率（労働者）%
  health_insurance_employer_rate      NUMERIC(6,4) NOT NULL,  -- 健保料率（事業主）%
  nursing_care_employee_rate          NUMERIC(6,4) NOT NULL DEFAULT 0,  -- 介護保険（40歳以上）
  nursing_care_employer_rate          NUMERIC(6,4) NOT NULL DEFAULT 0,
  pension_employee_rate               NUMERIC(6,4) NOT NULL,  -- 厚生年金料率（労働者）%
  pension_employer_rate               NUMERIC(6,4) NOT NULL,  -- 厚生年金料率（事業主）%
  employment_insurance_employee_rate  NUMERIC(6,4) NOT NULL,  -- 雇用保険（労働者）%
  employment_insurance_employer_rate  NUMERIC(6,4) NOT NULL,  -- 雇用保険（事業主）%
  is_active                           BOOLEAN     NOT NULL DEFAULT false,
  notes                               TEXT,
  created_at                          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: minimum_wage_rates  最低賃金マスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS minimum_wage_rates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_date  DATE        NOT NULL,
  prefecture      TEXT        NOT NULL,
  hourly_wage     INTEGER     NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (effective_date, prefecture)
);

-- ============================================================
-- Table: payroll_compliance  法改正・制度変更管理
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_compliance (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category        TEXT        NOT NULL,  -- 最低賃金/社会保険/税制/労働法/育休/その他
  law_name        TEXT        NOT NULL,
  effective_date  DATE        NOT NULL,
  prefecture      TEXT,
  summary         TEXT        NOT NULL,
  detail          TEXT,
  impact_level    TEXT        NOT NULL DEFAULT 'medium'
                    CHECK (impact_level IN ('critical','high','medium','low')),
  action_required TEXT,
  is_applied      BOOLEAN     NOT NULL DEFAULT false,
  applied_at      TIMESTAMPTZ,
  applied_by      TEXT,
  source_url      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payroll_compliance_updated_at
  BEFORE UPDATE ON payroll_compliance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payroll_employees_staff_id   ON payroll_employees(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_active      ON payroll_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_attendance_emp_ym     ON payroll_attendance(payroll_employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_emp_ym           ON payroll_calculations(payroll_employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_status           ON payroll_calculations(status);
CREATE INDEX IF NOT EXISTS idx_payroll_allowances_calc       ON payroll_allowances(calculation_id);
CREATE INDEX IF NOT EXISTS idx_payroll_submissions_ym        ON payroll_submissions(year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_sub_items_sub         ON payroll_submission_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_compliance_effective          ON payroll_compliance(effective_date);
CREATE INDEX IF NOT EXISTS idx_compliance_applied            ON payroll_compliance(is_applied);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE payroll_employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calculations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_allowances        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_submission_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_insurance_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE minimum_wage_rates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_compliance        ENABLE ROW LEVEL SECURITY;

-- Authenticated users: full access
CREATE POLICY "auth_all_payroll_employees"        ON payroll_employees        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_attendance"       ON payroll_attendance       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_calculations"     ON payroll_calculations     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_allowances"       ON payroll_allowances       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_submissions"      ON payroll_submissions      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_submission_items" ON payroll_submission_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_social_insurance_rates"   ON social_insurance_rates   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_minimum_wage_rates"       ON minimum_wage_rates       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_compliance"       ON payroll_compliance       FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Seed: 社会保険料率（令和6年度 協会けんぽ）
-- ============================================================
INSERT INTO social_insurance_rates (
  effective_date, prefecture, association,
  health_insurance_employee_rate, health_insurance_employer_rate,
  nursing_care_employee_rate, nursing_care_employer_rate,
  pension_employee_rate, pension_employer_rate,
  employment_insurance_employee_rate, employment_insurance_employer_rate,
  is_active, notes
) VALUES
-- 東京 令和6年3月〜
('2024-03-01', '東京', '協会けんぽ', 4.990, 4.990, 0.910, 0.910, 9.150, 9.150, 0.600, 0.950, false,
 '令和6年度 協会けんぽ 東京支部'),
-- 千葉 令和6年3月〜
('2024-03-01', '千葉', '協会けんぽ', 4.905, 4.905, 0.910, 0.910, 9.150, 9.150, 0.600, 0.950, false,
 '令和6年度 協会けんぽ 千葉支部'),
-- 神奈川 令和6年3月〜
('2024-03-01', '神奈川', '協会けんぽ', 5.115, 5.115, 0.910, 0.910, 9.150, 9.150, 0.600, 0.950, false,
 '令和6年度 協会けんぽ 神奈川支部'),
-- 東京 令和7年3月〜（予定値 - 要確認）
('2025-03-01', '東京', '協会けんぽ', 4.990, 4.990, 0.950, 0.950, 9.150, 9.150, 0.600, 0.950, true,
 '令和7年度 協会けんぽ 東京支部（介護保険料率 1.90%に改定）'),
('2025-03-01', '千葉', '協会けんぽ', 4.905, 4.905, 0.950, 0.950, 9.150, 9.150, 0.600, 0.950, true,
 '令和7年度 協会けんぽ 千葉支部'),
('2025-03-01', '神奈川', '協会けんぽ', 5.115, 5.115, 0.950, 0.950, 9.150, 9.150, 0.600, 0.950, true,
 '令和7年度 協会けんぽ 神奈川支部')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: 最低賃金（令和6年10月〜）
-- ============================================================
INSERT INTO minimum_wage_rates (effective_date, prefecture, hourly_wage, notes) VALUES
('2024-10-01', '東京',   1163, '令和6年10月改定'),
('2024-10-01', '千葉',   1076, '令和6年10月改定'),
('2024-10-01', '神奈川', 1162, '令和6年10月改定'),
('2024-10-01', '埼玉',   1078, '令和6年10月改定'),
('2024-10-01', '大阪',   1114, '令和6年10月改定'),
('2025-10-01', '東京',   1200, '令和7年10月改定（目安）'),
('2025-10-01', '千葉',   1113, '令和7年10月改定（目安）'),
('2025-10-01', '神奈川', 1200, '令和7年10月改定（目安）')
ON CONFLICT (effective_date, prefecture) DO NOTHING;

-- ============================================================
-- Seed: 法改正・コンプライアンス情報
-- ============================================================
INSERT INTO payroll_compliance (category, law_name, effective_date, prefecture, summary, detail, impact_level, action_required, is_applied) VALUES
('労働法', '労働基準法改正（月60時間超残業割増率引上げ）', '2023-04-01', NULL,
 '中小企業にも月60時間超の時間外労働に対する50%割増賃金が適用',
 '月60時間を超える法定時間外労働に対して50%以上の割増賃金を支払う義務。それ以下は25%。',
 'critical', '給与計算システムの残業計算ロジックを60H超対応に修正', true),

('労働法', '労働条件明示ルール改正', '2024-04-01', NULL,
 '労働条件通知書の記載事項の追加義務化',
 '就業場所・業務の変更範囲、更新上限の有無、無期転換申込機会・条件を明示することが義務付けられた。',
 'high', '雇用契約書・通知書のテンプレートを改定する', true),

('社会保険', '社会保険適用拡大（パート・アルバイト）', '2024-10-01', NULL,
 '社会保険適用拡大：従業員51人以上の企業でパート・アルバイトへの適用拡大',
 '週20時間以上・月額賃金8.8万円以上・2か月超雇用見込・学生でないことが条件。',
 'critical', '該当パート従業員の社会保険加入手続きを確認・実施', true),

('最低賃金', '最低賃金改定（令和6年10月）', '2024-10-01', '全国',
 '全国加重平均1,055円へ。東京1,163円、千葉1,076円、神奈川1,162円。',
 '地域別最低賃金の改定。時給・日給・月給換算を行い最低賃金以上であることを確認。',
 'critical', '全パート・アルバイト従業員の時給が最低賃金以上であることを確認', true),

('税制', '定額減税（令和6年）', '2024-06-01', NULL,
 '1人あたり所得税3万円・住民税1万円の定額減税を実施',
 '令和6年6月以降の給与から所得税・住民税の定額減税を実施。月次減税事務が必要。',
 'high', '6月分以降の給与計算で定額減税を適用済みか確認', true),

('社会保険', '介護保険料率改定（令和7年度）', '2025-03-01', NULL,
 '介護保険料率が1.82%から1.90%に改定（協会けんぽ）',
 '令和7年3月分（4月納付分）から適用。40歳以上65歳未満の被保険者が対象。',
 'high', '令和7年3月分給与から新料率を適用', false),

('労働法', '育児介護休業法改正（段階的施行）', '2025-04-01', NULL,
 '子の年齢に応じた柔軟な働き方確保措置義務化（従業員300人超）',
 '①所定外労働の制限②テレワーク等の措置③短時間勤務④育児時間⑤始終業時刻の変更から2つ以上を選択提供。',
 'medium', '対象となる場合は就業規則・制度整備が必要', false),

('最低賃金', '最低賃金改定（令和7年10月目安）', '2025-10-01', '全国',
 '全国加重平均1,114円目安。東京1,200円、千葉1,113円、神奈川1,200円。',
 '中央最低賃金審議会の目安額。各都道府県審議会で最終決定。',
 'critical', '令和7年10月以降、パート従業員の時給を確認・改定', false),

('社会保険', '年収の壁への対応（106万円・130万円の壁）', '2024-10-01', NULL,
 '「年収の壁・支援強化パッケージ」。社会保険適用で手取り減を防ぐ事業主への支援。',
 '社会保険加入促進のため事業主が賃金を引き上げた場合に支援金（1人当たり最大50万円）を支給。',
 'medium', '該当従業員の状況確認と賃金改定検討', false)
ON CONFLICT DO NOTHING;
-- 006_payslip_tokens.sql
-- 給与明細電子送付: payroll_employeesにメール追加 + 送付トークンテーブル

-- メールアドレスを従業員テーブルに追加
ALTER TABLE payroll_employees
  ADD COLUMN IF NOT EXISTS email text;

-- 給与明細閲覧トークン
CREATE TABLE IF NOT EXISTS payslip_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token                uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  calculation_id       uuid NOT NULL REFERENCES payroll_calculations(id) ON DELETE CASCADE,
  payroll_employee_id  uuid NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  email           text NOT NULL,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  sent_at         timestamptz,
  viewed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payslip_tokens_token               ON payslip_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payslip_tokens_calculation_id      ON payslip_tokens(calculation_id);
CREATE INDEX IF NOT EXISTS idx_payslip_tokens_payroll_employee_id ON payslip_tokens(payroll_employee_id);

-- RLS
ALTER TABLE payslip_tokens ENABLE ROW LEVEL SECURITY;

-- 管理者（認証済み）は全操作可
CREATE POLICY "payslip_tokens_auth_all" ON payslip_tokens
  FOR ALL USING (auth.role() = 'authenticated');

-- 有効なトークンによるパブリック閲覧（token列で特定）
CREATE POLICY "payslip_tokens_public_view" ON payslip_tokens
  FOR SELECT USING (expires_at > now());
-- 007_law_check.sql
-- AI法改正スキャン機能

-- payroll_compliance に AI 検知フラグ追加
ALTER TABLE payroll_compliance
  ADD COLUMN IF NOT EXISTS ai_detected  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scan_run_id  UUID,
  ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending'
    CHECK (review_status IN ('pending','acknowledged'));

-- AIスキャン実行履歴
CREATE TABLE IF NOT EXISTS payroll_law_scans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  model         TEXT        NOT NULL DEFAULT 'gpt-4o',
  found_count   INTEGER     NOT NULL DEFAULT 0,
  new_count     INTEGER     NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running','completed','error')),
  error_message TEXT,
  raw_response  TEXT
);

-- AIが提案する料率変更（承認フロー付き）
CREATE TABLE IF NOT EXISTS payroll_rate_proposals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_id   UUID        REFERENCES payroll_compliance(id) ON DELETE CASCADE,
  scan_run_id     UUID        REFERENCES payroll_law_scans(id),
  title           TEXT        NOT NULL,
  category        TEXT        NOT NULL,
  change_type     TEXT        NOT NULL
                    CHECK (change_type IN ('rate_update','new_item','manual_required')),
  description     TEXT,
  source_url      TEXT,
  effective_date  DATE,
  proposed_value  JSONB,
  review_status   TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (review_status IN ('pending','approved','rejected','applied')),
  reviewed_at     TIMESTAMPTZ,
  applied_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_law_scans_scanned_at           ON payroll_law_scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_proposals_review_status   ON payroll_rate_proposals(review_status);
CREATE INDEX IF NOT EXISTS idx_rate_proposals_compliance_id   ON payroll_rate_proposals(compliance_id);
CREATE INDEX IF NOT EXISTS idx_compliance_ai_detected         ON payroll_compliance(ai_detected, review_status);

ALTER TABLE payroll_law_scans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_rate_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "law_scans_auth_all"      ON payroll_law_scans      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rate_proposals_auth_all" ON payroll_rate_proposals  FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Contract templates (4 pre-seeded)
CREATE TABLE IF NOT EXISTS contract_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  department    TEXT        NOT NULL CHECK (department IN ('療術', '福祉')),
  contract_type TEXT        NOT NULL CHECK (contract_type IN ('正社員', 'パート')),
  title         TEXT        NOT NULL,
  content       TEXT        NOT NULL,  -- HTML with {{変数名}} placeholders
  variables     JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- list of {key, label, default}
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_contracts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_employee_id  UUID        NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  template_id          UUID        REFERENCES contract_templates(id),
  title                TEXT        NOT NULL,
  content              TEXT        NOT NULL,  -- rendered content (variables filled)
  variables_used       JSONB,                 -- snapshot of filled variables
  status               TEXT        NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','sent','signed','cancelled')),
  valid_from           DATE,
  valid_until          DATE,
  sent_at              TIMESTAMPTZ,
  sign_token           UUID        UNIQUE DEFAULT gen_random_uuid(),
  signed_at            TIMESTAMPTZ,
  signer_name          TEXT,
  signer_ip            TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Persistent staff portals (one per employee, long-lived token)
CREATE TABLE IF NOT EXISTS staff_portals (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_token         UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  payroll_employee_id  UUID        NOT NULL UNIQUE REFERENCES payroll_employees(id) ON DELETE CASCADE,
  email                TEXT        NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee   ON employee_contracts(payroll_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_status     ON employee_contracts(status);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_sign_token ON employee_contracts(sign_token);
CREATE INDEX IF NOT EXISTS idx_staff_portals_token           ON staff_portals(portal_token);

ALTER TABLE contract_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contracts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_portals       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_auth_all"  ON contract_templates  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "emp_contracts_auth"  ON employee_contracts  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "portals_auth_all"    ON staff_portals       FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Public read for signing (by sign_token)
CREATE POLICY "emp_contracts_public_sign" ON employee_contracts FOR SELECT USING (true);
CREATE POLICY "portals_public_view"       ON staff_portals       FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_contract_templates_updated_at();

CREATE OR REPLACE FUNCTION update_employee_contracts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_employee_contracts_updated_at BEFORE UPDATE ON employee_contracts FOR EACH ROW EXECUTE FUNCTION update_employee_contracts_updated_at();

-- Seed 4 templates
INSERT INTO contract_templates (department, contract_type, title, content, variables) VALUES

('療術', '正社員', '雇用契約書（療術部門・正社員）', '
<div style="font-family: ''MS Gothic'', ''Hiragino Kaku Gothic ProN'', sans-serif; line-height: 1.8; color: #000; padding: 0 8px;">
<h2 style="text-align:center; font-size:18px; margin-bottom:24px; letter-spacing:4px;">雇用契約書</h2>

<p>有限会社イトーメディカルケア（以下「甲」という）と<strong>{{氏名}}</strong>（以下「乙」という）は、以下の条件で雇用契約を締結する。</p>

<h3>第1条（雇用形態）</h3>
<p>正社員として採用する。</p>

<h3>第2条（契約期間）</h3>
<p>期間の定めなし　　採用日：{{入社日}}</p>

<h3>第3条（就業場所・業務内容）</h3>
<p>就業場所：{{就業場所}}<br>
業務内容：あん摩マッサージ指圧・はり・きゅう施術業務、および会社が指示するその他付随業務</p>

<h3>第4条（労働時間・休憩）</h3>
<p>始業：{{始業時刻}}　終業：{{終業時刻}}（休憩60分）<br>
所定労働時間：1日8時間・週40時間<br>
シフト制につき別途シフト表による。</p>

<h3>第5条（時間外労働・固定残業）</h3>
<p>業務上必要な場合、時間外・休日労働を命じることがある。<br>
固定残業代 <strong>{{固定残業代}}円</strong>（月{{固定残業時間}}時間分）を基本給に含む。<br>
固定残業時間を超えた場合は、追加で割増賃金を支払う。</p>

<h3>第6条（賃金）</h3>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr><td style="border:1px solid #999; padding:4px 8px; width:40%;">基本給</td><td style="border:1px solid #999; padding:4px 8px;"><strong>{{基本給}}円</strong>/月</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">通勤手当</td><td style="border:1px solid #999; padding:4px 8px;">実費支給（上限 月15,000円・非課税分）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">支払日</td><td style="border:1px solid #999; padding:4px 8px;">毎月25日（銀行振込）</td></tr>
</table>

<h3>第7条（休日・休暇）</h3>
<p>週休2日制（シフトによる）。年次有給休暇は労働基準法第39条による。</p>

<h3>第8条（社会保険）</h3>
<p>健康保険・厚生年金保険・雇用保険・労災保険に加入する。</p>

<h3>第9条（就業規則）</h3>
<p>本契約に定めのない事項は会社の就業規則による。乙はこれを遵守するものとする。</p>

<h3>第10条（機密保持）</h3>
<p>在職中および退職後も、業務上知り得た患者・顧客情報を第三者に漏洩してはならない。</p>

<br>
<p>本契約の締結を証するため、本書を作成する。</p>
<br>
<table style="width:100%;">
<tr>
<td style="width:50%; padding:8px;">甲：有限会社イトーメディカルケア<br><br>代表者　　　　　　　　　　　　印</td>
<td style="width:50%; padding:8px;">乙：{{氏名}}<br><br>署名　　　　　　　　　　　　　</td>
</tr>
</table>
</div>
', '[
  {"key":"氏名","label":"氏名","default":""},
  {"key":"入社日","label":"入社日","default":""},
  {"key":"就業場所","label":"就業場所","default":"イトーメディカルケア 各院"},
  {"key":"始業時刻","label":"始業時刻","default":"09:00"},
  {"key":"終業時刻","label":"終業時刻","default":"18:00"},
  {"key":"固定残業時間","label":"固定残業時間（時間）","default":"20"},
  {"key":"固定残業代","label":"固定残業代（円）","default":""},
  {"key":"基本給","label":"基本給（円）","default":""}
]'::jsonb),

('療術', 'パート', '雇用契約書（療術部門・パートタイム）', '
<div style="font-family: ''MS Gothic'', ''Hiragino Kaku Gothic ProN'', sans-serif; line-height: 1.8; color: #000; padding: 0 8px;">
<h2 style="text-align:center; font-size:18px; margin-bottom:24px; letter-spacing:4px;">雇用契約書（パートタイム）</h2>

<p>有限会社イトーメディカルケア（以下「甲」という）と<strong>{{氏名}}</strong>（以下「乙」という）は、パートタイム労働法に基づき以下の条件で雇用契約を締結する。</p>

<h3>第1条（雇用形態）</h3>
<p>パートタイム労働者（短時間労働者）として採用する。</p>

<h3>第2条（契約期間）</h3>
<p>{{契約開始日}} から {{契約終了日}} まで<br>
（更新の場合あり。更新の有無は期間満了の30日前に通知する。）</p>

<h3>第3条（就業場所・業務内容）</h3>
<p>就業場所：{{就業場所}}<br>
業務内容：あん摩マッサージ指圧・はり・きゅう施術補助業務、受付・清掃業務、その他付随業務</p>

<h3>第4条（労働時間・休憩）</h3>
<p>週の所定労働時間：{{週所定時間}}時間<br>
シフト制につき別途シフト表による。<br>
休憩：労働基準法の定めによる。</p>

<h3>第5条（賃金）</h3>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr><td style="border:1px solid #999; padding:4px 8px; width:40%;">時給</td><td style="border:1px solid #999; padding:4px 8px;"><strong>{{時給}}円</strong>（地域最低賃金以上）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">時間外割増</td><td style="border:1px solid #999; padding:4px 8px;">法定時間外：25%増　深夜（22時〜5時）：25%増</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">通勤手当</td><td style="border:1px solid #999; padding:4px 8px;">実費支給（上限 月15,000円・非課税分）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">支払日</td><td style="border:1px solid #999; padding:4px 8px;">毎月25日（銀行振込）</td></tr>
</table>

<h3>第6条（社会保険）</h3>
<p>週20時間以上かつ月額賃金8.8万円以上の場合は社会保険に加入する。雇用保険は週20時間以上の場合に加入する。</p>

<h3>第7条（有給休暇）</h3>
<p>労働基準法第39条に基づき、6か月継続勤務・出勤率80%以上の場合に付与する。</p>

<h3>第8条（就業規則）</h3>
<p>本契約に定めのない事項は会社のパートタイム就業規則による。</p>

<h3>第9条（機密保持）</h3>
<p>在職中および退職後も、業務上知り得た患者・顧客情報を第三者に漏洩してはならない。</p>

<br>
<table style="width:100%;">
<tr>
<td style="width:50%; padding:8px;">甲：有限会社イトーメディカルケア<br><br>代表者　　　　　　　　　　　　印</td>
<td style="width:50%; padding:8px;">乙：{{氏名}}<br><br>署名　　　　　　　　　　　　　</td>
</tr>
</table>
</div>
', '[
  {"key":"氏名","label":"氏名","default":""},
  {"key":"契約開始日","label":"契約開始日","default":""},
  {"key":"契約終了日","label":"契約終了日","default":""},
  {"key":"就業場所","label":"就業場所","default":"イトーメディカルケア 各院"},
  {"key":"週所定時間","label":"週所定労働時間（時間）","default":""},
  {"key":"時給","label":"時給（円）","default":""}
]'::jsonb),

('福祉', '正社員', '雇用契約書（福祉部門・正社員）', '
<div style="font-family: ''MS Gothic'', ''Hiragino Kaku Gothic ProN'', sans-serif; line-height: 1.8; color: #000; padding: 0 8px;">
<h2 style="text-align:center; font-size:18px; margin-bottom:24px; letter-spacing:4px;">雇用契約書</h2>

<p>有限会社イトーメディカルケア（以下「甲」という）と<strong>{{氏名}}</strong>（以下「乙」という）は、以下の条件で雇用契約を締結する。</p>

<h3>第1条（雇用形態）</h3>
<p>正社員（福祉部門）として採用する。</p>

<h3>第2条（契約期間）</h3>
<p>期間の定めなし　　採用日：{{入社日}}</p>

<h3>第3条（就業場所・業務内容）</h3>
<p>就業場所：{{就業場所}}<br>
業務内容：介護・福祉サービスの提供（訪問介護・施設介護等）、記録業務、その他付随業務</p>

<h3>第4条（労働時間・休憩）</h3>
<p>変形労働時間制（1か月単位）を採用する。<br>
1か月の法定労働時間内でシフトを組む。<br>
夜勤あり（月{{夜勤回数}}回程度）。夜勤時の休憩は2時間とする。</p>

<h3>第5条（時間外・夜勤手当）</h3>
<p>時間外労働：25%割増（月60時間超は50%）<br>
深夜労働（22時〜5時）：25%割増<br>
夜勤手当：{{夜勤手当}}円/回</p>

<h3>第6条（賃金）</h3>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr><td style="border:1px solid #999; padding:4px 8px; width:40%;">基本給</td><td style="border:1px solid #999; padding:4px 8px;"><strong>{{基本給}}円</strong>/月</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">処遇改善手当</td><td style="border:1px solid #999; padding:4px 8px;">{{処遇改善手当}}円/月（介護職員処遇改善加算による）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">通勤手当</td><td style="border:1px solid #999; padding:4px 8px;">実費支給（上限 月15,000円・非課税分）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">支払日</td><td style="border:1px solid #999; padding:4px 8px;">毎月25日（銀行振込）</td></tr>
</table>

<h3>第7条（休日・休暇）</h3>
<p>4週8休制（シフトによる）。年次有給休暇は労働基準法第39条による。<br>
介護休業・育児休業は法令の定めによる。</p>

<h3>第8条（社会保険）</h3>
<p>健康保険・厚生年金保険・雇用保険・労災保険に加入する。</p>

<h3>第9条（資格・研修）</h3>
<p>会社は法令に基づく研修受講を義務付ける。乙はこれに参加するものとする。</p>

<h3>第10条（就業規則・機密保持）</h3>
<p>本契約に定めのない事項は会社の就業規則による。業務上知り得た利用者・患者情報は厳守するものとする。</p>

<br>
<table style="width:100%;">
<tr>
<td style="width:50%; padding:8px;">甲：有限会社イトーメディカルケア<br><br>代表者　　　　　　　　　　　　印</td>
<td style="width:50%; padding:8px;">乙：{{氏名}}<br><br>署名　　　　　　　　　　　　　</td>
</tr>
</table>
</div>
', '[
  {"key":"氏名","label":"氏名","default":""},
  {"key":"入社日","label":"入社日","default":""},
  {"key":"就業場所","label":"就業場所","default":"イトーメディカルケア 各院"},
  {"key":"夜勤回数","label":"夜勤回数（回/月）","default":"4"},
  {"key":"夜勤手当","label":"夜勤手当（円/回）","default":"5000"},
  {"key":"基本給","label":"基本給（円）","default":""},
  {"key":"処遇改善手当","label":"処遇改善手当（円）","default":""}
]'::jsonb),

('福祉', 'パート', '雇用契約書（福祉部門・パートタイム）', '
<div style="font-family: ''MS Gothic'', ''Hiragino Kaku Gothic ProN'', sans-serif; line-height: 1.8; color: #000; padding: 0 8px;">
<h2 style="text-align:center; font-size:18px; margin-bottom:24px; letter-spacing:4px;">雇用契約書（パートタイム）</h2>

<p>有限会社イトーメディカルケア（以下「甲」という）と<strong>{{氏名}}</strong>（以下「乙」という）は、パートタイム労働法に基づき以下の条件で雇用契約を締結する。</p>

<h3>第1条（雇用形態）</h3>
<p>パートタイム労働者（短時間労働者・福祉部門）として採用する。</p>

<h3>第2条（契約期間）</h3>
<p>{{契約開始日}} から {{契約終了日}} まで<br>
（更新の場合あり。5年超の場合は無期転換申込権が発生する。）</p>

<h3>第3条（就業場所・業務内容）</h3>
<p>就業場所：{{就業場所}}<br>
業務内容：訪問介護・通所介護等の介護補助業務、生活援助、身体介護補助</p>

<h3>第4条（労働時間）</h3>
<p>週の所定労働時間：{{週所定時間}}時間（シフト制）<br>
深夜・早朝シフトあり（別途シフト表による）。</p>

<h3>第5条（賃金）</h3>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr><td style="border:1px solid #999; padding:4px 8px; width:40%;">時給</td><td style="border:1px solid #999; padding:4px 8px;"><strong>{{時給}}円</strong></td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">深夜割増</td><td style="border:1px solid #999; padding:4px 8px;">22時〜5時：25%増</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">処遇改善分</td><td style="border:1px solid #999; padding:4px 8px;">時給に加算して支払（加算額は月次精算）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">支払日</td><td style="border:1px solid #999; padding:4px 8px;">毎月25日（銀行振込）</td></tr>
</table>

<h3>第6条（社会保険・有給休暇）</h3>
<p>週20時間以上の場合は雇用保険に加入。条件充足時は健康保険・厚生年金にも加入。<br>
年次有給休暇は労働基準法第39条による。</p>

<h3>第7条（就業規則・機密保持）</h3>
<p>パートタイム就業規則を遵守すること。業務上知り得た利用者情報は厳守するものとする。</p>

<br>
<table style="width:100%;">
<tr>
<td style="width:50%; padding:8px;">甲：有限会社イトーメディカルケア<br><br>代表者　　　　　　　　　　　　印</td>
<td style="width:50%; padding:8px;">乙：{{氏名}}<br><br>署名　　　　　　　　　　　　　</td>
</tr>
</table>
</div>
', '[
  {"key":"氏名","label":"氏名","default":""},
  {"key":"契約開始日","label":"契約開始日","default":""},
  {"key":"契約終了日","label":"契約終了日","default":""},
  {"key":"就業場所","label":"就業場所","default":"イトーメディカルケア 各院"},
  {"key":"週所定時間","label":"週所定労働時間（時間）","default":""},
  {"key":"時給","label":"時給（円）","default":""}
]'::jsonb);
