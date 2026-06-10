import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const clinicId = searchParams.get('clinic_id')
  const activeOnly = searchParams.get('active') !== 'false'

  let query = supabase
    .from('staff')
    .select('id, name, clinic_id, is_active, clinic:clinic_id(name)')
    .order('clinic_id')
    .order('name')

  if (activeOnly) query = query.eq('is_active', true)
  if (clinicId) query = query.eq('clinic_id', clinicId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
