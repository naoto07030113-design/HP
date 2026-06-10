/**
 * マネーフォワードクラウド給与 準拠 給与明細書
 * @media print で使用 / 画面表示 / PDF印刷 いずれにも対応
 */
'use client'

import type { PayrollCalculation, PayrollEmployee, PayrollAttendance } from '@/types/payroll'

interface Props {
  calc: PayrollCalculation & {
    employee: PayrollEmployee & {
      staff?: { name: string; clinic?: { name: string } }
    }
    allowances?: { category: string; description: string; amount: number; is_deduction: boolean }[]
  }
  attendance?: PayrollAttendance
  companyName?: string
}

export default function PayslipPrint({ calc, attendance, companyName = '有限会社イトーメディカルケア' }: Props) {
  const emp = calc.employee
  const staffName = emp.staff?.name ?? '―'
  const deptName  = emp.staff?.clinic?.name ?? '―'

  const paymentDate = `${calc.year}年${calc.month}月25日`
  const periodLabel = `${calc.year}年${calc.month}月度`

  const socialInsTotal =
    calc.health_insurance + calc.nursing_care_insurance +
    calc.welfare_pension + calc.employment_insurance

  // 支給項目リスト（MF準拠の並び順）
  const incomeRows: { label: string; amount: number }[] = [
    { label: '基本給', amount: calc.basic_salary },
    ...(calc.fixed_overtime_pay > 0      ? [{ label: `固定残業代（${emp.fixed_overtime_hours}H）`, amount: calc.fixed_overtime_pay }] : []),
    ...(calc.excess_overtime_pay > 0     ? [{ label: '超過残業手当',       amount: calc.excess_overtime_pay }] : []),
    ...(calc.late_night_pay > 0          ? [{ label: '深夜手当',           amount: calc.late_night_pay }] : []),
    ...(calc.holiday_work_pay > 0        ? [{ label: '休日出勤手当',       amount: calc.holiday_work_pay }] : []),
    ...(calc.performance_allowance > 0   ? [{ label: '業績手当',           amount: calc.performance_allowance }] : []),
    ...(calc.commute_allowance > 0       ? [{ label: '通勤手当（非課税）', amount: calc.commute_allowance }] : []),
    ...(calc.commute_allowance_taxable > 0 ? [{ label: '通勤手当（課税）', amount: calc.commute_allowance_taxable }] : []),
    // 追加手当
    ...(calc.allowances ?? [])
      .filter(a => !a.is_deduction)
      .map(a => ({ label: a.description || a.category, amount: a.amount })),
    ...(calc.absence_deduction > 0       ? [{ label: '欠勤控除',           amount: -calc.absence_deduction }] : []),
  ]

  // 控除項目リスト（MF準拠の並び順）
  const deductionRows: { label: string; amount: number }[] = [
    ...(calc.health_insurance > 0        ? [{ label: '健康保険料',     amount: calc.health_insurance }] : []),
    ...(calc.nursing_care_insurance > 0  ? [{ label: '介護保険料',     amount: calc.nursing_care_insurance }] : []),
    ...(calc.welfare_pension > 0         ? [{ label: '厚生年金保険料', amount: calc.welfare_pension }] : []),
    ...(calc.employment_insurance > 0    ? [{ label: '雇用保険料',     amount: calc.employment_insurance }] : []),
    ...(calc.income_tax > 0              ? [{ label: '所得税',         amount: calc.income_tax }] : []),
    ...(calc.resident_tax > 0            ? [{ label: '住民税',         amount: calc.resident_tax }] : []),
    ...(calc.other_deductions > 0        ? [{ label: 'その他控除',     amount: calc.other_deductions }] : []),
    ...(calc.allowances ?? [])
      .filter(a => a.is_deduction)
      .map(a => ({ label: a.description || a.category, amount: a.amount })),
  ]

  // 空行パディング（MFは最低8行表示）
  const MIN_ROWS = 8
  while (incomeRows.length < MIN_ROWS) incomeRows.push({ label: '', amount: 0 })
  while (deductionRows.length < MIN_ROWS) deductionRows.push({ label: '', amount: 0 })

  return (
    <div className="payslip-wrapper font-sans text-[13px] leading-snug text-gray-900 bg-white">
      {/* ===== ヘッダー ===== */}
      <table className="payslip-header-table w-full border-collapse mb-0">
        <tbody>
          <tr>
            <td className="border border-gray-400 px-3 py-1.5 w-[55%]">
              <span className="text-[11px] text-gray-500">会社名</span><br />
              <span className="font-bold">{companyName}</span>
            </td>
            <td className="border border-gray-400 px-3 py-1.5 text-center w-[20%]">
              <span className="font-bold text-base tracking-widest">給与明細書</span>
            </td>
            <td className="border border-gray-400 px-3 py-1.5 text-right w-[25%]">
              <span className="text-[11px] text-gray-500">給与年月</span><br />
              <span className="font-bold">{periodLabel}</span>
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-1.5" colSpan={2}>
              <span className="text-[11px] text-gray-500">所属</span>
              &emsp;<span className="font-medium">{deptName}</span>
              &emsp;&emsp;
              <span className="text-[11px] text-gray-500">社員番号</span>
              &emsp;<span className="font-medium">{emp.employee_number ?? '―'}</span>
              &emsp;&emsp;
              <span className="text-[11px] text-gray-500">氏名</span>
              &emsp;<span className="font-bold text-[14px]">{staffName}</span>
              &emsp;<span className="text-[11px] text-gray-500">様</span>
            </td>
            <td className="border border-gray-400 px-3 py-1.5 text-right">
              <span className="text-[11px] text-gray-500">支給日</span><br />
              <span className="font-medium">{paymentDate}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== 勤怠情報 ===== */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="payslip-section-header" colSpan={8}>勤　怠</th>
          </tr>
          <tr className="bg-gray-100">
            {['出勤日数','欠勤日数','有給取得','遅刻・早退','所定外労働時間','深夜労働時間','休日労働時間','備考'].map(h => (
              <th key={h} className="border border-gray-400 px-2 py-0.5 text-center text-[11px] font-normal w-[12.5%]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <AttCell value={attendance ? `${attendance.actual_work_days}日` : '―'} />
            <AttCell value={attendance ? `${attendance.absence_days}日` : '―'} />
            <AttCell value={attendance ? `${attendance.paid_leave_days}日` : '―'} />
            <AttCell value={attendance ? `${attendance.late_early_leave_times}回` : '―'} />
            <AttCell value={attendance ? `${(attendance.overtime_hours + attendance.overtime_hours_over60).toFixed(2)}H` : '―'} />
            <AttCell value={attendance ? `${attendance.late_night_hours.toFixed(2)}H` : '―'} />
            <AttCell value={attendance ? `${attendance.holiday_work_hours.toFixed(2)}H` : '―'} />
            <AttCell value="" />
          </tr>
        </tbody>
      </table>

      {/* ===== 支給 / 控除 ===== */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="payslip-section-header" colSpan={4}>支　給</th>
            <th className="payslip-section-header" colSpan={4}>控　除</th>
          </tr>
          <tr className="bg-gray-100 text-[11px] font-normal text-center">
            <th className="border border-gray-400 px-1 py-0.5 w-[24%]">項目</th>
            <th className="border border-gray-400 px-1 py-0.5 w-[13%]">金額</th>
            <th className="border border-gray-400 px-1 py-0.5 w-[24%]">項目</th>
            <th className="border border-gray-400 px-1 py-0.5 w-[13%] border-r-2 border-gray-600">金額</th>
            <th className="border border-gray-400 px-1 py-0.5 w-[14%]">項目</th>
            <th className="border border-gray-400 px-1 py-0.5 w-[12%]">金額</th>
            <th className="border border-gray-400 px-1 py-0.5 w-[14%]">項目</th>
            <th className="border border-gray-400 px-1 py-0.5 w-[12%]">金額</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.max(incomeRows.length, deductionRows.length) }).map((_, i) => {
            const inc = incomeRows[i]  ?? { label: '', amount: 0 }
            const ded = deductionRows[i] ?? { label: '', amount: 0 }
            return (
              <tr key={i}>
                <PayslipCell label={inc.label} />
                <PayslipAmtCell amount={inc.label ? inc.amount : null} negative={inc.amount < 0} />
                <PayslipCell label="" />
                <td className="border border-gray-400 border-r-2 border-r-gray-600" />
                <PayslipCell label={ded.label} />
                <PayslipAmtCell amount={ded.label ? ded.amount : null} />
                <PayslipCell label="" />
                <td className="border border-gray-400" />
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* ===== 合計行 ===== */}
      <table className="w-full border-collapse">
        <tbody>
          <tr className="bg-gray-50">
            <td className="border border-gray-400 px-2 py-1 text-center text-[11px] w-[37%] font-medium">支給合計</td>
            <td className="border border-gray-400 px-2 py-1 text-right font-bold tabular-nums w-[13%] border-r-2 border-r-gray-600">
              {fmt(calc.gross_pay)}
            </td>
            <td className="border border-gray-400 px-2 py-1 text-center text-[11px] w-[26%] font-medium">控除合計</td>
            <td className="border border-gray-400 px-2 py-1 text-right font-bold tabular-nums w-[24%]">
              {fmt(calc.total_deductions)}
            </td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border border-gray-400 px-2 py-1 text-[11px] text-gray-500" colSpan={2}>
              うち社会保険料計&emsp;{fmt(socialInsTotal)}
              &emsp;うち課税支給額&emsp;{fmt(calc.taxable_gross)}
            </td>
            <td className="border border-gray-400 px-2 py-1 text-[11px] text-gray-500" colSpan={2}>
              標準報酬月額&emsp;{fmt(calc.standard_monthly_salary)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== 差引支給額 ===== */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="border border-gray-400 bg-gray-800 text-white text-center font-bold py-2 text-sm w-[30%]">
              差引支給額（お手取り額）
            </td>
            <td className="border border-gray-400 text-right font-bold text-xl tabular-nums px-4 py-2">
              ¥ {calc.net_pay.toLocaleString('ja-JP')}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== フッター ===== */}
      <div className="mt-1 text-right text-[10px] text-gray-400 pr-1">
        ※ この明細書に関するご質問は担当部署にお問い合わせください
      </div>
    </div>
  )
}

function AttCell({ value }: { value: string }) {
  return (
    <td className="border border-gray-400 px-2 py-1.5 text-center tabular-nums">{value}</td>
  )
}

function PayslipCell({ label }: { label: string }) {
  return (
    <td className="border border-gray-400 px-2 py-0.5 text-[12px] h-[22px]">
      {label}
    </td>
  )
}

function PayslipAmtCell({ amount, negative = false }: { amount: number | null; negative?: boolean }) {
  if (amount === null || amount === 0 && !negative) {
    return <td className="border border-gray-400 px-2 py-0.5 text-right tabular-nums text-[12px]" />
  }
  return (
    <td className={`border border-gray-400 px-2 py-0.5 text-right tabular-nums text-[12px] ${negative ? 'text-red-600' : ''}`}>
      {negative || amount < 0 ? `-${Math.abs(amount).toLocaleString('ja-JP')}` : amount.toLocaleString('ja-JP')}
    </td>
  )
}

function fmt(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`
}
