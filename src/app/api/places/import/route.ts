import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { PlaceResult } from '../search/route'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient()

    let body: { places: PlaceResult[]; industry: string; source_name?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'リクエストの解析に失敗しました' }, { status: 400 })
    }

    const { places, industry, source_name = 'Google Places API' } = body

    if (!places || places.length === 0) {
      return NextResponse.json({ error: 'インポートする店舗が選択されていません' }, { status: 400 })
    }

    const imported: string[] = []
    const skipped: string[] = []
    const errors: string[] = []

    for (const place of places) {
      try {
        // Upsert business (skip if same name + address already exists)
        const { data: existing } = await supabase
          .from('businesses')
          .select('id')
          .eq('name', place.name)
          .eq('address', place.formatted_address)
          .maybeSingle()

        if (existing) {
          skipped.push(place.name)
          continue
        }

        const { data: business, error: bizErr } = await supabase
          .from('businesses')
          .insert({
            name: place.name,
            industry: industry || null,
            address: place.formatted_address,
            phone: place.phone,
            email: null,
            website_url: place.website || null,
            google_map_url: place.google_map_url,
            source_name,
            status: 'new',
          })
          .select('id')
          .single()

        if (bizErr || !business) {
          errors.push(`${place.name}: ${bizErr?.message ?? '不明なエラー'}`)
          continue
        }

        // Save web presence score
        const { error: scoreErr } = await supabase
          .from('web_presence_scores')
          .insert({
            business_id: business.id,
            has_official_website: place.has_website,
            website_reachable: place.has_website,
            website_quality_score: place.website_quality_score,
            sns_presence_score: place.sns_presence_score,
            review_volume_score: place.review_volume_score,
            competitor_gap_score: place.competitor_gap_score,
            no_hp_probability: place.no_hp_probability,
            web_presence_score: place.web_presence_score,
            confidence_score: place.confidence_score,
            reasoning: place.reasoning,
          })

        if (scoreErr) {
          errors.push(`${place.name} (スコア保存失敗): ${scoreErr.message}`)
        }

        // Save prediction
        const contract_probability = parseFloat((place.no_hp_probability * 0.6 + 0.15).toFixed(3))
        const priority_score = place.priority_score

        const { error: predErr } = await supabase.from('predictions').insert({
          business_id: business.id,
          contract_probability,
          expected_revenue_uplift: 500000,
          priority_score,
          confidence_score: place.confidence_score,
          reasoning: place.reasoning,
        })
        if (predErr) {
          errors.push(`${place.name} (予測保存失敗): ${predErr.message}`)
        }

        // Log import event
        const { error: eventErr } = await supabase.from('outreach_events').insert({
          business_id: business.id,
          event_type: 'imported',
          event_note: `Google Places APIから取得。評価${place.rating}点・口コミ${place.user_ratings_total}件`,
        })
        if (eventErr) {
          errors.push(`${place.name} (イベント保存失敗): ${eventErr.message}`)
        }

        imported.push(place.name)
      } catch (e: unknown) {
        errors.push(`${place.name}: ${e instanceof Error ? e.message : '不明なエラー'}`)
      }
    }

    return NextResponse.json({
      imported_count: imported.length,
      skipped_count: skipped.length,
      error_count: errors.length,
      imported,
      skipped,
      errors,
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
