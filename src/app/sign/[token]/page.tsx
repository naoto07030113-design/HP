import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SignForm from './SignForm'

export const dynamic = 'force-dynamic'

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: contract } = await supabase
    .from('employee_contracts')
    .select(`*, employee:payroll_employees!payroll_employee_id(staff:staff_id(name))`)
    .eq('sign_token', token)
    .maybeSingle()

  if (!contract) notFound()

  type EmpJoin = { staff: { name: string } | { name: string }[] | null }
  const emp = (Array.isArray(contract.employee) ? contract.employee[0] : contract.employee) as EmpJoin | null
  const staffArr = emp?.staff
  const staffName = (Array.isArray(staffArr) ? staffArr[0]?.name : staffArr?.name) ?? ''

  const isSigned    = contract.status === 'signed'
  const isCancelled = contract.status === 'cancelled'
  const isDraft     = contract.status === 'draft'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-green-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-[9px] tracking-tight">IMC</span>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 leading-tight">有限会社イトーメディカルケア</p>
            <p className="text-sm font-bold text-gray-900 leading-tight">{contract.title}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <p className="text-red-800 font-semibold">この契約書はキャンセルされました</p>
            <p className="text-red-700 text-sm mt-1">ご不明な点は担当部署にお問い合わせください。</p>
          </div>
        )}
        {isDraft && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
            <p className="text-gray-700 font-semibold">この契約書はまだ送付されていません</p>
            <p className="text-gray-500 text-sm mt-1">担当者が送付するまでしばらくお待ちください。</p>
          </div>
        )}
        {isSigned && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
            <p className="text-green-800 font-semibold">署名済みです</p>
            <p className="text-green-700 text-sm mt-1">
              {new Date(contract.signed_at!).toLocaleString('ja-JP')} に {contract.signer_name} 様が署名しました。
            </p>
          </div>
        )}

        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 overflow-x-auto">
              <div
                className="min-w-[560px] text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: contract.content }}
              />
            </div>
          </div>
        )}

        {!isSigned && !isCancelled && !isDraft && (
          <SignForm signToken={token} staffName={staffName} />
        )}

        <p className="text-center text-xs text-gray-400 pb-8">
          ご不明な点は担当部署にお問い合わせください。
        </p>
      </div>
    </div>
  )
}
