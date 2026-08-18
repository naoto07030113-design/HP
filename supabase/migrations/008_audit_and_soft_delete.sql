-- ================================================================
-- 008: 監査ログ・操作者の記録・論理削除
--
-- 目的
--   1. 「誰が・いつ・何を・変更前/変更後」を追跡できるようにする
--   2. 患者を消してもカルテが物理削除されないようにする
--   3. 重要データを物理削除せず復元可能にする
--
-- 適用方法
--   Supabase の SQL Editor でこのファイルを実行する。
--   何度実行しても安全（冪等）。
--
-- 注意
--   本番DBへの適用前に必ずバックアップを取得すること（BACKUP.md 参照）。
-- ================================================================

-- ================================================================
-- 1. 監査ログ
-- ================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id           BIGSERIAL   PRIMARY KEY,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- ブラウザ → API → DB を横串で追うための識別子
  request_id   TEXT        NOT NULL,
  action       TEXT        NOT NULL,
  -- 患者による操作は actor_id が NULL、actor_role が 'patient' になる
  actor_id     UUID,
  actor_role   TEXT,
  clinic_id    UUID        REFERENCES clinics(id),
  target_type  TEXT        NOT NULL,
  target_id    TEXT,
  result       TEXT        NOT NULL DEFAULT 'success'
                 CHECK (result IN ('success', 'failure')),
  -- 個人情報はアプリ側で伏字化してから保存される
  before_value JSONB,
  after_value  JSONB,
  ip_address   TEXT,
  user_agent   TEXT,
  error_code   TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred   ON audit_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request    ON audit_logs (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON audit_logs (actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target     ON audit_logs (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic     ON audit_logs (clinic_id, occurred_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 監査ログは書き換えられては意味がないため、UPDATE / DELETE のポリシーを作らない。
-- 書き込みは service_role（API）からのみ行う。
DROP POLICY IF EXISTS "audit_logs_no_client_access" ON audit_logs;
-- 参照は管理者のみ（app_metadata.role は本人が書き換えられない）
CREATE POLICY "audit_logs_admin_select" ON audit_logs
  FOR SELECT TO authenticated
  USING (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ================================================================
-- 2. 操作者の記録（誰が作成・更新・削除したか）
-- ================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients', 'reservations', 'medical_records', 'invoices',
    'staff', 'menus', 'clinics', 'announcements', 'merchandise'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by UUID', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by UUID', t);
  END LOOP;
END $$;

-- ================================================================
-- 3. 論理削除
--    診療録は保存義務があり、患者の削除で消えてはならない。
-- ================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients', 'reservations', 'medical_records', 'invoices'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_by UUID', t);
    -- 生存行だけを引く問い合わせを速くする
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_alive ON %I (deleted_at) WHERE deleted_at IS NULL', t, t
    );
  END LOOP;
END $$;

-- ================================================================
-- 4. 連鎖削除の解除
--    患者を1件削除すると、その患者の全カルテが物理的に消えていた。
--    論理削除へ移行するため、外部キーの ON DELETE CASCADE を外す。
-- ================================================================

DO $$
DECLARE
  fk_name TEXT;
BEGIN
  -- medical_records.patient_id の外部キーを付け直す（CASCADE → RESTRICT）
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'medical_records'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'patient_id'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE medical_records DROP CONSTRAINT %I', fk_name);
  END IF;

  ALTER TABLE medical_records
    ADD CONSTRAINT medical_records_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ================================================================
-- 5. 患者向けの匿名アクセスを最小化
--    予約の閲覧・更新は API（service_role）経由に一本化したため、
--    anon から予約テーブルへ直接触れる必要はなくなった。
-- ================================================================

-- 全予約の閲覧を許していた（患者氏名・電話番号が誰でも取得できた）
DROP POLICY IF EXISTS "public_select_reservations" ON reservations;
-- 任意の予約の書き換えを許していた（他人の予約をキャンセルできた）
DROP POLICY IF EXISTS "public_update_reservations" ON reservations;
-- 予約の作成も /api/v1 経由に寄せるため不要
DROP POLICY IF EXISTS "public_insert_reservations" ON reservations;
-- 患者情報の匿名 INSERT も API 経由に寄せる
DROP POLICY IF EXISTS "public_insert_patients" ON patients;

-- 勤務シフトは個人の勤務予定であり、患者に公開する必要はない
-- （空き枠は /api/v1/appointments/availability がサーバー側で算出する）
DROP POLICY IF EXISTS "public_select_shifts" ON shifts;
DROP POLICY IF EXISTS "public_select_shift_blocks" ON shift_blocks;

-- ================================================================
-- 6. 確認用
-- ================================================================
-- 適用後、以下で anon に残っているポリシーを確認する:
--
--   SELECT tablename, policyname, cmd, roles
--   FROM pg_policies
--   WHERE schemaname = 'public' AND 'anon' = ANY(roles)
--   ORDER BY tablename;
--
-- 期待される結果: clinics / menus / announcements / closed_days /
--                 app_settings / merchandise の SELECT のみ。
--                 reservations と patients は 1 件も残らないこと。
