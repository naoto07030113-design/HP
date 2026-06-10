import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { tokenId } = await req.json() as { tokenId: string }
  if (!tokenId) return NextResponse.json({ ok: false })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  await supabase
    .from('payslip_tokens')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', tokenId)
    .is('viewed_at', null)

  return NextResponse.json({ ok: true })
}
