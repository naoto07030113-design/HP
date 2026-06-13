-- 支払予定（請求書・見積書など振込期日がある書類）テーブル
CREATE TABLE IF NOT EXISTS scheduled_payments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID        REFERENCES clinics(id) ON DELETE SET NULL,  -- NULL = 全社共通
  document_type TEXT        NOT NULL DEFAULT 'invoice'
                            CHECK (document_type IN ('invoice', 'quote', 'other')),
  vendor        TEXT        NOT NULL DEFAULT '',   -- 支払先
  description   TEXT        NOT NULL DEFAULT '',   -- 摘要
  amount        INTEGER     NOT NULL DEFAULT 0 CHECK (amount >= 0),
  due_date      DATE        NOT NULL,              -- 振込期日（前日に通知）
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'paid', 'cancelled')),
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_payments_due    ON scheduled_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_status ON scheduled_payments(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_clinic ON scheduled_payments(clinic_id);
