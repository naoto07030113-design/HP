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
あなたは誠実なWebコンサルタントです。
以下の事業者に向けて、丁寧で短い営業メールを日本語で作成してください。

事業者名: ${body.business_name}
業種: ${body.industry ?? ''}
住所: ${body.address ?? ''}

条件:
- 押し売りは絶対にしない
- 相手の強みや地域での存在を褒める
- 本文は200字以内で簡潔に
- サンプルHPを無料で作成したことを伝える
- 具体的な価値を伝える

以下のJSON形式で出力してください:
{
  "subject": "件名（30字以内）",
  "body": "本文（敬語、200字以内）"
}

JSONのみ返してください。`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')

    const { data, error } = await supabase
      .from('outreach_messages')
      .insert({
        business_id: body.business_id,
        channel: 'email',
        subject: result.subject ?? '',
        body: result.body ?? '',
        status: 'draft',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '営業文生成に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
