import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Vercel Cron & 手動トリガー共用
// POST /api/payroll/law-check
export async function POST(req: NextRequest) {
  // Cron認証
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isManual   = req.headers.get('x-manual-trigger') === '1'

  if (!isManual && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const today    = new Date()
  const yyyymm   = `${today.getFullYear()}年${today.getMonth() + 1}月`

  // スキャン実行レコードを作成
  const { data: scanRun, error: scanErr } = await supabase
    .from('payroll_law_scans')
    .insert({ status: 'running', model: 'gpt-4o' })
    .select('id')
    .single()

  if (scanErr || !scanRun) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  try {
    // OpenAI Responses API (web_search_preview 使用)
    const prompt = `あなたは日本の給与・労務・税務の専門家です。
${yyyymm}時点で、給与計算・社会保険・税務に関して**最近3ヶ月以内に公表・施行・または施行予定**の法改正・制度変更を調査してください。

以下のカテゴリを網羅的にチェックしてください：
1. 社会保険料率（健康保険・介護保険・厚生年金・雇用保険）
2. 標準報酬月額等級表の改定
3. 源泉徴収税額表（甲乙丙欄）の改定
4. 最低賃金（都道府県別）
5. 時間外労働・割増賃金規制（労働基準法）
6. 育児休業・産前産後・介護休業制度
7. 新設税・特別課税（例：独身税・子育て支援金・デジタル税等）
8. 電子帳簿保存法・インボイス関連

必ず以下の公式サイトを参照すること：
- 厚生労働省 https://www.mhlw.go.jp/
- 国税庁 https://www.nta.go.jp/
- 都道府県労働局（最低賃金）

下記JSON配列**のみ**を返答してください（コードブロックや説明文は不要）：

[
  {
    "category": "社会保険|最低賃金|税制|労働法|育休|その他",
    "law_name": "法令・制度名（簡潔に）",
    "effective_date": "YYYY-MM-DD",
    "summary": "概要（80文字以内）",
    "detail": "詳細（250文字以内）",
    "impact_level": "critical|high|medium|low",
    "action_required": "給与担当者が行うべき具体的対応（100文字以内）",
    "source_url": "公式URL",
    "change_type": "rate_update|new_item|manual_required",
    "proposed_value": null
  }
]

impact_level の基準：
- critical: 即時対応必須（未対応で罰則・過少申告リスク）
- high: 今月中に対応すべき
- medium: 次の改定サイクルまでに対応
- low: 情報把握のみでよい

change_type の基準：
- rate_update: 数値（料率・金額）の変更のみ
- new_item: 新設税・新制度（コード変更が必要）
- manual_required: 運用・手続きの変更（給与計算への直接影響なし）

proposed_value は rate_update の場合のみ以下の形式でセット（それ以外はnull）：
{"field_hint": "変更フィールドの説明", "current": "現在値の説明", "new": "新しい値の説明", "unit": "円|%|等級"}

情報がない・変更なし・審議中のみの場合は空配列 [] を返してください。`

    const openaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        tool_choice: 'required',
        input: prompt,
      }),
    })

    let rawText = ''
    if (openaiRes.ok) {
      const openaiData = await openaiRes.json() as { output_text?: string }
      rawText = openaiData.output_text ?? ''
    } else {
      // fallback: chat completions (web検索なし)
      const fallbackRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: '日本の給与・社会保険・税務の専門家として回答してください。必ず{"items":[...]}の形式のJSONのみを返してください。' },
            { role: 'user', content: prompt.replace('下記JSON配列**のみ**を返答してください', '{"items": [...]} 形式で返してください。items に上記の配列をセットしてください') },
          ],
        }),
      })
      if (fallbackRes.ok) {
        const fb = await fallbackRes.json() as { choices: { message: { content: string } }[] }
        const content = fb.choices[0]?.message?.content ?? '{}'
        try {
          const parsed = JSON.parse(content) as { items?: unknown[] }
          rawText = JSON.stringify(parsed.items ?? [])
        } catch {
          rawText = '[]'
        }
      }
    }

    // JSON パース
    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    const proposals: Array<{
      category: string
      law_name: string
      effective_date: string
      summary: string
      detail: string
      impact_level: string
      action_required: string
      source_url: string
      change_type: string
      proposed_value: unknown
    }> = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    let foundCount = 0
    let newCount   = 0

    for (const p of proposals) {
      foundCount++

      // 重複チェック（同名 + 同施行日）
      const { data: existing } = await supabase
        .from('payroll_compliance')
        .select('id')
        .eq('law_name', p.law_name)
        .eq('effective_date', p.effective_date)
        .maybeSingle()

      if (existing) continue
      newCount++

      // compliance に追加
      const { data: inserted } = await supabase
        .from('payroll_compliance')
        .insert({
          category:        p.category,
          law_name:        p.law_name,
          effective_date:  p.effective_date,
          summary:         p.summary,
          detail:          p.detail,
          impact_level:    p.impact_level,
          action_required: p.action_required,
          source_url:      p.source_url,
          ai_detected:     true,
          review_status:   'pending',
          scan_run_id:     scanRun.id,
        })
        .select('id')
        .single()

      // rate_update の場合はプロポーザルも作成
      if (p.change_type === 'rate_update' && p.proposed_value && inserted) {
        await supabase
          .from('payroll_rate_proposals')
          .insert({
            compliance_id:  inserted.id,
            scan_run_id:    scanRun.id,
            title:          p.law_name,
            category:       p.category,
            change_type:    p.change_type,
            description:    p.detail ?? p.summary,
            source_url:     p.source_url,
            effective_date: p.effective_date,
            proposed_value: p.proposed_value,
          })
      }
    }

    await supabase
      .from('payroll_law_scans')
      .update({ status: 'completed', found_count: foundCount, new_count: newCount, raw_response: rawText.slice(0, 8000) })
      .eq('id', scanRun.id)

    return NextResponse.json({ success: true, found: foundCount, new: newCount })
  } catch (e) {
    await supabase
      .from('payroll_law_scans')
      .update({ status: 'error', error_message: (e as Error).message })
      .eq('id', scanRun.id)

    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// GET /api/payroll/law-check  → スキャン履歴
export async function GET() {
  const supabase = getAdmin()
  const { data, error } = await supabase
    .from('payroll_law_scans')
    .select('*')
    .order('scanned_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
