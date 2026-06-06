import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('business_id')

  let query = supabase
    .from('outreach_events')
    .select('*')
    .order('occurred_at', { ascending: false })

  if (businessId) query = query.eq('business_id', businessId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('outreach_events')
    .insert({
      business_id: body.business_id,
      event_type: body.event_type,
      event_note: body.event_note || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update business status based on event
  const statusMap: Record<string, string> = {
    sent: 'contacted',
    meeting: 'negotiating',
    contracted: 'contracted',
    lost: 'lost',
  }
  const newStatus = statusMap[body.event_type]
  if (newStatus) {
    await supabase
      .from('businesses')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', body.business_id)
  }

  return NextResponse.json(data, { status: 201 })
}
