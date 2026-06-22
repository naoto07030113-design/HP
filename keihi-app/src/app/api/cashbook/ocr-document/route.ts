import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { format } from 'date-fns'
import type { BankbookOcrRow, CardStatementOcrRow, DocumentOcrResult } from '@/types/cashbook'

export const dynamic = 'force-dynamic'

const EXPENSE_CATEGORIES = [
  'rent', 'utilities', 'payroll', 'supplies', 'medical_supplies',
  'advertising', 'communication', 'travel', 'repairs', 'fees', 'misc', 'other',
] as const

const DOCUMENT_TYPES = ['invoice', 'quote', 'other'] as const

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function asAmount(v: unknown): number {
  return Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0
}

// カード下4桁の正規化（数字4桁のみ採用）
function asLast4(v: unknown): string {
  const s = String(v ?? '').replace(/\D/g, '')
  return s.length >= 4 ? s.slice(-4) : ''
}

type RawCat = string
function asCategory(v: RawCat): (typeof EXPENSE_CATEGORIES)[number] {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(v) ? (v as (typeof EXPENSE_CATEGORIES)[number]) : 'misc'
}

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
あなたは経理担当者です。この画像の書類種別を判定し、内容を読み取って以下のJSON形式のみで回答してください。

書類種別（kind）の判定基準:
- "receipt": レシート・領収書など、支払いが完了した1件の証憑
- "card_statement": クレジットカードの利用明細（ご利用代金明細書）。複数の利用行が日付・店名・金額で並ぶ
- "bankbook": 通帳・銀行口座の取引明細（複数の入出金行がある）
- "payment_due": 請求書・見積書・納品書など、これから支払う書類（振込期日・支払期限の記載があるもの。期日が無くても請求書なら payment_due）
- "unknown": 上記のいずれにも該当しない、または判読不能

JSON形式:
{
  "kind": "receipt | card_statement | bankbook | payment_due | unknown",

  // kind が receipt の場合のみ
  "receipt": {
    "entry_date": "yyyy-MM-dd形式の支払日。和暦は西暦に変換。年が読み取れない場合は本日（${today}）と同じ年。日付自体が読み取れない場合は "${today}"",
    "vendor": "店舗名・支払先（読み取れない場合は空文字）",
    "description": "購入内容の要約（20字以内。例：事務用品、飲食代）",
    "amount": 合計金額（税込・数値のみ）,
    "category": "${EXPENSE_CATEGORIES.join(' | ')} のいずれか。最も適切な勘定科目を推定",
    "card_last4": "クレジットカード払いでカード番号の下4桁が読み取れた場合のみ4桁の数字。現金や読めない場合は空文字"
  },

  // kind が card_statement の場合のみ（利用明細の各行）
  "statement": [
    {
      "entry_date": "yyyy-MM-dd形式の利用日。和暦は西暦に変換",
      "description": "利用店名・摘要",
      "amount": 利用金額（数値のみ・正の値。合計行や手数料行以外の各利用）,
      "card_last4": "その行のカード番号下4桁（明細上部に記載のカード番号など）。読めなければ空文字",
      "category": "${EXPENSE_CATEGORIES.join(' | ')} のいずれか"
    }
  ],

  // kind が bankbook の場合のみ
  "entries": [
    {
      "entry_date": "yyyy-MM-dd形式の取引日。和暦（令和6年=2024年など）は西暦に変換",
      "entry_type": "income（お預入れ・振込入金など残高が増える取引）または expense（お引出し・振込・引落しなど残高が減る取引）",
      "description": "摘要欄の内容",
      "amount": 金額（数値のみ・正の値。残高列の数値は使わない）
    }
  ],

  // kind が payment_due の場合のみ
  "payment": {
    "document_type": "invoice（請求書）| quote（見積書）| other（その他）",
    "vendor": "請求元・発行元の名称",
    "description": "請求内容の要約（30字以内）",
    "amount": 請求金額・合計金額（税込・数値のみ）,
    "due_date": "yyyy-MM-dd形式の振込期日・支払期限。和暦は西暦に変換。読み取れない場合は空文字"
  }
}

勘定科目の目安: rent=地代家賃, utilities=水道光熱費, payroll=人件費, supplies=消耗品費, medical_supplies=医療材料費, advertising=広告宣伝費, communication=通信費, travel=旅費交通費, repairs=修繕費, fees=支払手数料, misc=雑費, other=その他
通帳の注意: 繰越行・残高のみの行は entries に含めない
カード明細の注意: 合計請求額やお支払い金額の行は statement に含めず、個々の利用のみ。カード番号下4桁が明細全体で1つなら各行に同じ値を入れる

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

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}')
    const result: DocumentOcrResult = { kind: 'unknown' }

    if (raw.kind === 'receipt' && raw.receipt) {
      const r = raw.receipt
      result.kind = 'receipt'
      result.receipt = {
        entry_date: DATE_RE.test(asString(r.entry_date)) ? r.entry_date : today,
        vendor: asString(r.vendor),
        description: asString(r.description),
        amount: asAmount(r.amount),
        category: asCategory(r.category),
        card_last4: asLast4(r.card_last4),
      }
    } else if (raw.kind === 'card_statement' && Array.isArray(raw.statement)) {
      const rows: CardStatementOcrRow[] = (raw.statement as unknown[])
        .map((row) => {
          const r = row as Record<string, unknown>
          return {
            entry_date: DATE_RE.test(asString(r.entry_date)) ? asString(r.entry_date) : today,
            description: asString(r.description),
            amount: asAmount(r.amount),
            card_last4: asLast4(r.card_last4),
            category: asCategory(asString(r.category)),
          }
        })
        .filter((e) => e.amount > 0)
      if (rows.length > 0) {
        result.kind = 'card_statement'
        result.statement = rows
      }
    } else if (raw.kind === 'bankbook' && Array.isArray(raw.entries)) {
      const entries: BankbookOcrRow[] = (raw.entries as unknown[])
        .map((row) => {
          const r = row as Record<string, unknown>
          return {
            entry_date: DATE_RE.test(asString(r.entry_date)) ? asString(r.entry_date) : today,
            entry_type: r.entry_type === 'income' ? 'income' as const : 'expense' as const,
            description: asString(r.description),
            amount: asAmount(r.amount),
          }
        })
        .filter((e) => e.amount > 0)
      if (entries.length > 0) {
        result.kind = 'bankbook'
        result.entries = entries
      }
    } else if (raw.kind === 'payment_due' && raw.payment) {
      const p = raw.payment
      result.kind = 'payment_due'
      result.payment = {
        document_type: DOCUMENT_TYPES.includes(p.document_type) ? p.document_type : 'invoice',
        vendor: asString(p.vendor),
        description: asString(p.description),
        amount: asAmount(p.amount),
        due_date: DATE_RE.test(asString(p.due_date)) ? p.due_date : '',
      }
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '書類の読み取りに失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
