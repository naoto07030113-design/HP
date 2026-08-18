-- ================================================================
-- 009: カルテの改訂履歴
--
-- 目的
--   カルテを訂正しても、訂正前の内容が失われないようにする。
--   診療録は「いつ・誰が・何を書き換えたか」を後から追えることが求められる。
--
-- 方針
--   medical_records は常に最新版を持つ（画面の表示はこれまでどおり）。
--   更新のたびに、更新前の内容を medical_record_revisions へ1行積む。
--   履歴は追記のみで、書き換え・削除はしない。
--
-- 適用方法
--   Supabase の SQL Editor でこのファイルを実行する。何度実行しても安全。
--   本番適用の前に必ずバックアップを取得すること（BACKUP.md 参照）。
-- ================================================================

CREATE TABLE IF NOT EXISTS medical_record_revisions (
  id                BIGSERIAL   PRIMARY KEY,
  record_id         UUID        NOT NULL REFERENCES medical_records(id) ON DELETE RESTRICT,
  -- 何回目の改訂か（1 = 最初の作成直後の状態）
  revision_no       INTEGER     NOT NULL,
  -- 変更を行った操作者
  changed_by        UUID,
  changed_by_role   TEXT,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 追跡用。API のログと突き合わせられる
  request_id        TEXT,
  -- 'update' または 'delete'
  change_type       TEXT        NOT NULL DEFAULT 'update'
                      CHECK (change_type IN ('update', 'delete')),
  -- 変更前のカルテ全体。ここは伏字化せず、診療内容をそのまま保存する
  -- （復元と監査のために必要。閲覧できるのは管理者のみ）
  snapshot          JSONB       NOT NULL,
  UNIQUE (record_id, revision_no)
);

CREATE INDEX IF NOT EXISTS idx_mrr_record   ON medical_record_revisions (record_id, revision_no DESC);
CREATE INDEX IF NOT EXISTS idx_mrr_changed  ON medical_record_revisions (changed_at DESC);

ALTER TABLE medical_record_revisions ENABLE ROW LEVEL SECURITY;

-- 履歴は改竄されては意味がないため、UPDATE / DELETE のポリシーを作らない。
-- 書き込みは service_role（API）からのみ。参照は管理者のみ。
DROP POLICY IF EXISTS "mrr_admin_select" ON medical_record_revisions;
CREATE POLICY "mrr_admin_select" ON medical_record_revisions
  FOR SELECT TO authenticated
  USING (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ================================================================
-- 確認用
-- ================================================================
-- SELECT record_id, revision_no, change_type, changed_at, changed_by
-- FROM medical_record_revisions
-- ORDER BY changed_at DESC LIMIT 20;
