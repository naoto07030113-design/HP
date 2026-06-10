import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PayslipPrint from '@/features/payroll/components/PayslipPrint'
import type { PayrollCalculation, PayrollEmployee, PayrollAttendance } from '@/types/payroll'
import ViewTracker from './ViewTracker'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PayslipTokenPage({ params }: Props) {
  const { token } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // トークン検証
  const { data: tokenRow } = await supabase
    .from('payslip_tokens')
    .select('id, token, expires_at, viewed_at, calculation_id, payroll_employee_id')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
    notFound()
  }

  // 給与計算データ取得
  const { data: calc } = await supabase
    .from('payroll_calculations')
    .select(`
      *,
      employee:payroll_employees!payroll_employee_id(
        *,
        staff:staff_id( name, clinic:clinic_id( name ) )
      ),
      allowances:payroll_allowances(*)
    `)
    .eq('id', tokenRow.calculation_id)
    .single()

  if (!calc) notFound()

  // 勤怠データ取得
  const { data: attendance } = await supabase
    .from('payroll_attendance')
    .select('*')
    .eq('payroll_employee_id', tokenRow.payroll_employee_id)
    .eq('year', calc.year)
    .eq('month', calc.month)
    .maybeSingle()

  // employee は joined object or array — normalize
  type EmpJoined = PayrollEmployee & { staff?: { name: string; clinic?: { name: string } } }
  const rawEmp = calc.employee
  const emp: EmpJoined = Array.isArray(rawEmp) ? rawEmp[0] : rawEmp

  const calcForPrint = {
    ...calc,
    employee: emp,
    allowances: Array.isArray(calc.allowances) ? calc.allowances : [],
  } as PayrollCalculation & {
    employee: PayrollEmployee & { staff?: { name: string; clinic?: { name: string } } }
    allowances: { category: string; description: string; amount: number; is_deduction: boolean }[]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 閲覧ログ記録 */}
      <ViewTracker tokenId={tokenRow.id} alreadyViewed={!!tokenRow.viewed_at} />

      {/* ヘッダー */}
      <header className="bg-green-800 text-white px-4 py-4 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-green-300 text-xs">有限会社イトーメディカルケア</p>
            <h1 className="font-bold text-lg">給与明細書</h1>
          </div>
          <PrintButton />
        </div>
      </header>

      {/* 明細 */}
      <main className="max-w-3xl mx-auto px-4 py-6 print:px-0 print:py-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-x-auto print:shadow-none print:border-0 print:p-0">
          <PayslipPrint
            calc={calcForPrint}
            attendance={attendance as PayrollAttendance | undefined}
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 print:hidden">
          このページは {new Date(tokenRow.expires_at).toLocaleDateString('ja-JP')} まで有効です。<br />
          ご不明な点は担当部署までお問い合わせください。
        </p>
      </main>
    </div>
  )
}
