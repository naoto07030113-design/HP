import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: portal } = await supabase
    .from('staff_portals')
    .select('*, employee:payroll_employees!payroll_employee_id(*, staff:staff_id(name, clinic:clinic_id(name)))')
    .eq('portal_token', token)
    .maybeSingle()

  if (!portal) notFound()

  await supabase.from('staff_portals').update({ last_accessed_at: new Date().toISOString() }).eq('portal_token', token)

  type EmpJoin = { id: string; staff: { name: string; clinic?: { name: string } } | null }
  const emp = (Array.isArray(portal.employee) ? portal.employee[0] : portal.employee) as EmpJoin | null
  const staffS = emp?.staff
  const staffName = (Array.isArray(staffS) ? staffS?.[0]?.name : staffS?.name) ?? ''
  const clinicName = (Array.isArray(staffS)
    ? (staffS?.[0] as { clinic?: { name: string } } | undefined)?.clinic?.name
    : (staffS as { clinic?: { name: string } } | null)?.clinic?.name) ?? ''

  const empId = emp?.id

  const { data: payslipTokens } = await supabase
    .from('payslip_tokens')
    .select('token, sent_at, viewed_at, payroll_calculations(year, month, net_pay, gross_pay, status)')
    .eq('payroll_employee_id', empId ?? '')
    .order('created_at', { ascending: false })
    .limit(24)

  const { data: contracts } = await supabase
    .from('employee_contracts')
    .select('id, title, status, sent_at, signed_at, sign_token, valid_from, valid_until')
    .eq('payroll_employee_id', empId ?? '')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  const unsignedContracts = (contracts ?? []).filter(c => c.status === 'sent')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <p className="text-green-300 text-xs">{clinicName || '有限会社イトーメディカルケア'}</p>
          <h1 className="font-bold text-xl mt-1">{staffName} さんのマイページ</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {unsignedContracts.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-4">
            <p className="font-semibold text-amber-900 text-sm">署名が必要な契約書があります</p>
            {unsignedContracts.map(c => (
              <Link
                key={c.id}
                href={`/sign/${c.sign_token}`}
                className="mt-2 flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-amber-200 hover:border-amber-400 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">{c.title}</span>
                <span className="text-xs text-amber-600 font-medium">署名する</span>
              </Link>
            ))}
          </div>
        )}

        <section>
          <h2 className="font-bold text-gray-800 text-base mb-3">給与明細</h2>
          {(payslipTokens ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">給与明細はまだありません</p>
          ) : (
            <div className="space-y-2">
              {(payslipTokens ?? []).map((pt) => {
                type CalcJoin = { year: number; month: number; net_pay: number; gross_pay: number; status: string }
                const calc = (Array.isArray(pt.payroll_calculations) ? pt.payroll_calculations[0] : pt.payroll_calculations) as CalcJoin | null
                if (!calc) return null
                return (
                  <Link
                    key={pt.token}
                    href={`/payslip/${pt.token}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-green-400 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{calc.year}年{calc.month}月分</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {pt.viewed_at ? `閲覧済 ${new Date(pt.viewed_at).toLocaleDateString('ja-JP')}` : '未閲覧'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-900 tabular-nums">¥{calc.net_pay.toLocaleString('ja-JP')}</p>
                      <p className="text-xs text-gray-400 tabular-nums">支給 ¥{calc.gross_pay.toLocaleString('ja-JP')}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-bold text-gray-800 text-base mb-3">契約書</h2>
          {(contracts ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">契約書はまだありません</p>
          ) : (
            <div className="space-y-2">
              {(contracts ?? []).map(c => (
                <Link
                  key={c.id}
                  href={`/sign/${c.sign_token}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-green-400 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.title}</p>
                    {c.valid_from && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.valid_from} 〜 {c.valid_until ?? ''}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    c.status === 'signed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.status === 'signed' ? '署名済' : '未署名'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-gray-400 pb-8">
          このページのURLは他人に共有しないでください。<br />
          ご不明な点は担当部署にお問い合わせください。
        </p>
      </div>
    </div>
  )
}
