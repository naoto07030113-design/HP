-- 006_payslip_tokens.sql
-- 給与明細電子送付: payroll_employeesにメール追加 + 送付トークンテーブル

-- メールアドレスを従業員テーブルに追加
ALTER TABLE payroll_employees
  ADD COLUMN IF NOT EXISTS email text;

-- 給与明細閲覧トークン
CREATE TABLE IF NOT EXISTS payslip_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token                uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  calculation_id       uuid NOT NULL REFERENCES payroll_calculations(id) ON DELETE CASCADE,
  payroll_employee_id  uuid NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  email           text NOT NULL,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  sent_at         timestamptz,
  viewed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payslip_tokens_token               ON payslip_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payslip_tokens_calculation_id      ON payslip_tokens(calculation_id);
CREATE INDEX IF NOT EXISTS idx_payslip_tokens_payroll_employee_id ON payslip_tokens(payroll_employee_id);

-- RLS
ALTER TABLE payslip_tokens ENABLE ROW LEVEL SECURITY;

-- 管理者（認証済み）は全操作可
CREATE POLICY "payslip_tokens_auth_all" ON payslip_tokens
  FOR ALL USING (auth.role() = 'authenticated');

-- 有効なトークンによるパブリック閲覧（token列で特定）
CREATE POLICY "payslip_tokens_public_view" ON payslip_tokens
  FOR SELECT USING (expires_at > now());
