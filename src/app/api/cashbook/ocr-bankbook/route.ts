import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません。.env.local に OPENAI_API_KEY を設定してください。' }, { status: 503 })
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const body = await req.json()
  const image: string | undefined = body.image
  if (!image || !image.startsWith('data:image/')) {
    return NextResponse.json({ error: '画像データが不正です' }, { status: 400 })
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  const prompt = `
あなたは経理担当者です。この通帳（銀行口座の取引明細）の画像を読み取り、取引行をすべて抽出して以下のJSON形式のみで回答してください。

{
  "entries": [
    {
      "entry_date": "yyyy-MM-dd形式の取引日。和暦（令和6年=2024年など）は西暦に変換。年が読み取れない場合は本日（${today})に近い年を推定",
      "entry_type": "income または expense。お預入れ・振込入金など残高が増える取引は income、お引出し・振込・引落しなど残高が減る取引は expense",
      "description": "摘要欄の内容（振込元・振込先・取引種別など）",
      "amount": 金額（数値のみ・正の値）
    }
  ]
}

注意:
- 繰越行・残高のみの行・読み取れない行は含めない
- 1行に出金と入金の両方の列がある場合、金額が記載されている側で判定する
- 残高列の数値を金額として使わない

JSONのみ返してください。`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image, detail: 'high' } },
          ],
        },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    const rawEntries: unknown[] = Array.isArray(result.entries) ? result.entries : []

    const entries = rawEntries
      .map((row) => {
        const r = row as Record<string, unknown>
        const amount = Number.isFinite(Number(r.amount)) ? Math.max(0, Math.round(Number(r.amount))) : 0
        return {
          entry_date: /^\d{4}-\d{2}-\d{2}$/.test(String(r.entry_date ?? '')) ? String(r.entry_date) : today,
          entry_type: r.entry_type === 'income' ? 'income' as const : 'expense' as const,
          description: typeof r.description === 'string' ? r.description : '',
          amount,
        }
      })
      .filter((e) => e.amount > 0)

    return NextResponse.json({ entries })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '通帳の読み取りに失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
