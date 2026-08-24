import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getPayrollAuth, requireNonClinicDirector } from '@/lib/payroll-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const activeOnly = searchParams.get('active') !== 'false'
  const auth = await getPayrollAuth(req)

  let query = supabase
    .from('payroll_employees')
    .select(`
      *,
      staff:staff_id${auth?.payrollRole === 'clinic_director' ? '!inner' : ''} (
        id, name, clinic_id,
        clinic:clinic_id ( name )
      )
    `)
    .order('created_at')

  if (activeOnly) query = query.eq('is_active', true)
  // 院長は自院に所属する従業員のみ閲覧可能
  if (auth?.payrollRole === 'clinic_director' && auth.clinicId) {
    query = query.eq('staff.clinic_id', auth.clinicId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await getPayrollAuth(req)
  const denied = requireNonClinicDirector(auth)
  if (denied) return denied

  const supabase = createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('payroll_employees')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
