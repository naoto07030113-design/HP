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

  const isSigned = contract.status === 'signed'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-gray-400">有限会社イトーメディカルケア</p>
          <p className="text-sm font-bold text-gray-900">{contract.title}</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {isSigned && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
            <p className="text-green-800 font-semibold">署名済みです</p>
            <p className="text-green-700 text-sm mt-1">
              {new Date(contract.signed_at!).toLocaleString('ja-JP')} に {contract.signer_name} 様が署名しました。
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 overflow-x-auto">
            <div
              className="min-w-[560px] text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contract.content }}
            />
          </div>
        </div>

        {!isSigned && (
          <SignForm signToken={token} staffName={staffName} />
        )}

        <p className="text-center text-xs text-gray-400 pb-8">
          ご不明な点は担当部署にお問い合わせください。
        </p>
      </div>
    </div>
  )
}
