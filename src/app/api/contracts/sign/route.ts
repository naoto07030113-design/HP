import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { sign_token, signer_name } = await req.json() as { sign_token: string; signer_name: string }

  if (!sign_token || !signer_name?.trim()) {
    return NextResponse.json({ error: 'sign_token and signer_name are required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: contract } = await supabase
    .from('employee_contracts')
    .select('id, status')
    .eq('sign_token', sign_token)
    .maybeSingle()

  if (!contract) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (contract.status === 'signed') return NextResponse.json({ error: 'Already signed' }, { status: 409 })

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

  const { error } = await supabase
    .from('employee_contracts')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signer_name: signer_name.trim(),
      signer_ip: ip,
    })
    .eq('id', contract.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
