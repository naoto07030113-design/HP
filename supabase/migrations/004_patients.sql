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
