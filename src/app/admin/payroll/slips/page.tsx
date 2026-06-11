'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, CheckCircle2, DollarSign, FileText,
  Printer, Mail, Eye, Clock, AlertCircle,
} from 'lucide-react'
import type { PayrollCalculation } from '@/types/payroll'
import { formatCurrency } from '@/lib/payroll-calculator'
import { toast } from 'sonner'

type CalcWithEmployee = PayrollCalculation & {
  employee: {
    id: string
    staff: { name: string; clinic: { name: string } }
    contract_type: string
    email?: string | null
  }
}

interface TokenStatus {
  employee_id: string
  sent_at: string | null
  viewed_at: string | null
}

export default function PayrollSlipsPage() {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth() + 1)
  const [calcs, setCalcs]   = useState<CalcWithEmployee[]>([])
  const [tokens, setTokens] = useState<TokenStatus[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<CalcWithEmployee | null>(null)
  const [updating, setUpdating] = useState(false)
  const [sending, setSending]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [slipRes, tokenRes] = await Promise.all([
        fetch(`/api/payroll/slips?year=${year}&month=${month}`),
        fetch(`/api/payroll/send-slips?year=${year}&month=${month}`),
      ])
      const slipData  = await slipRes.json()
      const tokenData = await tokenRes.json()
      setCalcs(Array.isArray(slipData) ? slipData : [])
      setTokens(Array.isArray(tokenData) ? tokenData : [])
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  async function bulkUpdateStatus(ids: string[], status: string) {
    setUpdating(true)
    try {
      const res = await fetch('/api/payroll/slips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`ステータスを${status === 'confirmed' ? '確定' : '振込済'}に変更しました`)
      load()
    } catch {
      toast.error('更新失敗')
    } finally {
      setUpdating(false)
    }
  }

  async function sendSlips(employeeIds?: string[]) {
    setSending(true)
    try {
      const res = await fetch('/api/payroll/send-slips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, employee_ids: employeeIds }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? '送信失敗')

      const msgs: string[] = []
      if (result.sent > 0)    msgs.push(`${result.sent}件 送信成功`)
      if (result.skipped > 0) msgs.push(`${result.skipped}件 メール未登録でスキップ`)
      if (result.errors?.length) msgs.push(`${result.errors.length}件 失敗`)

      if (result.errors?.length) {
        toast.warning(msgs.join(' / '))
      } else {
        toast.success(msgs.join(' / ') || '送付完了')
      }
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const draftIds     = calcs.filter(c => c.status === 'draft').map(c => c.id)
  const confirmedIds = calcs.filter(c => c.status === 'confirmed').map(c => c.id)
  const sendableCalcs = calcs.filter(c => c.status !== 'draft' && c.employee?.email)
  const totalGross   = calcs.reduce((s, c) => s + c.gross_pay, 0)
  const totalNet     = calcs.reduce((s, c) => s + c.net_pay, 0)

  const tokenMap = Object.fromEntries(tokens.map(t => [t.employee_id, t]))

  function statusBadge(status: string) {
    const map = {
      draft:     'bg-gray-100 text-gray-500',
      confirmed: 'bg-blue-100 text-blue-600',
      paid:      'bg-green-100 text-green-700',
    }
    const labels = { draft: '下書き', confirmed: '確定', paid: '振込済' }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status as keyof typeof map] ?? ''}`}>
        {labels[status as keyof typeof labels] ?? status}
      </span>
    )
  }

  function SendBadge({ employeeId }: { employeeId: string }) {
    const t = tokenMap[employeeId]
    if (!t) return null
    if (t.viewed_at) return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
        <Eye className="w-3 h-3" />閲覧済
      </span>
    )
    if (t.sent_at) return (
      <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
        <Clock className="w-3 h-3" />送付済
      </span>
    )
    return null
  }

  return (
    <div className="flex gap-4 h-full">
      {/* 一覧 */}
      <div className="flex-1 min-w-0">
        {/* 年月ナビ */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }}
            aria-label="前の月"
            className="p-1.5 rounded hover:bg-green-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-green-900 text-lg w-28 text-center">{year}年{month}月</span>
          <button
            onClick={() => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }}
            aria-label="次の月"
            className="p-1.5 rounded hover:bg-green-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* サマリーバー */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-green-100 px-4 py-3">
            <p className="text-xs text-gray-400">総支給額</p>
            <p className="font-bold text-green-900 tabular-nums">{formatCurrency(totalGross)}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 px-4 py-3">
            <p className="text-xs text-gray-400">差引支給額合計</p>
            <p className="font-bold text-green-900 tabular-nums">{formatCurrency(totalNet)}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 px-4 py-3">
            <p className="text-xs text-gray-400">対象者数</p>
            <p className="font-bold text-green-900">{calcs.length}名</p>
          </div>
        </div>

        {/* 一括操作 */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {draftIds.length > 0 && (
            <button
              onClick={() => bulkUpdateStatus(draftIds, 'confirmed')}
              disabled={updating}
              className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              下書きを一括確定 ({draftIds.length}件)
            </button>
          )}
          {confirmedIds.length > 0 && (
            <button
              onClick={() => bulkUpdateStatus(confirmedIds, 'paid')}
              disabled={updating}
              className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              確定を振込済に ({confirmedIds.length}件)
            </button>
          )}
          {sendableCalcs.length > 0 && (
            <button
              onClick={() => sendSlips()}
              disabled={sending}
              className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors ml-auto"
            >
              <Mail className="w-3.5 h-3.5" />
              {sending ? '送付中...' : `電子送付 (${sendableCalcs.length}名)`}
            </button>
          )}
          {calcs.length > 0 && sendableCalcs.length === 0 && calcs.some(c => c.status !== 'draft') && (
            <span className="flex items-center gap-1 text-xs text-amber-600 ml-auto">
              <AlertCircle className="w-3.5 h-3.5" />
              メール未登録のため電子送付不可
            </span>
          )}
        </div>

        {/* 明細一覧 */}
        {loading ? (
          <div className="flex justify-center h-40 items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
          </div>
        ) : calcs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 bg-white rounded-xl border border-green-100">
            <FileText className="w-8 h-8 text-green-200 mb-2" />
            <p className="text-gray-400 text-sm">この月の給与明細がありません</p>
            <p className="text-gray-300 text-xs mt-1">「給与計算」タブで計算を実行して保存してください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {calcs.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selected?.id === c.id
                    ? 'border-green-400 bg-green-50 shadow-sm'
                    : 'border-green-100 bg-white hover:border-green-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">
                          {c.employee?.staff?.name ?? '不明'}
                        </span>
                        {statusBadge(c.status)}
                        <span className="text-xs text-gray-400">{c.employee?.contract_type}</span>
                        <SendBadge employeeId={c.employee?.id} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.employee?.staff?.clinic?.name ?? '院不明'}
                        {c.employee?.email && (
                          <span className="ml-2 text-gray-300">{c.employee.email}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-900 tabular-nums">{formatCurrency(c.net_pay)}</p>
                    <p className="text-xs text-gray-400 tabular-nums">支給: {formatCurrency(c.gross_pay)}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-gray-400">
                  <span>健保: {formatCurrency(c.health_insurance)}</span>
                  <span>年金: {formatCurrency(c.welfare_pension)}</span>
                  <span>所税: {formatCurrency(c.income_tax)}</span>
                  <span>住税: {formatCurrency(c.resident_tax)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 明細詳細 */}
      {selected && (
        <div className="w-80 flex-shrink-0">
          <PayslipDetail
            calc={selected}
            tokenStatus={tokenMap[selected.employee?.id] ?? null}
            onClose={() => setSelected(null)}
            onSend={() => sendSlips([selected.employee?.id])}
            sending={sending}
          />
        </div>
      )}
    </div>
  )
}

function PayslipDetail({
  calc, tokenStatus, onClose, onSend, sending,
}: {
  calc: CalcWithEmployee
  tokenStatus: TokenStatus | null
  onClose: () => void
  onSend: () => void
  sending: boolean
}) {
  const hasEmail = !!calc.employee?.email
  const canSend  = hasEmail && calc.status !== 'draft'

  return (
    <div className="bg-white rounded-xl border border-green-100 overflow-hidden sticky top-0">
      <div className="bg-green-700 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-medium">{calc.employee?.staff?.name}</p>
          <p className="text-xs text-green-200">{calc.year}年{calc.month}月 給与明細</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded hover:bg-green-600 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="text-green-200 hover:text-white text-lg leading-none">×</button>
        </div>
      </div>

      {/* 電子送付ボタン */}
      <div className="px-4 py-3 border-b border-green-50 bg-green-50/50">
        <button
          onClick={onSend}
          disabled={!canSend || sending}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            canSend
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Mail className="w-4 h-4" />
          {sending ? '送付中...' : '電子送付（メール送信）'}
        </button>
        {!hasEmail && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            従業員マスタにメールを登録してください
          </p>
        )}
        {calc.status === 'draft' && hasEmail && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            確定後に送付できます
          </p>
        )}
        {tokenStatus && (
          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
            {tokenStatus.sent_at && (
              <p className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-blue-400" />
                送付: {new Date(tokenStatus.sent_at).toLocaleString('ja-JP')}
              </p>
            )}
            {tokenStatus.viewed_at && (
              <p className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-emerald-500" />
                閲覧: {new Date(tokenStatus.viewed_at).toLocaleString('ja-JP')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* 支給 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">【支給】</p>
          <div className="space-y-1">
            <SlipRow label="基本給" amount={calc.basic_salary} />
            {calc.fixed_overtime_pay > 0 && <SlipRow label="固定残業代" amount={calc.fixed_overtime_pay} />}
            {calc.excess_overtime_pay > 0 && <SlipRow label="超過残業手当" amount={calc.excess_overtime_pay} />}
            {calc.late_night_pay > 0 && <SlipRow label="深夜手当" amount={calc.late_night_pay} />}
            {calc.holiday_work_pay > 0 && <SlipRow label="休日手当" amount={calc.holiday_work_pay} />}
            {calc.absence_deduction > 0 && <SlipRow label="欠勤控除" amount={-calc.absence_deduction} />}
            {calc.commute_allowance > 0 && <SlipRow label="通勤手当(非課税)" amount={calc.commute_allowance} />}
            {calc.commute_allowance_taxable > 0 && <SlipRow label="通勤手当(課税)" amount={calc.commute_allowance_taxable} />}
            {calc.performance_allowance > 0 && <SlipRow label="業績手当" amount={calc.performance_allowance} />}
            {calc.other_allowances > 0 && <SlipRow label="その他手当" amount={calc.other_allowances} />}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-sm font-semibold">
            <span>支給合計</span>
            <span className="tabular-nums">{formatCurrency(calc.gross_pay)}</span>
          </div>
        </div>

        {/* 控除 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">【控除】</p>
          <div className="space-y-1">
            {calc.health_insurance > 0 && <SlipRow label="健康保険料" amount={calc.health_insurance} deduction />}
            {calc.nursing_care_insurance > 0 && <SlipRow label="介護保険料" amount={calc.nursing_care_insurance} deduction />}
            {calc.welfare_pension > 0 && <SlipRow label="厚生年金保険料" amount={calc.welfare_pension} deduction />}
            {calc.employment_insurance > 0 && <SlipRow label="雇用保険料" amount={calc.employment_insurance} deduction />}
            {calc.income_tax > 0 && <SlipRow label="所得税" amount={calc.income_tax} deduction />}
            {calc.resident_tax > 0 && <SlipRow label="住民税" amount={calc.resident_tax} deduction />}
            {calc.other_deductions > 0 && <SlipRow label="その他控除" amount={calc.other_deductions} deduction />}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-sm font-semibold">
            <span>控除合計</span>
            <span className="text-red-500 tabular-nums">{formatCurrency(calc.total_deductions)}</span>
          </div>
        </div>

        {/* 差引 */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex justify-between font-bold">
            <span className="text-green-900">差引支給額</span>
            <span className="text-green-800 tabular-nums text-lg">{formatCurrency(calc.net_pay)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SlipRow({ label, amount, deduction }: { label: string; amount: number; deduction?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`tabular-nums font-medium ${deduction || amount < 0 ? 'text-red-500' : 'text-gray-800'}`}>
        {deduction ? '-' : amount < 0 ? '-' : ''}{formatCurrency(Math.abs(amount))}
      </span>
    </div>
  )
}
