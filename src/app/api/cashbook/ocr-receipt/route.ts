import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

const EXPENSE_CATEGORIES = [
  'rent', 'utilities', 'payroll', 'supplies', 'medical_supplies',
  'advertising', 'communication', 'travel', 'repairs', 'fees', 'misc', 'other',
] as const

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
あなたは経理担当者です。このレシート（領収書）の画像を読み取り、以下のJSON形式のみで回答してください。

{
  "entry_date": "yyyy-MM-dd形式の支払日。和暦（令和など）は西暦に変換。年が読み取れない場合は本日（${today}）と同じ年を使う。日付自体が読み取れない場合は "${today}"",
  "vendor": "店舗名・支払先（読み取れない場合は空文字）",
  "description": "購入内容の要約（20字以内。例：事務用品、飲食代、ガソリン代）",
  "amount": 合計金額（税込・数値のみ。読み取れない場合は0）,
  "category": "${EXPENSE_CATEGORIES.join(' | ')} のいずれか。内容から最も適切な勘定科目を推定"
}

カテゴリの目安: rent=地代家賃, utilities=水道光熱費, payroll=人件費, supplies=消耗品費, medical_supplies=医療材料費, advertising=広告宣伝費, communication=通信費, travel=旅費交通費, repairs=修繕費, fees=支払手数料, misc=雑費, other=その他

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

    const category = EXPENSE_CATEGORIES.includes(result.category) ? result.category : 'misc'
    const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(result.entry_date ?? '') ? result.entry_date : today

    return NextResponse.json({
      entry_date: entryDate,
      vendor: typeof result.vendor === 'string' ? result.vendor : '',
      description: typeof result.description === 'string' ? result.description : '',
      amount: Number.isFinite(Number(result.amount)) ? Math.max(0, Math.round(Number(result.amount))) : 0,
      category,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'レシートの読み取りに失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
