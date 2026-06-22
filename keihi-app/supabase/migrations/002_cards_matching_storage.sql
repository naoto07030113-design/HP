-- =====================================================================
-- 002: クレジットカード仕分け / レシート・明細の突合 / 書類PDF保管の土台
-- =====================================================================

-- 事業所のシード（同名が無ければ作成）
INSERT INTO businesses (name, is_active, sort_order)
SELECT v.name, true, v.ord
FROM (VALUES ('本部', 1), ('デイサービス', 2), ('グループホーム', 3)) AS v(name, ord)
WHERE NOT EXISTS (SELECT 1 FROM businesses b WHERE b.name = v.name);

-- クレジットカード（下4桁 → 事業所）
CREATE TABLE IF NOT EXISTS cards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  last4       TEXT        NOT NULL UNIQUE,
  business_id UUID        REFERENCES businesses(id) ON DELETE SET NULL,
  label       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- カードの初期データ（事業所名で紐付け）
INSERT INTO cards (last4, business_id, label)
SELECT v.last4, b.id, v.label
FROM (VALUES
  ('8422', '本部',         '本部'),
  ('3020', 'デイサービス', 'デイサービス'),
  ('6538', 'グループホーム', 'グループホーム①'),
  ('6512', 'グループホーム', 'グループホーム②')
) AS v(last4, bname, label)
LEFT JOIN businesses b ON b.name = v.bname
WHERE NOT EXISTS (SELECT 1 FROM cards c WHERE c.last4 = v.last4);

-- 出納帳: カード・突合・PDFカラム
ALTER TABLE cashbook_entries ADD COLUMN IF NOT EXISTS card_last4          TEXT;
ALTER TABLE cashbook_entries ADD COLUMN IF NOT EXISTS has_receipt         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE cashbook_entries ADD COLUMN IF NOT EXISTS has_card_statement  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE cashbook_entries ADD COLUMN IF NOT EXISTS receipt_pdf_path    TEXT;
ALTER TABLE cashbook_entries ADD COLUMN IF NOT EXISTS statement_pdf_path  TEXT;

CREATE INDEX IF NOT EXISTS idx_cashbook_card ON cashbook_entries(card_last4);

-- source に card_statement（カード明細）を許可
ALTER TABLE cashbook_entries DROP CONSTRAINT IF EXISTS cashbook_entries_source_check;
ALTER TABLE cashbook_entries ADD CONSTRAINT cashbook_entries_source_check
  CHECK (source IN ('manual', 'receipt', 'bankbook', 'card_statement'));

-- cards RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated full access" ON cards;
CREATE POLICY "authenticated full access" ON cards
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 書類PDFの保管バケット（次ステップで使用）
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents read"  ON storage.objects;
DROP POLICY IF EXISTS "documents write" ON storage.objects;
CREATE POLICY "documents read"  ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "documents write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
