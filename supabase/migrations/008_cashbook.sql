-- 出納帳（経費・入出金）テーブル
CREATE TABLE IF NOT EXISTS cashbook_entries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      UUID        REFERENCES clinics(id) ON DELETE SET NULL,  -- NULL = 全社共通
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
CREATE INDEX IF NOT EXISTS idx_cashbook_clinic   ON cashbook_entries(clinic_id);
CREATE INDEX IF NOT EXISTS idx_cashbook_category ON cashbook_entries(category);
