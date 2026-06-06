import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません。.env.local に OPENAI_API_KEY を設定してください。' }, { status: 503 })
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const supabase = createServiceClient()
  const body = await req.json()

  const prompt = `
あなたはWeb集客の専門家です。以下の事業者情報を分析し、JSON形式で回答してください。

事業者名: ${body.business_name}
業種: ${body.industry ?? '不明'}
住所: ${body.address ?? '不明'}
HP URL: ${body.website_url ?? 'なし'}
GoogleMap URL: ${body.google_map_url ?? 'なし'}
口コミ情報: ${body.review_text || 'なし'}
競合情報: ${body.competitor_info || 'なし'}

以下のJSON形式で回答してください（数値は0.0〜1.0の範囲）:
{
  "has_official_website": boolean,
  "website_reachable": boolean,
  "website_quality_score": 0.0-1.0,
  "sns_presence_score": 0.0-1.0,
  "review_volume_score": 0.0-1.0,
  "competitor_gap_score": 0.0-1.0,
  "no_hp_probability": 0.0-1.0,
  "web_presence_score": 0.0-1.0,
  "confidence_score": 0.0-1.0,
  "reasoning": "詳細な分析根拠（200字以内）"
}

website_quality_score: HP URLがある場合はそのサイトの品質、ない場合は0
sns_presence_score: SNS活用度の推測値
review_volume_score: 口コミ情報の豊富さ
competitor_gap_score: 競合との差分（高いほど改善余地大）
no_hp_probability: HP未保有または品質不足の確率
web_presence_score: = website_quality_score*0.35 + sns_presence_score*0.15 + review_volume_score*0.15 + competitor_gap_score*0.25 + confidence_score*0.10

JSONのみ返してください。`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')

    const { data, error } = await supabase
      .from('web_presence_scores')
      .insert({
        business_id: body.business_id,
        has_official_website: result.has_official_website ?? false,
        website_reachable: result.website_reachable ?? false,
        website_quality_score: result.website_quality_score ?? 0,
        sns_presence_score: result.sns_presence_score ?? 0,
        review_volume_score: result.review_volume_score ?? 0,
        competitor_gap_score: result.competitor_gap_score ?? 0,
        no_hp_probability: result.no_hp_probability ?? 0,
        web_presence_score: result.web_presence_score ?? 0,
        confidence_score: result.confidence_score ?? 0,
        reasoning: result.reasoning ?? '',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '分析に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
