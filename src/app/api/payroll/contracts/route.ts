import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const supabase = getAdmin()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const employeeId = searchParams.get('employee_id')

  let query = supabase
    .from('employee_contracts')
    .select(`
      *,
      employee:payroll_employees!payroll_employee_id(
        id, employee_number,
        staff:staff_id( name, clinic:clinic_id( name ) )
      ),
      template:contract_templates( title, department, contract_type )
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (employeeId) query = query.eq('payroll_employee_id', employeeId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = getAdmin()
  const body = await req.json() as {
    payroll_employee_id: string
    template_id: string
    variables: Record<string, string>
    valid_from?: string
    valid_until?: string
  }

  // テンプレートを取得
  const { data: tmpl, error: tmplErr } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', body.template_id)
    .single()
  if (tmplErr || !tmpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  // 変数を埋め込む
  let content = tmpl.content as string
  for (const [key, value] of Object.entries(body.variables)) {
    content = content.replaceAll(`{{${key}}}`, value)
  }

  const { data, error } = await supabase
    .from('employee_contracts')
    .insert({
      payroll_employee_id: body.payroll_employee_id,
      template_id: body.template_id,
      title: tmpl.title,
      content,
      variables_used: body.variables,
      valid_from: body.valid_from || null,
      valid_until: body.valid_until || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
