-- ============================================================
-- 005_payroll.sql  給与人事労務システム
-- ============================================================

-- ============================================================
-- Table: payroll_employees  従業員給与マスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_employees (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id                    UUID        REFERENCES staff(id) ON DELETE CASCADE,
  employee_number             TEXT        UNIQUE,
  contract_type               TEXT        NOT NULL DEFAULT '正社員'
                                CHECK (contract_type IN ('正社員','パート','業務委託')),
  hire_date                   DATE        NOT NULL,
  resignation_date            DATE,
  birth_date                  DATE,
  -- 賃金設定
  basic_salary                INTEGER     NOT NULL DEFAULT 0,  -- 基本給（月給）
  hourly_wage                 INTEGER     NOT NULL DEFAULT 0,  -- 時給（パート）
  fixed_overtime_hours        NUMERIC(5,2) NOT NULL DEFAULT 0, -- 固定残業時間
  fixed_overtime_amount       INTEGER     NOT NULL DEFAULT 0,  -- 固定残業代
  -- 社会保険
  health_insurance_enrolled   BOOLEAN     NOT NULL DEFAULT true,
  pension_enrolled            BOOLEAN     NOT NULL DEFAULT true,
  employment_insurance_enrolled BOOLEAN   NOT NULL DEFAULT true,
  -- 税務
  dependent_count             INTEGER     NOT NULL DEFAULT 0,
  resident_tax_monthly        INTEGER     NOT NULL DEFAULT 0,  -- 住民税月額（前年確定）
  -- 通勤
  commute_allowance_monthly   INTEGER     NOT NULL DEFAULT 0,  -- 通勤手当月額（非課税）
  commute_allowance_taxable   INTEGER     NOT NULL DEFAULT 0,  -- 課税通勤手当
  -- 銀行口座
  bank_name                   TEXT,
  bank_branch                 TEXT,
  bank_account_type           TEXT        DEFAULT '普通' CHECK (bank_account_type IN ('普通','当座')),
  bank_account_number         TEXT,
  bank_account_holder         TEXT,
  -- メタ
  notes                       TEXT,
  is_active                   BOOLEAN     NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payroll_employees_updated_at
  BEFORE UPDATE ON payroll_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: payroll_attendance  月次勤怠記録
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_attendance (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_employee_id     UUID        NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  year                    INTEGER     NOT NULL,
  month                   INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  -- 出勤情報
  scheduled_work_days     INTEGER     NOT NULL DEFAULT 0,  -- 所定労働日数
  actual_work_days        INTEGER     NOT NULL DEFAULT 0,  -- 出勤日数
  paid_leave_days         NUMERIC(4,1) NOT NULL DEFAULT 0, -- 有給取得日数
  absence_days            NUMERIC(4,1) NOT NULL DEFAULT 0, -- 欠勤日数
  late_early_leave_times  INTEGER     NOT NULL DEFAULT 0,  -- 遅刻・早退回数
  -- 労働時間
  scheduled_work_hours    NUMERIC(6,2) NOT NULL DEFAULT 0, -- 所定労働時間
  actual_work_hours       NUMERIC(6,2) NOT NULL DEFAULT 0, -- 実労働時間
  overtime_hours          NUMERIC(6,2) NOT NULL DEFAULT 0, -- 時間外労働（月60H以内）
  overtime_hours_over60   NUMERIC(6,2) NOT NULL DEFAULT 0, -- 時間外（月60H超）
  late_night_hours        NUMERIC(6,2) NOT NULL DEFAULT 0, -- 深夜労働
  holiday_work_hours      NUMERIC(6,2) NOT NULL DEFAULT 0, -- 休日労働
  -- 備考
  notes                   TEXT,
  submitted_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payroll_employee_id, year, month)
);

CREATE TRIGGER trg_payroll_attendance_updated_at
  BEFORE UPDATE ON payroll_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: payroll_calculations  月次給与計算結果
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_calculations (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_employee_id         UUID        NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  year                        INTEGER     NOT NULL,
  month                       INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  payment_date                DATE,
  -- 支給項目
  basic_salary                INTEGER     NOT NULL DEFAULT 0,  -- 基本給
  fixed_overtime_pay          INTEGER     NOT NULL DEFAULT 0,  -- 固定残業代
  excess_overtime_pay         INTEGER     NOT NULL DEFAULT 0,  -- 超過残業手当
  late_night_pay              INTEGER     NOT NULL DEFAULT 0,  -- 深夜手当
  holiday_work_pay            INTEGER     NOT NULL DEFAULT 0,  -- 休日手当
  absence_deduction           INTEGER     NOT NULL DEFAULT 0,  -- 欠勤控除（マイナス）
  commute_allowance           INTEGER     NOT NULL DEFAULT 0,  -- 非課税通勤手当
  commute_allowance_taxable   INTEGER     NOT NULL DEFAULT 0,  -- 課税通勤手当
  performance_allowance       INTEGER     NOT NULL DEFAULT 0,  -- 業績手当
  other_allowances            INTEGER     NOT NULL DEFAULT 0,  -- その他手当合計
  gross_pay                   INTEGER     NOT NULL DEFAULT 0,  -- 支給合計
  taxable_gross               INTEGER     NOT NULL DEFAULT 0,  -- 課税支給額
  -- 控除項目
  health_insurance            INTEGER     NOT NULL DEFAULT 0,  -- 健康保険料
  nursing_care_insurance      INTEGER     NOT NULL DEFAULT 0,  -- 介護保険料
  welfare_pension             INTEGER     NOT NULL DEFAULT 0,  -- 厚生年金保険料
  employment_insurance        INTEGER     NOT NULL DEFAULT 0,  -- 雇用保険料
  income_tax                  INTEGER     NOT NULL DEFAULT 0,  -- 所得税（源泉徴収）
  resident_tax                INTEGER     NOT NULL DEFAULT 0,  -- 住民税
  other_deductions            INTEGER     NOT NULL DEFAULT 0,  -- その他控除
  total_deductions            INTEGER     NOT NULL DEFAULT 0,  -- 控除合計
  -- 差引
  net_pay                     INTEGER     NOT NULL DEFAULT 0,  -- 差引支給額
  -- 標準報酬月額
  standard_monthly_salary     INTEGER     NOT NULL DEFAULT 0,  -- 標準報酬月額
  -- ステータス
  status                      TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','confirmed','paid')),
  insurance_rate_id           UUID,  -- 適用した保険料率
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payroll_employee_id, year, month)
);

CREATE TRIGGER trg_payroll_calculations_updated_at
  BEFORE UPDATE ON payroll_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: payroll_allowances  手当明細
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_allowances (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id  UUID        NOT NULL REFERENCES payroll_calculations(id) ON DELETE CASCADE,
  category        TEXT        NOT NULL,  -- 基本/業績手当/通勤手当/特別手当/有給手当/残業手当/その他
  description     TEXT        NOT NULL,  -- 詳細説明
  amount          INTEGER     NOT NULL DEFAULT 0,
  is_taxable      BOOLEAN     NOT NULL DEFAULT true,
  is_deduction    BOOLEAN     NOT NULL DEFAULT false,  -- 控除の場合true
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: payroll_submissions  月次給与申請書（PDF）
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_submissions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  year                INTEGER     NOT NULL,
  month               INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  department          TEXT        NOT NULL,  -- 部署名
  submitted_by        TEXT,
  submitted_date      DATE,
  file_name           TEXT,
  file_url            TEXT,
  raw_text            TEXT,  -- PDF抽出テキスト
  status              TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','parsed','validated','error','processed')),
  employee_count      INTEGER,
  parsed_data         JSONB,  -- AI解析結果
  discrepancies       JSONB,  -- 整合性エラー一覧
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payroll_submissions_updated_at
  BEFORE UPDATE ON payroll_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: payroll_submission_items  申請書の個人明細
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_submission_items (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id           UUID        NOT NULL REFERENCES payroll_submissions(id) ON DELETE CASCADE,
  line_number             INTEGER,    -- 申請書の番号
  employee_name           TEXT        NOT NULL,
  contract_type           TEXT,       -- 正社員/パート/業務委託
  items                   JSONB       NOT NULL DEFAULT '[]',  -- [{category, description, amount}]
  total_amount            INTEGER     NOT NULL DEFAULT 0,
  is_validated            BOOLEAN     NOT NULL DEFAULT false,
  discrepancy_notes       TEXT,
  matched_employee_id     UUID        REFERENCES payroll_employees(id),
  payroll_calculation_id  UUID        REFERENCES payroll_calculations(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: social_insurance_rates  社会保険料率マスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS social_insurance_rates (
  id                                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_date                      DATE        NOT NULL,
  prefecture                          TEXT        NOT NULL DEFAULT '東京',
  association                         TEXT        NOT NULL DEFAULT '協会けんぽ',
  health_insurance_employee_rate      NUMERIC(6,4) NOT NULL,  -- 健保料率（労働者）%
  health_insurance_employer_rate      NUMERIC(6,4) NOT NULL,  -- 健保料率（事業主）%
  nursing_care_employee_rate          NUMERIC(6,4) NOT NULL DEFAULT 0,  -- 介護保険（40歳以上）
  nursing_care_employer_rate          NUMERIC(6,4) NOT NULL DEFAULT 0,
  pension_employee_rate               NUMERIC(6,4) NOT NULL,  -- 厚生年金料率（労働者）%
  pension_employer_rate               NUMERIC(6,4) NOT NULL,  -- 厚生年金料率（事業主）%
  employment_insurance_employee_rate  NUMERIC(6,4) NOT NULL,  -- 雇用保険（労働者）%
  employment_insurance_employer_rate  NUMERIC(6,4) NOT NULL,  -- 雇用保険（事業主）%
  is_active                           BOOLEAN     NOT NULL DEFAULT false,
  notes                               TEXT,
  created_at                          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: minimum_wage_rates  最低賃金マスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS minimum_wage_rates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_date  DATE        NOT NULL,
  prefecture      TEXT        NOT NULL,
  hourly_wage     INTEGER     NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (effective_date, prefecture)
);

-- ============================================================
-- Table: payroll_compliance  法改正・制度変更管理
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_compliance (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category        TEXT        NOT NULL,  -- 最低賃金/社会保険/税制/労働法/育休/その他
  law_name        TEXT        NOT NULL,
  effective_date  DATE        NOT NULL,
  prefecture      TEXT,
  summary         TEXT        NOT NULL,
  detail          TEXT,
  impact_level    TEXT        NOT NULL DEFAULT 'medium'
                    CHECK (impact_level IN ('critical','high','medium','low')),
  action_required TEXT,
  is_applied      BOOLEAN     NOT NULL DEFAULT false,
  applied_at      TIMESTAMPTZ,
  applied_by      TEXT,
  source_url      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payroll_compliance_updated_at
  BEFORE UPDATE ON payroll_compliance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payroll_employees_staff_id   ON payroll_employees(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_active      ON payroll_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_attendance_emp_ym     ON payroll_attendance(payroll_employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_emp_ym           ON payroll_calculations(payroll_employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_status           ON payroll_calculations(status);
CREATE INDEX IF NOT EXISTS idx_payroll_allowances_calc       ON payroll_allowances(calculation_id);
CREATE INDEX IF NOT EXISTS idx_payroll_submissions_ym        ON payroll_submissions(year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_sub_items_sub         ON payroll_submission_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_compliance_effective          ON payroll_compliance(effective_date);
CREATE INDEX IF NOT EXISTS idx_compliance_applied            ON payroll_compliance(is_applied);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE payroll_employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calculations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_allowances        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_submission_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_insurance_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE minimum_wage_rates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_compliance        ENABLE ROW LEVEL SECURITY;

-- Authenticated users: full access
CREATE POLICY "auth_all_payroll_employees"        ON payroll_employees        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_attendance"       ON payroll_attendance       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_calculations"     ON payroll_calculations     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_allowances"       ON payroll_allowances       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_submissions"      ON payroll_submissions      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_submission_items" ON payroll_submission_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_social_insurance_rates"   ON social_insurance_rates   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_minimum_wage_rates"       ON minimum_wage_rates       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payroll_compliance"       ON payroll_compliance       FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Seed: 社会保険料率（令和6年度 協会けんぽ）
-- ============================================================
INSERT INTO social_insurance_rates (
  effective_date, prefecture, association,
  health_insurance_employee_rate, health_insurance_employer_rate,
  nursing_care_employee_rate, nursing_care_employer_rate,
  pension_employee_rate, pension_employer_rate,
  employment_insurance_employee_rate, employment_insurance_employer_rate,
  is_active, notes
) VALUES
-- 東京 令和6年3月〜
('2024-03-01', '東京', '協会けんぽ', 4.990, 4.990, 0.910, 0.910, 9.150, 9.150, 0.600, 0.950, false,
 '令和6年度 協会けんぽ 東京支部'),
-- 千葉 令和6年3月〜
('2024-03-01', '千葉', '協会けんぽ', 4.905, 4.905, 0.910, 0.910, 9.150, 9.150, 0.600, 0.950, false,
 '令和6年度 協会けんぽ 千葉支部'),
-- 神奈川 令和6年3月〜
('2024-03-01', '神奈川', '協会けんぽ', 5.115, 5.115, 0.910, 0.910, 9.150, 9.150, 0.600, 0.950, false,
 '令和6年度 協会けんぽ 神奈川支部'),
-- 東京 令和7年3月〜（予定値 - 要確認）
('2025-03-01', '東京', '協会けんぽ', 4.990, 4.990, 0.950, 0.950, 9.150, 9.150, 0.600, 0.950, true,
 '令和7年度 協会けんぽ 東京支部（介護保険料率 1.90%に改定）'),
('2025-03-01', '千葉', '協会けんぽ', 4.905, 4.905, 0.950, 0.950, 9.150, 9.150, 0.600, 0.950, true,
 '令和7年度 協会けんぽ 千葉支部'),
('2025-03-01', '神奈川', '協会けんぽ', 5.115, 5.115, 0.950, 0.950, 9.150, 9.150, 0.600, 0.950, true,
 '令和7年度 協会けんぽ 神奈川支部')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: 最低賃金（令和6年10月〜）
-- ============================================================
INSERT INTO minimum_wage_rates (effective_date, prefecture, hourly_wage, notes) VALUES
('2024-10-01', '東京',   1163, '令和6年10月改定'),
('2024-10-01', '千葉',   1076, '令和6年10月改定'),
('2024-10-01', '神奈川', 1162, '令和6年10月改定'),
('2024-10-01', '埼玉',   1078, '令和6年10月改定'),
('2024-10-01', '大阪',   1114, '令和6年10月改定'),
('2025-10-01', '東京',   1200, '令和7年10月改定（目安）'),
('2025-10-01', '千葉',   1113, '令和7年10月改定（目安）'),
('2025-10-01', '神奈川', 1200, '令和7年10月改定（目安）')
ON CONFLICT (effective_date, prefecture) DO NOTHING;

-- ============================================================
-- Seed: 法改正・コンプライアンス情報
-- ============================================================
INSERT INTO payroll_compliance (category, law_name, effective_date, prefecture, summary, detail, impact_level, action_required, is_applied) VALUES
('労働法', '労働基準法改正（月60時間超残業割増率引上げ）', '2023-04-01', NULL,
 '中小企業にも月60時間超の時間外労働に対する50%割増賃金が適用',
 '月60時間を超える法定時間外労働に対して50%以上の割増賃金を支払う義務。それ以下は25%。',
 'critical', '給与計算システムの残業計算ロジックを60H超対応に修正', true),

('労働法', '労働条件明示ルール改正', '2024-04-01', NULL,
 '労働条件通知書の記載事項の追加義務化',
 '就業場所・業務の変更範囲、更新上限の有無、無期転換申込機会・条件を明示することが義務付けられた。',
 'high', '雇用契約書・通知書のテンプレートを改定する', true),

('社会保険', '社会保険適用拡大（パート・アルバイト）', '2024-10-01', NULL,
 '社会保険適用拡大：従業員51人以上の企業でパート・アルバイトへの適用拡大',
 '週20時間以上・月額賃金8.8万円以上・2か月超雇用見込・学生でないことが条件。',
 'critical', '該当パート従業員の社会保険加入手続きを確認・実施', true),

('最低賃金', '最低賃金改定（令和6年10月）', '2024-10-01', '全国',
 '全国加重平均1,055円へ。東京1,163円、千葉1,076円、神奈川1,162円。',
 '地域別最低賃金の改定。時給・日給・月給換算を行い最低賃金以上であることを確認。',
 'critical', '全パート・アルバイト従業員の時給が最低賃金以上であることを確認', true),

('税制', '定額減税（令和6年）', '2024-06-01', NULL,
 '1人あたり所得税3万円・住民税1万円の定額減税を実施',
 '令和6年6月以降の給与から所得税・住民税の定額減税を実施。月次減税事務が必要。',
 'high', '6月分以降の給与計算で定額減税を適用済みか確認', true),

('社会保険', '介護保険料率改定（令和7年度）', '2025-03-01', NULL,
 '介護保険料率が1.82%から1.90%に改定（協会けんぽ）',
 '令和7年3月分（4月納付分）から適用。40歳以上65歳未満の被保険者が対象。',
 'high', '令和7年3月分給与から新料率を適用', false),

('労働法', '育児介護休業法改正（段階的施行）', '2025-04-01', NULL,
 '子の年齢に応じた柔軟な働き方確保措置義務化（従業員300人超）',
 '①所定外労働の制限②テレワーク等の措置③短時間勤務④育児時間⑤始終業時刻の変更から2つ以上を選択提供。',
 'medium', '対象となる場合は就業規則・制度整備が必要', false),

('最低賃金', '最低賃金改定（令和7年10月目安）', '2025-10-01', '全国',
 '全国加重平均1,114円目安。東京1,200円、千葉1,113円、神奈川1,200円。',
 '中央最低賃金審議会の目安額。各都道府県審議会で最終決定。',
 'critical', '令和7年10月以降、パート従業員の時給を確認・改定', false),

('社会保険', '年収の壁への対応（106万円・130万円の壁）', '2024-10-01', NULL,
 '「年収の壁・支援強化パッケージ」。社会保険適用で手取り減を防ぐ事業主への支援。',
 '社会保険加入促進のため事業主が賃金を引き上げた場合に支援金（1人当たり最大50万円）を支給。',
 'medium', '該当従業員の状況確認と賃金改定検討', false)
ON CONFLICT DO NOTHING;
