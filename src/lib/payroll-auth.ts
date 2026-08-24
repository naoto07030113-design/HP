import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CLINIC_URL, CLINIC_ANON_KEY } from '@/lib/supabase'
import { parsePayrollRole, type PayrollRole } from '@/types/payroll-role'

export interface PayrollAuth {
  userId: string
  email: string | undefined
  payrollRole: PayrollRole | null
  clinicId: string | null
}

export async function getPayrollAuth(req: NextRequest): Promise<PayrollAuth | null> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const supabase = createClient(CLINIC_URL, CLINIC_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const meta = user.user_metadata ?? {}
  return {
    userId: user.id,
    email: user.email,
    payrollRole: parsePayrollRole(meta.payroll_role),
    clinicId: typeof meta.clinic_id === 'string' ? meta.clinic_id : null,
  }
}

// 指定ロールのみ許可。未ログイン=401、ロール不足=403。問題なければ null を返す。
export function requirePayrollRole(auth: PayrollAuth | null, allowed: PayrollRole[]): NextResponse | null {
  if (!auth) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  if (!auth.payrollRole || !allowed.includes(auth.payrollRole)) {
    return NextResponse.json({ error: 'この操作を行う権限がありません' }, { status: 403 })
  }
  return null
}

// 「院長は不可」なロール（総院長・給与担当・未設定=フルアクセス）を要求。
export function requireNonClinicDirector(auth: PayrollAuth | null): NextResponse | null {
  if (!auth) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  if (auth.payrollRole === 'clinic_director') {
    return NextResponse.json({ error: 'この操作を行う権限がありません' }, { status: 403 })
  }
  return null
}
