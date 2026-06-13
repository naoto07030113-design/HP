-- =====================================================================
-- 経費・出納帳アプリ 初期スキーマ
-- =====================================================================

-- 事業所（店舗・拠点・部門など、経費を分けて集計する単位）
CREATE TABLE IF NOT EXISTS businesses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 出納帳（経費・入出金）
CREATE TABLE IF NOT EXISTS cashbook_entries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID        REFERENCES businesses(id) ON DELETE SET NULL,  -- NULL = 全社共通
  entry_date     DATE        NOT NULL,
  entry_type     TEXT        NOT NULL DEFAULT 'expense'
                             CHECK (entry_type IN ('income', 'expense')),
  category       TEXT        NOT NULL DEFAULT 'misc'
                             CHECK (category IN (
                               -- 支出（経費）
                               'rent', 'utilities', 'payroll', 'supplies',
                               'medical_supplies', 'advertising', 'communication',
                               'travel', 'repairs', 'fees', 'misc', 'other',
                               -- 収入
                               'sales', 'misc_income', 'other_income'
                             )),
  vendor         TEXT        NOT NULL DEFAULT '',   -- 支払先 / 入金元
  description    TEXT        NOT NULL DEFAULT '',   -- 摘要
  amount         INTEGER     NOT NULL DEFAULT 0 CHECK (amount >= 0),
  payment_method TEXT        NOT NULL DEFAULT 'cash'
                             CHECK (payment_method IN (
                               'cash', 'card', 'bank_transfer', 'direct_debit', 'other'
                             )),
  source         TEXT        NOT NULL DEFAULT 'manual'
                             CHECK (source IN ('manual', 'receipt', 'bankbook')),
  memo           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cashbook_date     ON cashbook_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_cashbook_business  ON cashbook_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_cashbook_category ON cashbook_entries(category);

-- 支払予定（請求書・見積書など振込期日がある書類）
CREATE TABLE IF NOT EXISTS scheduled_payments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID        REFERENCES businesses(id) ON DELETE SET NULL,  -- NULL = 全社共通
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
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_business ON scheduled_payments(business_id);

-- ---------------------------------------------------------------------
-- Row Level Security: ログイン済みユーザーに全アクセスを許可
-- ---------------------------------------------------------------------
ALTER TABLE businesses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashbook_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access" ON businesses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated full access" ON cashbook_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated full access" ON scheduled_payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
