import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  let query = supabase
    .from('payroll_submissions')
    .select('*, items:payroll_submission_items(*)')
    .order('created_at', { ascending: false })

  if (year)  query = query.eq('year', parseInt(year))
  if (month) query = query.eq('month', parseInt(month))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const formData = await req.formData()

  const rawText = formData.get('raw_text') as string | null
  const year    = parseInt(formData.get('year') as string)
  const month   = parseInt(formData.get('month') as string)
  const dept    = formData.get('department') as string

  if (!rawText || !year || !month || !dept) {
    return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
  }

  // AI解析
  const prompt = `
以下は日本の鍼灸整骨院グループの給与申請書から抽出したテキストです。
部署: ${dept}
対象年月: ${year}年${month}月

テキスト:
${rawText.slice(0, 8000)}

上記から以下の構造で給与情報をJSON形式で抽出してください。
名前が読み取れない場合は除外してください。金額は数値（円）で記入してください。

{
  "year": ${year},
  "month": ${month},
  "department": "${dept}",
  "submitted_date": "YYYY-MM-DD or null",
  "employee_count": 数値,
  "employees": [
    {
      "line_number": 番号（整数）,
      "name": "氏名",
      "contract_type": "正社員 or パート or 業務委託",
      "items": [
        {
          "category": "基本 or 業績手当 or 残業手当 or 通勤手当 or 有給手当 or 特別手当 or その他手当",
          "description": "詳細説明（例：固定残業代39H、出来高達成など）",
          "amount": 金額（整数・円）
        }
      ],
      "total_amount": 支給合計額
    }
  ],
  "raw_notes": ["その他メモや不備事項"]
}
`

  let parsedData: unknown = null
  let parseError = null

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })
    parsedData = JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch (e) {
    parseError = String(e)
  }

  // 登録済み従業員との整合性チェック
  const { data: employees } = await supabase
    .from('payroll_employees')
    .select('id, staff:staff_id(name)')
    .eq('is_active', true)

  interface StaffRef { name: string }
  interface EmpRow { id: string; staff: StaffRef | StaffRef[] | null }

  const discrepancies: Array<{ name: string; issue: string }> = []

  if (parsedData && typeof parsedData === 'object' && 'employees' in parsedData) {
    const parsed = parsedData as { employees: Array<{ name: string; total_amount: number }> }
    for (const emp of parsed.employees ?? []) {
      const match = (employees as EmpRow[] | null)?.find((e) => {
        if (!e.staff) return false
        const staffName = Array.isArray(e.staff) ? e.staff[0]?.name : (e.staff as StaffRef).name
        return staffName?.includes(emp.name.replace(/\s/g, ''))
      })
      if (!match) {
        discrepancies.push({
          name: emp.name,
          issue: 'マスタに登録されていない従業員名です。氏名を確認してください。',
        })
      }
    }
  }

  // submissions テーブルへ保存
  const { data: submission, error: subErr } = await supabase
    .from('payroll_submissions')
    .insert({
      year,
      month,
      department: dept,
      raw_text: rawText.slice(0, 50000),
      status: parseError ? 'error' : (discrepancies.length > 0 ? 'parsed' : 'validated'),
      parsed_data: parsedData,
      discrepancies: discrepancies.length > 0 ? discrepancies : null,
      employee_count:
        parsedData && typeof parsedData === 'object' && 'employee_count' in parsedData
          ? (parsedData as { employee_count: number }).employee_count
          : null,
    })
    .select()
    .single()

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 })

  // submission_items へ個人明細を保存
  if (
    parsedData &&
    typeof parsedData === 'object' &&
    'employees' in parsedData
  ) {
    const parsed = parsedData as {
      employees: Array<{
        line_number: number
        name: string
        contract_type: string
        items: Array<{ category: string; description: string; amount: number }>
        total_amount: number
      }>
    }

    const items = (parsed.employees ?? []).map((emp) => {
      const match = (employees as EmpRow[] | null)?.find((e) => {
        if (!e.staff) return false
        const staffName = Array.isArray(e.staff) ? e.staff[0]?.name : (e.staff as StaffRef).name
        return staffName?.includes(emp.name.replace(/\s/g, ''))
      })
      return {
        submission_id: submission.id,
        line_number: emp.line_number,
        employee_name: emp.name,
        contract_type: emp.contract_type,
        items: emp.items,
        total_amount: emp.total_amount,
        is_validated: !!match,
        matched_employee_id: match?.id ?? null,
        discrepancy_notes: !match
          ? 'マスタに登録されていない従業員名です'
          : null,
      }
    })

    if (items.length > 0) {
      await supabase.from('payroll_submission_items').insert(items)
    }
  }

  return NextResponse.json({ submission, discrepancies, parse_error: parseError }, { status: 201 })
}
