import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getPayrollAuth, requireNonClinicDirector } from '@/lib/payroll-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const employeeId = searchParams.get('employee_id')
  const status = searchParams.get('status')
  const auth = await getPayrollAuth(req)

  let query = supabase
    .from('payroll_calculations')
    .select(`
      *,
      employee:payroll_employee_id${auth?.payrollRole === 'clinic_director' ? '!inner' : ''} (
        *,
        staff:staff_id${auth?.payrollRole === 'clinic_director' ? '!inner' : ''} ( id, name, clinic_id, clinic:clinic_id(name) )
      ),
      allowances:payroll_allowances(*)
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (year)       query = query.eq('year', parseInt(year))
  if (month)      query = query.eq('month', parseInt(month))
  if (employeeId) query = query.eq('payroll_employee_id', employeeId)
  if (status)     query = query.eq('status', status)
  // 院長は自院の従業員の明細のみ閲覧可能（参照のみ、ステータス変更は不可）
  if (auth?.payrollRole === 'clinic_director' && auth.clinicId) {
    query = query.eq('employee.staff.clinic_id', auth.clinicId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ステータス更新（総院長・給与担当のみ）
export async function PATCH(req: NextRequest) {
  const auth = await getPayrollAuth(req)
  const denied = requireNonClinicDirector(auth)
  if (denied) return denied

  const supabase = createServiceClient()
  const body = await req.json()
  const { ids, status } = body

  if (!ids?.length || !status) {
    return NextResponse.json({ error: 'ids and status required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('payroll_calculations')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
