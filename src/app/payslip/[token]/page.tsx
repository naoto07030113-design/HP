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

  const { data: tokenRow } = await supabase
    .from('payslip_tokens')
    .select('id, token, expires_at, viewed_at, calculation_id, payroll_employee_id')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) notFound()

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

  const { data: attendance } = await supabase
    .from('payroll_attendance')
    .select('*')
    .eq('payroll_employee_id', tokenRow.payroll_employee_id)
    .eq('year', calc.year)
    .eq('month', calc.month)
    .maybeSingle()

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

  const staffName   = emp?.staff?.name ?? ''
  const clinicName  = emp?.staff?.clinic?.name ?? ''
  const periodLabel = `${calc.year}年${calc.month}月分`
  const netPay      = calc.net_pay
  const grossPay    = calc.gross_pay
  const totalDed    = calc.total_deductions
  const expiresStr  = new Date(tokenRow.expires_at).toLocaleDateString('ja-JP')

  return (
    <div className="min-h-screen bg-gray-100">
      <ViewTracker tokenId={tokenRow.id} alreadyViewed={!!tokenRow.viewed_at} />

      {/* ===== モバイルヘッダー ===== */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 print:hidden sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <p className="text-xs text-gray-400">有限会社イトーメディカルケア</p>
            <p className="text-sm font-bold text-gray-900">給与明細書</p>
          </div>
          <PrintButton />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 print:hidden">

        {/* ===== 差引支給額カード（最重要情報を大きく） ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-green-800 px-5 pt-5 pb-4">
            <p className="text-green-300 text-xs font-medium">{periodLabel}</p>
            <p className="text-white text-lg font-bold mt-0.5">{staffName} 様</p>
            {clinicName && <p className="text-green-300 text-xs mt-0.5">{clinicName}</p>}
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-gray-400 mb-1">差引支給額（お手取り）</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              ¥{netPay.toLocaleString('ja-JP')}
            </p>
          </div>
        </div>

        {/* ===== 支給・控除サマリー ===== */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">支給合計</p>
            <p className="text-lg font-semibold text-gray-900 tabular-nums">
              ¥{grossPay.toLocaleString('ja-JP')}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">控除合計</p>
            <p className="text-lg font-semibold text-red-600 tabular-nums">
              -¥{totalDed.toLocaleString('ja-JP')}
            </p>
          </div>
        </div>

        {/* ===== 明細（横スクロール対応） ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 px-4 pt-4 pb-2 uppercase tracking-wider">
            詳細明細
          </p>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[640px] px-4">
              <PayslipPrint
                calc={calcForPrint}
                attendance={attendance as PayrollAttendance | undefined}
              />
            </div>
          </div>
        </div>

        {/* ===== フッター ===== */}
        <p className="text-center text-xs text-gray-400 pb-8">
          このページは {expiresStr} まで有効です。
          ご不明な点は担当部署にお問い合わせください。
        </p>
      </div>

      {/* ===== 印刷用（スクリーン非表示） ===== */}
      <div className="hidden print:block">
        <PayslipPrint
          calc={calcForPrint}
          attendance={attendance as PayrollAttendance | undefined}
        />
      </div>

      {/* ===== 印刷ボタン（スマホ用 固定フッター） ===== */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 print:hidden sm:hidden">
        <PrintButton fullWidth />
      </div>
    </div>
  )
}
