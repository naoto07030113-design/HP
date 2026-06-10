import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPayslipEmail } from '@/lib/payroll-email'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// POST /api/payroll/send-slips
// body: { year, month, employee_ids?: string[] }  → employee_ids are payroll_employee.id
export async function POST(req: NextRequest) {
  const { year, month, employee_ids } = await req.json() as {
    year: number; month: number; employee_ids?: string[]
  }

  if (!year || !month) {
    return NextResponse.json({ error: 'year and month are required' }, { status: 400 })
  }

  const supabase = getAdmin()
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const company  = '有限会社イトーメディカルケア'

  // 確定済み計算を取得
  let query = supabase
    .from('payroll_calculations')
    .select(`
      id,
      year,
      month,
      payroll_employee_id,
      employee:payroll_employees!payroll_employee_id(
        id,
        email,
        staff:staff_id( name )
      )
    `)
    .eq('year', year)
    .eq('month', month)
    .in('status', ['confirmed', 'paid'])

  if (employee_ids?.length) {
    query = query.in('payroll_employee_id', employee_ids)
  }

  const { data: calcs, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!calcs?.length) return NextResponse.json({ sent: 0, skipped: 0, errors: [] })

  const results = { sent: 0, skipped: 0, errors: [] as string[] }

  for (const calc of calcs) {
    type EmpJoin = { id: string; email: string | null; staff: { name: string } | { name: string }[] | null }
    const emp   = (Array.isArray(calc.employee) ? calc.employee[0] : calc.employee) as EmpJoin | null
    const email = emp?.email
    const staff = emp?.staff
    const name  = (Array.isArray(staff) ? staff[0]?.name : staff?.name) ?? '従業員'

    if (!email) {
      results.skipped++
      continue
    }

    // トークンをupsert（同月同従業員は1レコードのみ）
    const { data: existing } = await supabase
      .from('payslip_tokens')
      .select('id, token')
      .eq('calculation_id', calc.id)
      .maybeSingle()

    let token: string

    if (existing) {
      token = existing.token
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('payslip_tokens')
        .insert({
          calculation_id:      calc.id,
          payroll_employee_id: calc.payroll_employee_id,
          email,
        })
        .select('token')
        .single()
      if (insErr || !inserted) {
        results.errors.push(`${name}: トークン作成失敗`)
        continue
      }
      token = inserted.token
    }

    try {
      await sendPayslipEmail({ to: email, staffName: name, companyName: company, year, month, token, appUrl })

      await supabase
        .from('payslip_tokens')
        .update({ sent_at: new Date().toISOString(), email })
        .eq('calculation_id', calc.id)

      results.sent++
    } catch (e) {
      results.errors.push(`${name}: 送信失敗 (${(e as Error).message})`)
    }
  }

  return NextResponse.json(results)
}

// GET /api/payroll/send-slips?year=&month=
// 送付状況一覧（payroll_employee_id をキーにして返す）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year  = Number(searchParams.get('year'))
  const month = Number(searchParams.get('month'))

  if (!year || !month) return NextResponse.json([])

  const supabase = getAdmin()

  // payroll_calculationsでyear/monthを絞り込み、そのIDでtokensを取得
  const { data: calcIds } = await supabase
    .from('payroll_calculations')
    .select('id, payroll_employee_id')
    .eq('year', year)
    .eq('month', month)

  if (!calcIds?.length) return NextResponse.json([])

  const ids = calcIds.map(c => c.id)

  const { data, error } = await supabase
    .from('payslip_tokens')
    .select('id, token, email, sent_at, viewed_at, expires_at, payroll_employee_id, calculation_id')
    .in('calculation_id', ids)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // フロントが employee_id をキーにして検索できるよう employee_id も返す
  const result = (data ?? []).map(t => ({
    ...t,
    employee_id: t.payroll_employee_id,
  }))

  return NextResponse.json(result)
}
