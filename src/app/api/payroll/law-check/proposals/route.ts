import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// GET /api/payroll/law-check/proposals  → 未承認プロポーザル一覧
export async function GET(req: NextRequest) {
  const supabase = getAdmin()
  const status = new URL(req.url).searchParams.get('status') ?? 'pending'

  const { data, error } = await supabase
    .from('payroll_rate_proposals')
    .select('*, compliance:payroll_compliance(law_name, summary, source_url, effective_date)')
    .eq('review_status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// PATCH /api/payroll/law-check/proposals
// body: { id, action: 'approve'|'reject'|'apply', manual_value?: object }
export async function PATCH(req: NextRequest) {
  const supabase = getAdmin()
  const { id, action, manual_value } = await req.json() as {
    id: string
    action: 'approve' | 'reject' | 'apply'
    manual_value?: Record<string, unknown>
  }

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  }

  const now = new Date().toISOString()

  if (action === 'reject') {
    const { error } = await supabase
      .from('payroll_rate_proposals')
      .update({ review_status: 'rejected', reviewed_at: now })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // compliance も acknowledged に
    const { data: prop } = await supabase
      .from('payroll_rate_proposals')
      .select('compliance_id')
      .eq('id', id)
      .single()
    if (prop?.compliance_id) {
      await supabase
        .from('payroll_compliance')
        .update({ review_status: 'acknowledged', is_applied: true, applied_at: now })
        .eq('id', prop.compliance_id)
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'approve') {
    const { error } = await supabase
      .from('payroll_rate_proposals')
      .update({ review_status: 'approved', reviewed_at: now })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'apply') {
    // プロポーザル取得
    const { data: prop, error: propErr } = await supabase
      .from('payroll_rate_proposals')
      .select('*')
      .eq('id', id)
      .single()
    if (propErr || !prop) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

    const value = (manual_value ?? prop.proposed_value) as Record<string, unknown>

    // カテゴリ別にDB反映
    try {
      if (prop.category === '最低賃金' && value) {
        // minimum_wage_rates を更新 or 挿入
        const prefecture = String(value.prefecture ?? '全国')
        const newWage    = Number(value.new_wage ?? value.new ?? 0)
        const effDate    = prop.effective_date ?? new Date().toISOString().slice(0, 10)

        const year = new Date(effDate).getFullYear()

        const { data: existing } = await supabase
          .from('minimum_wage_rates')
          .select('id')
          .eq('prefecture', prefecture)
          .eq('year', year)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('minimum_wage_rates')
            .update({ hourly_wage: newWage, effective_from: effDate })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('minimum_wage_rates')
            .insert({ prefecture, year, hourly_wage: newWage, effective_from: effDate })
        }
      }

      if (prop.category === '社会保険' && value) {
        // social_insurance_rates を更新
        const prefecture  = String(value.prefecture ?? '東京')
        const effDate     = prop.effective_date ?? new Date().toISOString().slice(0, 10)
        const newRates: Record<string, number> = {}

        if (value.health_insurance_rate)     newRates.health_insurance_rate     = Number(value.health_insurance_rate)
        if (value.nursing_care_rate)         newRates.nursing_care_rate         = Number(value.nursing_care_rate)
        if (value.welfare_pension_rate)      newRates.welfare_pension_rate      = Number(value.welfare_pension_rate)
        if (value.employment_insurance_rate) newRates.employment_insurance_rate = Number(value.employment_insurance_rate)

        if (Object.keys(newRates).length > 0) {
          const { data: existing } = await supabase
            .from('social_insurance_rates')
            .select('id')
            .eq('prefecture', prefecture)
            .maybeSingle()

          if (existing) {
            await supabase
              .from('social_insurance_rates')
              .update({ ...newRates, effective_from: effDate })
              .eq('id', existing.id)
          } else {
            await supabase
              .from('social_insurance_rates')
              .insert({ prefecture, ...newRates, effective_from: effDate })
          }
        }
      }

      // プロポーザルを applied に
      await supabase
        .from('payroll_rate_proposals')
        .update({ review_status: 'applied', reviewed_at: now, applied_at: now })
        .eq('id', id)

      // compliance を対応済みに
      if (prop.compliance_id) {
        await supabase
          .from('payroll_compliance')
          .update({ is_applied: true, applied_at: now, review_status: 'acknowledged' })
          .eq('id', prop.compliance_id)
      }

      return NextResponse.json({ success: true })
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
