import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const employeeId = searchParams.get('employee_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('payroll_calculations')
    .select(`
      *,
      employee:payroll_employee_id (
        *,
        staff:staff_id ( id, name, clinic_id, clinic:clinic_id(name) )
      ),
      allowances:payroll_allowances(*)
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (year)       query = query.eq('year', parseInt(year))
  if (month)      query = query.eq('month', parseInt(month))
  if (employeeId) query = query.eq('payroll_employee_id', employeeId)
  if (status)     query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ステータス更新
export async function PATCH(req: NextRequest) {
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
