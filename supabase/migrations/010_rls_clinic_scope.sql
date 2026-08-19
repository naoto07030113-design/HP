-- =====================================================================
-- 010: RLS に「所属院」の条件を入れる
--
-- これまでの状態:
--   ログイン済み（authenticated）であれば、すべてのテーブルの
--   すべての行に対してすべての操作が許可されていた。
--   浦和院の受付が本院の患者・カルテ・会計を読める状態だった。
--
-- この移行でやること:
--   1. 患者データ（患者・カルテ・会計・予約・シフト・監査ログ）は
--      ブラウザからは一切触れなくする。
--      これらは必ず /api/v1/* を通り、サーバーが認証・認可・院スコープを
--      判定したうえで service_role で読み書きする（RLS を迂回する）。
--   2. 院・スタッフ・メニュー等のマスタは、参照は誰でも可、
--      変更はロールに応じて制限する。
--   3. 判定に使う「今のロール」「今の所属院」を関数として一箇所に置く。
--
-- 前提:
--   ロールと所属院は Supabase Auth の app_metadata に入れる。
--     { "role": "admin" | "staff" | "receptionist", "clinic_id": "<UUID>" }
--   user_metadata は本人が書き換えられるため参照しない。
--
-- 適用前に必ずバックアップを取ること（BACKUP.md 参照）。
-- 適用後、管理画面と患者向け予約が動くことを確認すること。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 判定用の関数
-- ---------------------------------------------------------------------

-- 今ログインしている人のロール。未設定は最小権限（受付）として扱う
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    'receptionist'
  );
$$;

COMMENT ON FUNCTION public.auth_role() IS
  'app_metadata.role のみを見る。user_metadata は本人が書き換えられるため信頼しない';

-- 今ログインしている人の所属院。admin は NULL（全院横断）
CREATE OR REPLACE FUNCTION public.auth_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'clinic_id', '')::uuid;
$$;

-- 対象の院に触れてよいか
CREATE OR REPLACE FUNCTION public.can_access_clinic(target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.auth_role() = 'admin'
    OR (target IS NOT NULL AND target = public.auth_clinic_id());
$$;

-- ---------------------------------------------------------------------
-- 2. 患者データ: ブラウザからは触れなくする
--
--    これらの画面はすべて /api/v1/* 経由へ移行済み。
--    API は service_role で動くため RLS を迂回する。
--    ポリシーを一切作らない = anon / authenticated からは 0 行に見える。
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "staff_all_patients"        ON patients;
DROP POLICY IF EXISTS "staff_all_medical_records" ON medical_records;
DROP POLICY IF EXISTS "staff_all_invoices"        ON invoices;
DROP POLICY IF EXISTS "staff_all_invoice_items"   ON invoice_items;
DROP POLICY IF EXISTS "staff_all_reservations"    ON reservations;
DROP POLICY IF EXISTS "staff_all_shifts"          ON shifts;
DROP POLICY IF EXISTS "staff_all_shift_blocks"    ON shift_blocks;
DROP POLICY IF EXISTS "staff_all_merchandise_bookings" ON merchandise_bookings;

-- 念のため、RLS が有効であることを再確認する
ALTER TABLE patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_bookings ENABLE ROW LEVEL SECURITY;

-- 008 で作った監査ログ・009 の改訂履歴も同様（存在する場合のみ）
DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "staff_all_audit_logs" ON audit_logs';
    EXECUTE 'DROP POLICY IF EXISTS "admin_select_audit_logs" ON audit_logs';
  END IF;
  IF to_regclass('public.medical_record_revisions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE medical_record_revisions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "staff_all_medical_record_revisions" ON medical_record_revisions';
    EXECUTE 'DROP POLICY IF EXISTS "admin_select_medical_record_revisions" ON medical_record_revisions';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. マスタ: 参照は誰でも可、変更はロールで制限する
--
--    院・スタッフ・メニュー・お知らせ・休診日・物販は
--    患者向けの予約画面にもそのまま出る公開情報。
--    参照を絞ると予約サイトが動かなくなるため、絞るのは変更のみ。
-- ---------------------------------------------------------------------

-- 既存の「ログイン済みなら全操作可」を外す
DROP POLICY IF EXISTS "staff_all_clinics"              ON clinics;
DROP POLICY IF EXISTS "staff_all_staff"                ON staff;
DROP POLICY IF EXISTS "staff_all_menus"                ON menus;
DROP POLICY IF EXISTS "staff_all_announcements"        ON announcements;
DROP POLICY IF EXISTS "staff_all_app_settings"         ON app_settings;
DROP POLICY IF EXISTS "staff_all_closed_days"          ON closed_days;
DROP POLICY IF EXISTS "staff_all_merchandise"          ON merchandise;
DROP POLICY IF EXISTS "staff_all_monthly_reports"      ON monthly_reports;

-- 再実行できるよう、本移行が作るポリシーも先に落とす
DROP POLICY IF EXISTS "read_clinics"              ON clinics;
DROP POLICY IF EXISTS "read_staff"                ON staff;
DROP POLICY IF EXISTS "read_menus"                ON menus;
DROP POLICY IF EXISTS "read_announcements"        ON announcements;
DROP POLICY IF EXISTS "read_app_settings"         ON app_settings;
DROP POLICY IF EXISTS "read_closed_days"          ON closed_days;
DROP POLICY IF EXISTS "read_merchandise"          ON merchandise;
DROP POLICY IF EXISTS "admin_write_clinics"       ON clinics;
DROP POLICY IF EXISTS "admin_write_staff"         ON staff;
DROP POLICY IF EXISTS "admin_write_menus"         ON menus;
DROP POLICY IF EXISTS "admin_write_announcements" ON announcements;
DROP POLICY IF EXISTS "admin_write_app_settings"  ON app_settings;
DROP POLICY IF EXISTS "staff_write_closed_days"   ON closed_days;
DROP POLICY IF EXISTS "staff_write_merchandise"   ON merchandise;
DROP POLICY IF EXISTS "admin_rw_monthly_reports"  ON monthly_reports;

-- 参照（患者向け予約サイトからも見える公開情報）
CREATE POLICY "read_clinics"       ON clinics       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_staff"         ON staff         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_menus"         ON menus         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_announcements" ON announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_app_settings"  ON app_settings  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_closed_days"   ON closed_days   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_merchandise"   ON merchandise   FOR SELECT TO anon, authenticated USING (true);

-- 変更: 管理者のみ（院・スタッフ・メニュー・お知らせ）
CREATE POLICY "admin_write_clinics" ON clinics FOR ALL TO authenticated
  USING (public.auth_role() = 'admin') WITH CHECK (public.auth_role() = 'admin');

CREATE POLICY "admin_write_staff" ON staff FOR ALL TO authenticated
  USING (public.auth_role() = 'admin') WITH CHECK (public.auth_role() = 'admin');

CREATE POLICY "admin_write_menus" ON menus FOR ALL TO authenticated
  USING (public.auth_role() = 'admin') WITH CHECK (public.auth_role() = 'admin');

CREATE POLICY "admin_write_announcements" ON announcements FOR ALL TO authenticated
  USING (public.auth_role() = 'admin') WITH CHECK (public.auth_role() = 'admin');

-- システム設定は「システム設定」画面（管理者）と「コミュニケーション」画面
-- （管理者・施術者）の両方から保存されるため、この2ロールに許す
CREATE POLICY "admin_write_app_settings" ON app_settings FOR ALL TO authenticated
  USING (public.auth_role() IN ('admin', 'staff'))
  WITH CHECK (public.auth_role() IN ('admin', 'staff'));

-- 変更: 管理者と施術者（休診日・物販）。自院の分だけ
CREATE POLICY "staff_write_closed_days" ON closed_days FOR ALL TO authenticated
  USING (
    public.auth_role() IN ('admin', 'staff')
    AND (clinic_id IS NULL OR public.can_access_clinic(clinic_id))
  )
  WITH CHECK (
    public.auth_role() IN ('admin', 'staff')
    AND (clinic_id IS NULL OR public.can_access_clinic(clinic_id))
  );

CREATE POLICY "staff_write_merchandise" ON merchandise FOR ALL TO authenticated
  USING (
    public.auth_role() IN ('admin', 'staff')
    AND public.can_access_clinic(clinic_id)
  )
  WITH CHECK (
    public.auth_role() IN ('admin', 'staff')
    AND public.can_access_clinic(clinic_id)
  );

-- 物販の予約は患者の氏名・電話番号を含むため、ブラウザからは触れさせない。
-- 登録は POST /api/v1/merchandise/bookings/create、
-- 参照・状態変更は /api/v1/merchandise/bookings/* が service_role で行う。
-- ポリシーを作らない = anon / authenticated からは 0 行に見える。

-- 月次レポートは経営数値のまとめ（患者個人の情報は含まない）。
-- 画面が管理者専用なので、DB 側も管理者のみにそろえる。
CREATE POLICY "admin_rw_monthly_reports" ON monthly_reports FOR ALL TO authenticated
  USING (public.auth_role() = 'admin') WITH CHECK (public.auth_role() = 'admin');

-- ---------------------------------------------------------------------
-- 4. 適用後の確認方法
--
--   -- 受付アカウントでログインした状態で（＝ anon ではなく authenticated）
--   SELECT count(*) FROM patients;         -- 0 になること
--   SELECT count(*) FROM medical_records;  -- 0 になること
--   SELECT count(*) FROM invoices;         -- 0 になること
--   SELECT count(*) FROM reservations;     -- 0 になること
--   SELECT count(*) FROM shifts;                -- 0 になること
--   SELECT count(*) FROM merchandise_bookings;  -- 0 になること
--   SELECT count(*) FROM clinics;          -- 院数が返ること（公開情報）
--
--   -- 管理画面（/api/v1/* 経由）からは今までどおり見えること
--   -- 患者向け予約サイトで空き枠が出て、予約できること
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 5. リアルタイム配信の整理
--
--    ブラウザが購読するのはマスタだけになった。
--    患者データはブラウザから読めないため、配信しても届かない。
--    無駄な配信を止めることで、取り違えの余地も減らす。
-- ---------------------------------------------------------------------

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients', 'reservations', 'medical_records', 'invoices', 'invoice_items',
    'shifts', 'shift_blocks', 'merchandise_bookings', 'monthly_reports'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE %I', t);
    EXCEPTION WHEN OTHERS THEN
      NULL;  -- 元から入っていない場合は何もしない
    END;
  END LOOP;
END $$;
