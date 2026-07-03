-- 物販商品テーブル
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

-- 物販予約テーブル
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
