import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getAdmin()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data: contract, error } = await supabase
    .from('employee_contracts')
    .select(`*, employee:payroll_employees!payroll_employee_id(id, email, staff:staff_id(name))`)
    .eq('id', id)
    .single()

  if (error || !contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  type EmpJoin = { id: string; email: string | null; staff: { name: string } | { name: string }[] | null }
  const emp = (Array.isArray(contract.employee) ? contract.employee[0] : contract.employee) as EmpJoin | null
  const email = emp?.email
  const staffArr = emp?.staff
  const staffName = (Array.isArray(staffArr) ? staffArr[0]?.name : staffArr?.name) ?? '従業員'

  if (!email) return NextResponse.json({ error: 'メールアドレスが未登録です' }, { status: 400 })

  const { data: portal } = await supabase
    .from('staff_portals')
    .upsert({ payroll_employee_id: emp!.id, email }, { onConflict: 'payroll_employee_id' })
    .select('portal_token')
    .single()

  const portalUrl = `${appUrl}/mypage/${portal?.portal_token}`
  const signUrl   = `${appUrl}/sign/${contract.sign_token}`

  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST ?? 'smtp.gmail.com',
      port:   Number(process.env.EMAIL_PORT ?? '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER ?? '', pass: process.env.EMAIL_PASS ?? '' },
    })

    const from = process.env.EMAIL_FROM ?? process.env.EMAIL_USER ?? 'noreply@example.com'
    await transporter.sendMail({
      from, to: email,
      subject: `【要確認・電子署名】${contract.title} - 有限会社イトーメディカルケア`,
      html: `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,sans-serif;color:#1a1a1a;background:#f0faf4;margin:0;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#166534;padding:24px 28px;">
    <p style="color:#bbf7d0;font-size:12px;margin:0 0 4px;">有限会社イトーメディカルケア</p>
    <h1 style="color:white;font-size:18px;margin:0;font-weight:700;">${contract.title}</h1>
  </div>
  <div style="padding:28px;">
    <p style="margin:0 0 16px;">${staffName} 様</p>
    <p style="margin:0 0 16px;line-height:1.7;color:#374151;">
      雇用契約書をお送りします。内容をご確認の上、電子署名をお願いします。
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${signUrl}" style="display:inline-block;background:#166534;color:white;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
        契約書を確認・署名する
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
    <p style="margin:0 0 8px;font-size:13px;color:#374151;">マイページ（給与明細・契約書一覧）</p>
    <a href="${portalUrl}" style="color:#166534;font-size:13px;">${portalUrl}</a>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
    <p style="font-size:11px;color:#9ca3af;margin:0;">有限会社イトーメディカルケア / 人事労務担当</p>
  </div>
</div>
</body></html>`,
    })
  } catch (e) {
    return NextResponse.json({ error: `メール送信失敗: ${(e as Error).message}` }, { status: 500 })
  }

  await supabase
    .from('employee_contracts')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true, portalUrl, signUrl })
}
