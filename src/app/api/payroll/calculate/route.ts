import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { calculatePayroll } from '@/lib/payroll-calculator'
import type { PayrollEmployee, PayrollAttendance, SocialInsuranceRates, AllowanceItem } from '@/types/payroll'

export const dynamic = 'force-dynamic'

// プレビュー計算（未保存）
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { employee_id, year, month, additional_allowances, manual_adjustments, save } = body

  // 従業員情報取得
  const { data: employee, error: empErr } = await supabase
    .from('payroll_employees')
    .select('*, staff:staff_id(id, name, clinic_id, clinic:clinic_id(name))')
    .eq('id', employee_id)
    .single()

  if (empErr) return NextResponse.json({ error: empErr.message }, { status: 404 })

  // 勤怠情報取得
  const { data: attendance, error: attErr } = await supabase
    .from('payroll_attendance')
    .select('*')
    .eq('payroll_employee_id', employee_id)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 })

  // 適用する保険料率取得
  const { data: rates, error: ratesErr } = await supabase
    .from('social_insurance_rates')
    .select('*')
    .eq('is_active', true)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  if (ratesErr) return NextResponse.json({ error: '有効な社会保険料率が見つかりません' }, { status: 500 })

  const defaultAttendance: PayrollAttendance = attendance ?? {
    id: '',
    payroll_employee_id: employee_id,
    year,
    month,
    scheduled_work_days: 21,
    actual_work_days: 21,
    paid_leave_days: 0,
    absence_days: 0,
    late_early_leave_times: 0,
    scheduled_work_hours: 168,
    actual_work_hours: (employee as PayrollEmployee).contract_type === 'パート' ? 0 : 168,
    overtime_hours: 0,
    overtime_hours_over60: 0,
    late_night_hours: 0,
    holiday_work_hours: 0,
    notes: null,
    submitted_at: null,
    created_at: '',
    updated_at: '',
  }

  const result = calculatePayroll({
    employee: employee as PayrollEmployee,
    attendance: defaultAttendance,
    rates: rates as SocialInsuranceRates,
    additionalAllowances: additional_allowances as AllowanceItem[] | undefined,
    manualAdjustments: manual_adjustments,
  })

  if (!save) {
    return NextResponse.json({ result, employee, attendance: defaultAttendance, rates })
  }

  // 保存
  const calcData = {
    payroll_employee_id: employee_id,
    year,
    month,
    basic_salary: result.basic_salary,
    fixed_overtime_pay: result.fixed_overtime_pay,
    excess_overtime_pay: result.excess_overtime_pay,
    late_night_pay: result.late_night_pay,
    holiday_work_pay: result.holiday_work_pay,
    absence_deduction: result.absence_deduction,
    commute_allowance: result.commute_allowance,
    commute_allowance_taxable: result.commute_allowance_taxable,
    performance_allowance: result.performance_allowance,
    other_allowances: result.other_allowances,
    gross_pay: result.gross_pay,
    taxable_gross: result.taxable_gross,
    health_insurance: result.health_insurance,
    nursing_care_insurance: result.nursing_care_insurance,
    welfare_pension: result.welfare_pension,
    employment_insurance: result.employment_insurance,
    income_tax: result.income_tax,
    resident_tax: result.resident_tax,
    other_deductions: result.other_deductions,
    total_deductions: result.total_deductions,
    net_pay: result.net_pay,
    standard_monthly_salary: result.standard_monthly_salary,
    status: 'draft',
    insurance_rate_id: rates.id,
  }

  const { data: calc, error: calcErr } = await supabase
    .from('payroll_calculations')
    .upsert(calcData, { onConflict: 'payroll_employee_id,year,month' })
    .select()
    .single()

  if (calcErr) return NextResponse.json({ error: calcErr.message }, { status: 500 })

  // 手当明細を保存
  if (additional_allowances?.length > 0) {
    await supabase
      .from('payroll_allowances')
      .delete()
      .eq('calculation_id', calc.id)

    await supabase
      .from('payroll_allowances')
      .insert(
        (additional_allowances as AllowanceItem[]).map((a) => ({
          calculation_id: calc.id,
          category: a.category,
          description: a.description,
          amount: a.amount,
          is_taxable: a.is_taxable,
          is_deduction: a.is_deduction,
          notes: a.notes,
        }))
      )
  }

  return NextResponse.json({ result, calc })
}

// 月次一括計算
export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? '')
  const month = parseInt(searchParams.get('month') ?? '')

  if (!year || !month) {
    return NextResponse.json({ error: 'year and month required' }, { status: 400 })
  }

  const { data: calculations, error } = await supabase
    .from('payroll_calculations')
    .select(`
      *,
      employee:payroll_employee_id (
        *,
        staff:staff_id ( id, name, clinic_id, clinic:clinic_id(name) )
      ),
      allowances:payroll_allowances(*)
    `)
    .eq('year', year)
    .eq('month', month)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(calculations)
}
