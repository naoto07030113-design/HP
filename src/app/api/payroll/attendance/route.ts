import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getPayrollAuth } from '@/lib/payroll-auth'

export const dynamic = 'force-dynamic'

// 院長ロールの場合、自院に所属する payroll_employee_id の一覧を返す
async function clinicScopedEmployeeIds(
  supabase: ReturnType<typeof createServiceClient>,
  clinicId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('payroll_employees')
    .select('id, staff:staff_id!inner(clinic_id)')
    .eq('staff.clinic_id', clinicId)
  return (data ?? []).map((e) => e.id as string)
}

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const employeeId = searchParams.get('employee_id')
  const auth = await getPayrollAuth(req)

  let query = supabase
    .from('payroll_attendance')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (year) query = query.eq('year', parseInt(year))
  if (month) query = query.eq('month', parseInt(month))
  if (employeeId) query = query.eq('payroll_employee_id', employeeId)

  if (auth?.payrollRole === 'clinic_director' && auth.clinicId) {
    const ids = await clinicScopedEmployeeIds(supabase, auth.clinicId)
    query = query.in('payroll_employee_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const auth = await getPayrollAuth(req)
  const body = await req.json()

  // 院長は自院に所属する従業員の勤怠のみ入力可能
  if (auth?.payrollRole === 'clinic_director' && auth.clinicId) {
    const ids = await clinicScopedEmployeeIds(supabase, auth.clinicId)
    if (!ids.includes(body.payroll_employee_id)) {
      return NextResponse.json({ error: 'この従業員の勤怠を編集する権限がありません' }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('payroll_attendance')
    .upsert(body, { onConflict: 'payroll_employee_id,year,month' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
