-- Contract templates (4 pre-seeded)
CREATE TABLE IF NOT EXISTS contract_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  department    TEXT        NOT NULL CHECK (department IN ('療術', '福祉')),
  contract_type TEXT        NOT NULL CHECK (contract_type IN ('正社員', 'パート')),
  title         TEXT        NOT NULL,
  content       TEXT        NOT NULL,  -- HTML with {{変数名}} placeholders
  variables     JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- list of {key, label, default}
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_contracts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_employee_id  UUID        NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
  template_id          UUID        REFERENCES contract_templates(id),
  title                TEXT        NOT NULL,
  content              TEXT        NOT NULL,  -- rendered content (variables filled)
  variables_used       JSONB,                 -- snapshot of filled variables
  status               TEXT        NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','sent','signed','cancelled')),
  valid_from           DATE,
  valid_until          DATE,
  sent_at              TIMESTAMPTZ,
  sign_token           UUID        UNIQUE DEFAULT gen_random_uuid(),
  signed_at            TIMESTAMPTZ,
  signer_name          TEXT,
  signer_ip            TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Persistent staff portals (one per employee, long-lived token)
CREATE TABLE IF NOT EXISTS staff_portals (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_token         UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  payroll_employee_id  UUID        NOT NULL UNIQUE REFERENCES payroll_employees(id) ON DELETE CASCADE,
  email                TEXT        NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee   ON employee_contracts(payroll_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_status     ON employee_contracts(status);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_sign_token ON employee_contracts(sign_token);
CREATE INDEX IF NOT EXISTS idx_staff_portals_token           ON staff_portals(portal_token);

ALTER TABLE contract_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contracts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_portals       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_auth_all"  ON contract_templates  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "emp_contracts_auth"  ON employee_contracts  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "portals_auth_all"    ON staff_portals       FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Public read for signing (by sign_token)
CREATE POLICY "emp_contracts_public_sign" ON employee_contracts FOR SELECT USING (true);
CREATE POLICY "portals_public_view"       ON staff_portals       FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_contract_templates_updated_at();

CREATE OR REPLACE FUNCTION update_employee_contracts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_employee_contracts_updated_at BEFORE UPDATE ON employee_contracts FOR EACH ROW EXECUTE FUNCTION update_employee_contracts_updated_at();

-- Seed 4 templates
INSERT INTO contract_templates (department, contract_type, title, content, variables) VALUES

('療術', '正社員', '雇用契約書（療術部門・正社員）', '
<div style="font-family: ''MS Gothic'', ''Hiragino Kaku Gothic ProN'', sans-serif; line-height: 1.8; color: #000; padding: 0 8px;">
<h2 style="text-align:center; font-size:18px; margin-bottom:24px; letter-spacing:4px;">雇用契約書</h2>

<p>有限会社イトーメディカルケア（以下「甲」という）と<strong>{{氏名}}</strong>（以下「乙」という）は、以下の条件で雇用契約を締結する。</p>

<h3>第1条（雇用形態）</h3>
<p>正社員として採用する。</p>

<h3>第2条（契約期間）</h3>
<p>期間の定めなし　　採用日：{{入社日}}</p>

<h3>第3条（就業場所・業務内容）</h3>
<p>就業場所：{{就業場所}}<br>
業務内容：あん摩マッサージ指圧・はり・きゅう施術業務、および会社が指示するその他付随業務</p>

<h3>第4条（労働時間・休憩）</h3>
<p>始業：{{始業時刻}}　終業：{{終業時刻}}（休憩60分）<br>
所定労働時間：1日8時間・週40時間<br>
シフト制につき別途シフト表による。</p>

<h3>第5条（時間外労働・固定残業）</h3>
<p>業務上必要な場合、時間外・休日労働を命じることがある。<br>
固定残業代 <strong>{{固定残業代}}円</strong>（月{{固定残業時間}}時間分）を基本給に含む。<br>
固定残業時間を超えた場合は、追加で割増賃金を支払う。</p>

<h3>第6条（賃金）</h3>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr><td style="border:1px solid #999; padding:4px 8px; width:40%;">基本給</td><td style="border:1px solid #999; padding:4px 8px;"><strong>{{基本給}}円</strong>/月</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">通勤手当</td><td style="border:1px solid #999; padding:4px 8px;">実費支給（上限 月15,000円・非課税分）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">支払日</td><td style="border:1px solid #999; padding:4px 8px;">毎月25日（銀行振込）</td></tr>
</table>

<h3>第7条（休日・休暇）</h3>
<p>週休2日制（シフトによる）。年次有給休暇は労働基準法第39条による。</p>

<h3>第8条（社会保険）</h3>
<p>健康保険・厚生年金保険・雇用保険・労災保険に加入する。</p>

<h3>第9条（就業規則）</h3>
<p>本契約に定めのない事項は会社の就業規則による。乙はこれを遵守するものとする。</p>

<h3>第10条（機密保持）</h3>
<p>在職中および退職後も、業務上知り得た患者・顧客情報を第三者に漏洩してはならない。</p>

<br>
<p>本契約の締結を証するため、本書を作成する。</p>
<br>
<table style="width:100%;">
<tr>
<td style="width:50%; padding:8px;">甲：有限会社イトーメディカルケア<br><br>代表者　　　　　　　　　　　　印</td>
<td style="width:50%; padding:8px;">乙：{{氏名}}<br><br>署名　　　　　　　　　　　　　</td>
</tr>
</table>
</div>
', '[
  {"key":"氏名","label":"氏名","default":""},
  {"key":"入社日","label":"入社日","default":""},
  {"key":"就業場所","label":"就業場所","default":"イトーメディカルケア 各院"},
  {"key":"始業時刻","label":"始業時刻","default":"09:00"},
  {"key":"終業時刻","label":"終業時刻","default":"18:00"},
  {"key":"固定残業時間","label":"固定残業時間（時間）","default":"20"},
  {"key":"固定残業代","label":"固定残業代（円）","default":""},
  {"key":"基本給","label":"基本給（円）","default":""}
]'::jsonb),

('療術', 'パート', '雇用契約書（療術部門・パートタイム）', '
<div style="font-family: ''MS Gothic'', ''Hiragino Kaku Gothic ProN'', sans-serif; line-height: 1.8; color: #000; padding: 0 8px;">
<h2 style="text-align:center; font-size:18px; margin-bottom:24px; letter-spacing:4px;">雇用契約書（パートタイム）</h2>

<p>有限会社イトーメディカルケア（以下「甲」という）と<strong>{{氏名}}</strong>（以下「乙」という）は、パートタイム労働法に基づき以下の条件で雇用契約を締結する。</p>

<h3>第1条（雇用形態）</h3>
<p>パートタイム労働者（短時間労働者）として採用する。</p>

<h3>第2条（契約期間）</h3>
<p>{{契約開始日}} から {{契約終了日}} まで<br>
（更新の場合あり。更新の有無は期間満了の30日前に通知する。）</p>

<h3>第3条（就業場所・業務内容）</h3>
<p>就業場所：{{就業場所}}<br>
業務内容：あん摩マッサージ指圧・はり・きゅう施術補助業務、受付・清掃業務、その他付随業務</p>

<h3>第4条（労働時間・休憩）</h3>
<p>週の所定労働時間：{{週所定時間}}時間<br>
シフト制につき別途シフト表による。<br>
休憩：労働基準法の定めによる。</p>

<h3>第5条（賃金）</h3>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr><td style="border:1px solid #999; padding:4px 8px; width:40%;">時給</td><td style="border:1px solid #999; padding:4px 8px;"><strong>{{時給}}円</strong>（地域最低賃金以上）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">時間外割増</td><td style="border:1px solid #999; padding:4px 8px;">法定時間外：25%増　深夜（22時〜5時）：25%増</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">通勤手当</td><td style="border:1px solid #999; padding:4px 8px;">実費支給（上限 月15,000円・非課税分）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">支払日</td><td style="border:1px solid #999; padding:4px 8px;">毎月25日（銀行振込）</td></tr>
</table>

<h3>第6条（社会保険）</h3>
<p>週20時間以上かつ月額賃金8.8万円以上の場合は社会保険に加入する。雇用保険は週20時間以上の場合に加入する。</p>

<h3>第7条（有給休暇）</h3>
<p>労働基準法第39条に基づき、6か月継続勤務・出勤率80%以上の場合に付与する。</p>

<h3>第8条（就業規則）</h3>
<p>本契約に定めのない事項は会社のパートタイム就業規則による。</p>

<h3>第9条（機密保持）</h3>
<p>在職中および退職後も、業務上知り得た患者・顧客情報を第三者に漏洩してはならない。</p>

<br>
<table style="width:100%;">
<tr>
<td style="width:50%; padding:8px;">甲：有限会社イトーメディカルケア<br><br>代表者　　　　　　　　　　　　印</td>
<td style="width:50%; padding:8px;">乙：{{氏名}}<br><br>署名　　　　　　　　　　　　　</td>
</tr>
</table>
</div>
', '[
  {"key":"氏名","label":"氏名","default":""},
  {"key":"契約開始日","label":"契約開始日","default":""},
  {"key":"契約終了日","label":"契約終了日","default":""},
  {"key":"就業場所","label":"就業場所","default":"イトーメディカルケア 各院"},
  {"key":"週所定時間","label":"週所定労働時間（時間）","default":""},
  {"key":"時給","label":"時給（円）","default":""}
]'::jsonb),

('福祉', '正社員', '雇用契約書（福祉部門・正社員）', '
<div style="font-family: ''MS Gothic'', ''Hiragino Kaku Gothic ProN'', sans-serif; line-height: 1.8; color: #000; padding: 0 8px;">
<h2 style="text-align:center; font-size:18px; margin-bottom:24px; letter-spacing:4px;">雇用契約書</h2>

<p>有限会社イトーメディカルケア（以下「甲」という）と<strong>{{氏名}}</strong>（以下「乙」という）は、以下の条件で雇用契約を締結する。</p>

<h3>第1条（雇用形態）</h3>
<p>正社員（福祉部門）として採用する。</p>

<h3>第2条（契約期間）</h3>
<p>期間の定めなし　　採用日：{{入社日}}</p>

<h3>第3条（就業場所・業務内容）</h3>
<p>就業場所：{{就業場所}}<br>
業務内容：介護・福祉サービスの提供（訪問介護・施設介護等）、記録業務、その他付随業務</p>

<h3>第4条（労働時間・休憩）</h3>
<p>変形労働時間制（1か月単位）を採用する。<br>
1か月の法定労働時間内でシフトを組む。<br>
夜勤あり（月{{夜勤回数}}回程度）。夜勤時の休憩は2時間とする。</p>

<h3>第5条（時間外・夜勤手当）</h3>
<p>時間外労働：25%割増（月60時間超は50%）<br>
深夜労働（22時〜5時）：25%割増<br>
夜勤手当：{{夜勤手当}}円/回</p>

<h3>第6条（賃金）</h3>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr><td style="border:1px solid #999; padding:4px 8px; width:40%;">基本給</td><td style="border:1px solid #999; padding:4px 8px;"><strong>{{基本給}}円</strong>/月</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">処遇改善手当</td><td style="border:1px solid #999; padding:4px 8px;">{{処遇改善手当}}円/月（介護職員処遇改善加算による）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">通勤手当</td><td style="border:1px solid #999; padding:4px 8px;">実費支給（上限 月15,000円・非課税分）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">支払日</td><td style="border:1px solid #999; padding:4px 8px;">毎月25日（銀行振込）</td></tr>
</table>

<h3>第7条（休日・休暇）</h3>
<p>4週8休制（シフトによる）。年次有給休暇は労働基準法第39条による。<br>
介護休業・育児休業は法令の定めによる。</p>

<h3>第8条（社会保険）</h3>
<p>健康保険・厚生年金保険・雇用保険・労災保険に加入する。</p>

<h3>第9条（資格・研修）</h3>
<p>会社は法令に基づく研修受講を義務付ける。乙はこれに参加するものとする。</p>

<h3>第10条（就業規則・機密保持）</h3>
<p>本契約に定めのない事項は会社の就業規則による。業務上知り得た利用者・患者情報は厳守するものとする。</p>

<br>
<table style="width:100%;">
<tr>
<td style="width:50%; padding:8px;">甲：有限会社イトーメディカルケア<br><br>代表者　　　　　　　　　　　　印</td>
<td style="width:50%; padding:8px;">乙：{{氏名}}<br><br>署名　　　　　　　　　　　　　</td>
</tr>
</table>
</div>
', '[
  {"key":"氏名","label":"氏名","default":""},
  {"key":"入社日","label":"入社日","default":""},
  {"key":"就業場所","label":"就業場所","default":"イトーメディカルケア 各院"},
  {"key":"夜勤回数","label":"夜勤回数（回/月）","default":"4"},
  {"key":"夜勤手当","label":"夜勤手当（円/回）","default":"5000"},
  {"key":"基本給","label":"基本給（円）","default":""},
  {"key":"処遇改善手当","label":"処遇改善手当（円）","default":""}
]'::jsonb),

('福祉', 'パート', '雇用契約書（福祉部門・パートタイム）', '
<div style="font-family: ''MS Gothic'', ''Hiragino Kaku Gothic ProN'', sans-serif; line-height: 1.8; color: #000; padding: 0 8px;">
<h2 style="text-align:center; font-size:18px; margin-bottom:24px; letter-spacing:4px;">雇用契約書（パートタイム）</h2>

<p>有限会社イトーメディカルケア（以下「甲」という）と<strong>{{氏名}}</strong>（以下「乙」という）は、パートタイム労働法に基づき以下の条件で雇用契約を締結する。</p>

<h3>第1条（雇用形態）</h3>
<p>パートタイム労働者（短時間労働者・福祉部門）として採用する。</p>

<h3>第2条（契約期間）</h3>
<p>{{契約開始日}} から {{契約終了日}} まで<br>
（更新の場合あり。5年超の場合は無期転換申込権が発生する。）</p>

<h3>第3条（就業場所・業務内容）</h3>
<p>就業場所：{{就業場所}}<br>
業務内容：訪問介護・通所介護等の介護補助業務、生活援助、身体介護補助</p>

<h3>第4条（労働時間）</h3>
<p>週の所定労働時間：{{週所定時間}}時間（シフト制）<br>
深夜・早朝シフトあり（別途シフト表による）。</p>

<h3>第5条（賃金）</h3>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr><td style="border:1px solid #999; padding:4px 8px; width:40%;">時給</td><td style="border:1px solid #999; padding:4px 8px;"><strong>{{時給}}円</strong></td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">深夜割増</td><td style="border:1px solid #999; padding:4px 8px;">22時〜5時：25%増</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">処遇改善分</td><td style="border:1px solid #999; padding:4px 8px;">時給に加算して支払（加算額は月次精算）</td></tr>
<tr><td style="border:1px solid #999; padding:4px 8px;">支払日</td><td style="border:1px solid #999; padding:4px 8px;">毎月25日（銀行振込）</td></tr>
</table>

<h3>第6条（社会保険・有給休暇）</h3>
<p>週20時間以上の場合は雇用保険に加入。条件充足時は健康保険・厚生年金にも加入。<br>
年次有給休暇は労働基準法第39条による。</p>

<h3>第7条（就業規則・機密保持）</h3>
<p>パートタイム就業規則を遵守すること。業務上知り得た利用者情報は厳守するものとする。</p>

<br>
<table style="width:100%;">
<tr>
<td style="width:50%; padding:8px;">甲：有限会社イトーメディカルケア<br><br>代表者　　　　　　　　　　　　印</td>
<td style="width:50%; padding:8px;">乙：{{氏名}}<br><br>署名　　　　　　　　　　　　　</td>
</tr>
</table>
</div>
', '[
  {"key":"氏名","label":"氏名","default":""},
  {"key":"契約開始日","label":"契約開始日","default":""},
  {"key":"契約終了日","label":"契約終了日","default":""},
  {"key":"就業場所","label":"就業場所","default":"イトーメディカルケア 各院"},
  {"key":"週所定時間","label":"週所定労働時間（時間）","default":""},
  {"key":"時給","label":"時給（円）","default":""}
]'::jsonb);
