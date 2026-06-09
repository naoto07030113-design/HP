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
