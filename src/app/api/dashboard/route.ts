import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServiceClient()

  const [
    { count: total },
    { count: lp_count },
    { count: email_count },
    { count: negotiation_count },
    { count: contracted_count },
    { data: predictions },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('lp_variants').select('*', { count: 'exact', head: true }),
    supabase.from('outreach_messages').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'negotiating'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'contracted'),
    supabase.from('predictions').select('priority_score').gte('priority_score', 0.8),
  ])

  return NextResponse.json({
    total_businesses: total ?? 0,
    high_priority_count: predictions?.length ?? 0,
    lp_generated_count: lp_count ?? 0,
    email_generated_count: email_count ?? 0,
    negotiation_count: negotiation_count ?? 0,
    contracted_count: contracted_count ?? 0,
  })
}
