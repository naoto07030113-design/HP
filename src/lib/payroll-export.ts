import type { PayrollCalculation, PayrollEmployee, PayrollAttendance } from '@/types/payroll'

// ============================================================
// 賃金台帳 CSV（マネーフォワードクラウド給与準拠）
// ============================================================
export interface WageLedgerRow {
  calc: PayrollCalculation & {
    employee: PayrollEmployee & {
      staff?: { name: string; clinic?: { name: string } }
    }
    allowances?: { category: string; description: string; amount: number; is_deduction: boolean }[]
  }
  attendance?: PayrollAttendance
}

export function generateWageLedgerCSV(
  year: number,
  month: number,
  rows: WageLedgerRow[],
  companyName: string = '有限会社イトーメディカルケア'
): string {
  const HEADERS = [
    '月度',
    '所属',
    '社員番号',
    '氏名',
    '生年月日',
    '雇用区分',
    '入社年月日',
    '退職年月日',
    '支給日',
    // 勤怠
    '出勤日数',
    '欠勤日数',
    '有給休暇取得日数',
    '所定外労働時間',
    '深夜労働時間',
    '休日労働時間',
    '遅刻・早退回数',
    // 支給
    '基本給',
    '固定残業代',
    '超過残業手当',
    '深夜手当',
    '休日手当',
    '欠勤控除',
    '通勤手当（非課税）',
    '通勤手当（課税）',
    '業績手当',
    'その他手当',
    '支給合計',
    '課税支給額',
    // 控除
    '健康保険料',
    '介護保険料',
    '厚生年金保険料',
    '雇用保険料',
    '社会保険料計',
    '所得税',
    '住民税',
    'その他控除',
    '控除合計',
    // 差引
    '差引支給額',
    '標準報酬月額',
  ]

  const paymentDate = `${year}/${month}/25`

  const dataRows = rows.map(({ calc, attendance }) => {
    const emp = calc.employee
    const socialInsTotal =
      calc.health_insurance +
      calc.nursing_care_insurance +
      calc.welfare_pension +
      calc.employment_insurance

    return [
      `${year}年${month}月`,
      emp.staff?.clinic?.name ?? '',
      emp.employee_number ?? '',
      emp.staff?.name ?? '',
      emp.birth_date ?? '',
      emp.contract_type,
      emp.hire_date,
      emp.resignation_date ?? '',
      paymentDate,
      // 勤怠
      attendance?.actual_work_days ?? '',
      attendance?.absence_days ?? '',
      attendance?.paid_leave_days ?? '',
      attendance ? (attendance.overtime_hours + attendance.overtime_hours_over60).toFixed(2) : '',
      attendance?.late_night_hours?.toFixed(2) ?? '',
      attendance?.holiday_work_hours?.toFixed(2) ?? '',
      attendance?.late_early_leave_times ?? '',
      // 支給
      calc.basic_salary,
      calc.fixed_overtime_pay,
      calc.excess_overtime_pay,
      calc.late_night_pay,
      calc.holiday_work_pay,
      calc.absence_deduction > 0 ? -calc.absence_deduction : '',
      calc.commute_allowance,
      calc.commute_allowance_taxable,
      calc.performance_allowance,
      calc.other_allowances,
      calc.gross_pay,
      calc.taxable_gross,
      // 控除
      calc.health_insurance,
      calc.nursing_care_insurance,
      calc.welfare_pension,
      calc.employment_insurance,
      socialInsTotal,
      calc.income_tax,
      calc.resident_tax,
      calc.other_deductions,
      calc.total_deductions,
      // 差引
      calc.net_pay,
      calc.standard_monthly_salary,
    ]
  })

  const lines = [
    // 1行目: ヘッダー情報（MF形式）
    `会社名,${esc(companyName)},賃金台帳,${year}年${month}月度`,
    '',
    HEADERS.map(esc).join(','),
    ...dataRows.map(row => row.map(v => esc(String(v ?? ''))).join(',')),
  ]

  return '﻿' + lines.join('\r\n')  // UTF-8 BOM付き（Excel対応）
}

// ============================================================
// 給与支給一覧 CSV（税理士向けサマリー）
// ============================================================
export function generatePayrollSummaryCSV(
  year: number,
  month: number,
  rows: WageLedgerRow[]
): string {
  const HEADERS = [
    '氏名', '所属', '雇用区分',
    '支給合計', '健康保険', '介護保険', '厚生年金', '雇用保険',
    '社保計', '所得税', '住民税', '控除合計', '差引支給額',
  ]

  const dataRows = rows.map(({ calc }) => {
    const emp = calc.employee
    const socialInsTotal =
      calc.health_insurance + calc.nursing_care_insurance +
      calc.welfare_pension + calc.employment_insurance

    return [
      emp.staff?.name ?? '',
      emp.staff?.clinic?.name ?? '',
      emp.contract_type,
      calc.gross_pay,
      calc.health_insurance,
      calc.nursing_care_insurance,
      calc.welfare_pension,
      calc.employment_insurance,
      socialInsTotal,
      calc.income_tax,
      calc.resident_tax,
      calc.total_deductions,
      calc.net_pay,
    ]
  })

  // 合計行
  const totals = [
    '合計', '', '',
    sum(rows, r => r.calc.gross_pay),
    sum(rows, r => r.calc.health_insurance),
    sum(rows, r => r.calc.nursing_care_insurance),
    sum(rows, r => r.calc.welfare_pension),
    sum(rows, r => r.calc.employment_insurance),
    sum(rows, r => r.calc.health_insurance + r.calc.nursing_care_insurance + r.calc.welfare_pension + r.calc.employment_insurance),
    sum(rows, r => r.calc.income_tax),
    sum(rows, r => r.calc.resident_tax),
    sum(rows, r => r.calc.total_deductions),
    sum(rows, r => r.calc.net_pay),
  ]

  const lines = [
    `${year}年${month}月 給与支給一覧`,
    HEADERS.map(esc).join(','),
    ...dataRows.map(r => r.map(v => esc(String(v))).join(',')),
    totals.map(v => esc(String(v))).join(','),
  ]

  return '﻿' + lines.join('\r\n')
}

// ============================================================
// 仕訳データ CSV（弥生会計・freee・MF会計対応）
// ============================================================
export type JournalFormat = 'yayoi' | 'freee' | 'mf'

export function generateJournalCSV(
  year: number,
  month: number,
  rows: WageLedgerRow[],
  format: JournalFormat = 'mf'
): string {
  const paymentDate = `${year}/${padZ(month)}/25`
  const period = `${year}年${month}月分`

  const totalGross         = sum(rows, r => r.calc.gross_pay)
  const totalHealth        = sum(rows, r => r.calc.health_insurance)
  const totalNursing       = sum(rows, r => r.calc.nursing_care_insurance)
  const totalPension       = sum(rows, r => r.calc.welfare_pension)
  const totalEmployment    = sum(rows, r => r.calc.employment_insurance)
  const totalIncomeTax     = sum(rows, r => r.calc.income_tax)
  const totalResidentTax   = sum(rows, r => r.calc.resident_tax)
  const totalOtherDed      = sum(rows, r => r.calc.other_deductions)
  const totalNet           = sum(rows, r => r.calc.net_pay)
  const totalCommute       = sum(rows, r => r.calc.commute_allowance)

  // 仕訳エントリ: [借方科目, 借方金額, 貸方科目, 貸方金額, 摘要]
  type JournalEntry = [string, number, string, number, string]

  const entries: JournalEntry[] = [
    // 賃金 / 普通預金（差引支給）
    ['給料手当', totalGross - totalCommute, '普通預金', totalNet, `${period}給与支給`],
    // 通勤手当
    ...(totalCommute > 0 ? [['旅費交通費', totalCommute, '普通預金', 0, `${period}通勤手当`] as JournalEntry] : []),
    // 健康保険料（預り金）
    ['給料手当', 0, '預り金', totalHealth, `${period}健康保険料控除`],
    // 介護保険料
    ...(totalNursing > 0 ? [['給料手当', 0, '預り金', totalNursing, `${period}介護保険料控除`] as JournalEntry] : []),
    // 厚生年金
    ['給料手当', 0, '預り金', totalPension, `${period}厚生年金控除`],
    // 雇用保険
    ['給料手当', 0, '預り金', totalEmployment, `${period}雇用保険控除`],
    // 所得税
    ['給料手当', 0, '預り金', totalIncomeTax, `${period}源泉所得税控除`],
    // 住民税
    ...(totalResidentTax > 0 ? [['給料手当', 0, '預り金', totalResidentTax, `${period}住民税控除`] as JournalEntry] : []),
    // その他控除
    ...(totalOtherDed > 0 ? [['給料手当', 0, '預り金', totalOtherDed, `${period}その他控除`] as JournalEntry] : []),
  ]

  if (format === 'yayoi') {
    // 弥生会計形式
    const lines = [
      '\"!弥生会計\"',
      '\"Data\"',
      '\"伝票日付\",\"借方勘定科目\",\"借方金額\",\"貸方勘定科目\",\"貸方金額\",\"摘要\"',
      ...entries
        .filter(([, db, , cr]) => db > 0 || cr > 0)
        .map(([dAcc, dAmt, cAcc, cAmt, memo]) =>
          `${paymentDate},${esc(dAcc)},${dAmt || ''},${esc(cAcc)},${cAmt || ''},${esc(memo)}`
        ),
    ]
    return '﻿' + lines.join('\r\n')
  }

  if (format === 'freee') {
    // freee形式
    const lines = [
      '取引日,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要',
      ...entries
        .filter(([, db, , cr]) => db > 0 || cr > 0)
        .map(([dAcc, dAmt, cAcc, cAmt, memo]) =>
          `${paymentDate},${esc(dAcc)},${dAmt || ''},${esc(cAcc)},${cAmt || ''},${esc(memo)}`
        ),
    ]
    return '﻿' + lines.join('\r\n')
  }

  // MF会計（デフォルト）
  const lines = [
    '取引日,借方勘定科目,借方補助科目,借方部門,借方金額,借方税区分,貸方勘定科目,貸方補助科目,貸方部門,貸方金額,貸方税区分,摘要,メモ,タグ,MF仕訳ID',
    ...entries
      .filter(([, db, , cr]) => db > 0 || cr > 0)
      .map(([dAcc, dAmt, cAcc, cAmt, memo]) =>
        [
          paymentDate,
          esc(dAcc), '', '', dAmt || '', '対象外',
          esc(cAcc), '', '', cAmt || '', '対象外',
          esc(memo), '', '', '',
        ].join(',')
      ),
  ]
  return '﻿' + lines.join('\r\n')
}

// ============================================================
// ユーティリティ
// ============================================================
function esc(s: string): string {
  if (s === '') return ''
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function sum(rows: WageLedgerRow[], fn: (r: WageLedgerRow) => number): number {
  return rows.reduce((acc, r) => acc + (fn(r) || 0), 0)
}

function padZ(n: number): string {
  return String(n).padStart(2, '0')
}

// ============================================================
// ブラウザ側ダウンロード
// ============================================================
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
