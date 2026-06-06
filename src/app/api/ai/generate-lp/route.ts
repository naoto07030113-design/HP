import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const supabase = createServiceClient()
  const body = await req.json()

  const prompt = `
あなたはLP（ランディングページ）制作の専門家です。
以下の事業者情報をもとに、効果的なLPの構成案をJSONで生成してください。

事業者名: ${body.business_name}
業種: ${body.industry ?? ''}
住所: ${body.address ?? ''}

以下のJSON形式で出力してください:
{
  "title": "LPのタイトル（20字以内）",
  "target_persona": "ターゲットペルソナ（50字以内）",
  "main_copy": "メインキャッチコピー（30字以内）",
  "sections": [
    {
      "type": "hero",
      "title": "ファーストビューの見出し",
      "content": "サブキャッチコピー"
    },
    {
      "type": "reasons",
      "title": "選ばれる理由",
      "content": ["理由1", "理由2", "理由3"]
    },
    {
      "type": "services",
      "title": "サービス紹介",
      "content": ["サービス1", "サービス2", "サービス3"]
    },
    {
      "type": "strengths",
      "title": "私たちの強み",
      "content": ["強み1", "強み2"]
    },
    {
      "type": "faq",
      "title": "よくある質問",
      "content": ["Q: 質問1 A: 回答1", "Q: 質問2 A: 回答2"]
    },
    {
      "type": "cta",
      "title": "お問い合わせ",
      "content": "CTAの文章"
    }
  ]
}

JSONのみ返してください。`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')

    const { data, error } = await supabase
      .from('lp_variants')
      .insert({
        business_id: body.business_id,
        title: result.title ?? '',
        target_persona: result.target_persona ?? '',
        main_copy: result.main_copy ?? '',
        page_structure: result.sections ?? [],
        status: 'draft',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'LP生成に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
