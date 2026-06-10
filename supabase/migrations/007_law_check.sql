-- 007_law_check.sql
-- AI法改正スキャン機能

-- payroll_compliance に AI 検知フラグ追加
ALTER TABLE payroll_compliance
  ADD COLUMN IF NOT EXISTS ai_detected  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scan_run_id  UUID,
  ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending'
    CHECK (review_status IN ('pending','acknowledged'));

-- AIスキャン実行履歴
CREATE TABLE IF NOT EXISTS payroll_law_scans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  model         TEXT        NOT NULL DEFAULT 'gpt-4o',
  found_count   INTEGER     NOT NULL DEFAULT 0,
  new_count     INTEGER     NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running','completed','error')),
  error_message TEXT,
  raw_response  TEXT
);

-- AIが提案する料率変更（承認フロー付き）
CREATE TABLE IF NOT EXISTS payroll_rate_proposals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_id   UUID        REFERENCES payroll_compliance(id) ON DELETE CASCADE,
  scan_run_id     UUID        REFERENCES payroll_law_scans(id),
  title           TEXT        NOT NULL,
  category        TEXT        NOT NULL,
  change_type     TEXT        NOT NULL
                    CHECK (change_type IN ('rate_update','new_item','manual_required')),
  description     TEXT,
  source_url      TEXT,
  effective_date  DATE,
  proposed_value  JSONB,
  review_status   TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (review_status IN ('pending','approved','rejected','applied')),
  reviewed_at     TIMESTAMPTZ,
  applied_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_law_scans_scanned_at           ON payroll_law_scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_proposals_review_status   ON payroll_rate_proposals(review_status);
CREATE INDEX IF NOT EXISTS idx_rate_proposals_compliance_id   ON payroll_rate_proposals(compliance_id);
CREATE INDEX IF NOT EXISTS idx_compliance_ai_detected         ON payroll_compliance(ai_detected, review_status);

ALTER TABLE payroll_law_scans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_rate_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "law_scans_auth_all"      ON payroll_law_scans      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rate_proposals_auth_all" ON payroll_rate_proposals  FOR ALL TO authenticated USING (true) WITH CHECK (true);
