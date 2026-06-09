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
