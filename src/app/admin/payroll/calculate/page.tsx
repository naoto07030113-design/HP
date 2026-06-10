'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calculator, Save, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { PayrollEmployee, PayrollCalculationResult, AllowanceItem } from '@/types/payroll'
import { formatCurrency } from '@/lib/payroll-calculator'
import { toast } from 'sonner'

interface CalcPreview {
  employeeId: string
  result: PayrollCalculationResult | null
  loading: boolean
  error: string | null
}

export default function PayrollCalculatePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [employees, setEmployees] = useState<PayrollEmployee[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [preview, setPreview] = useState<CalcPreview | null>(null)
  const [allowances, setAllowances] = useState<AllowanceItem[]>([])
  const [perfAllowance, setPerfAllowance] = useState(0)
  const [residentTax, setResidentTax] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const loadEmployees = useCallback(async () => {
    const res = await fetch('/api/payroll/employees?active=true')
    const data = await res.json()
    setEmployees(Array.isArray(data) ? data : [])
    if (Array.isArray(data) && data.length > 0) setSelectedId(data[0].id)
  }, [])

  useEffect(() => { loadEmployees() }, [loadEmployees])

  async function runPreview() {
    if (!selectedId) return
    setPreview({ employeeId: selectedId, result: null, loading: true, error: null })

    const selected = employees.find(e => e.id === selectedId)
    const adjustments: Record<string, number> = {
      performance_allowance: perfAllowance,
    }
    if (residentTax !== null) adjustments.resident_tax = residentTax

    try {
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedId,
          year,
          month,
          additional_allowances: allowances,
          manual_adjustments: adjustments,
          save: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview({ employeeId: selectedId, result: data.result, loading: false, error: null })
      if (selected && residentTax === null) {
        setResidentTax(selected.resident_tax_monthly)
      }
    } catch (e) {
      setPreview({ employeeId: selectedId, result: null, loading: false, error: String(e) })
    }
  }

  async function saveCalc() {
    if (!selectedId) return
    setSaving(true)
    try {
      const adjustments: Record<string, number> = { performance_allowance: perfAllowance }
      if (residentTax !== null) adjustments.resident_tax = residentTax

      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedId,
          year,
          month,
          additional_allowances: allowances,
          manual_adjustments: adjustments,
          save: true,
        }),
      })
      if (!res.ok) throw new Error('保存失敗')
      toast.success('給与計算を保存しました')
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  function addAllowance() {
    setAllowances(prev => [
      ...prev,
      { category: '業績手当', description: '', amount: 0, is_taxable: true, is_deduction: false },
    ])
  }

  function removeAllowance(i: number) {
    setAllowances(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateAllowance(i: number, key: keyof AllowanceItem, value: unknown) {
    setAllowances(prev => prev.map((a, idx) => idx === i ? { ...a, [key]: value } : a))
  }

  const selected = employees.find(e => e.id === selectedId)

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }} className="p-1.5 rounded hover:bg-green-100">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-green-900 text-lg w-28 text-center">{year}年{month}月</span>
        <button onClick={() => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }} className="p-1.5 rounded hover:bg-green-100">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4">
        {/* 左: 入力パネル */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* 従業員選択 */}
          <div className="bg-white rounded-xl border border-green-100 p-4">
            <label className="text-xs text-gray-500 mb-1.5 block">従業員</label>
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setPreview(null) }}
              className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.staff?.name ?? '不明'} ({e.contract_type})
                </option>
              ))}
            </select>
            {selected && (
              <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                <p>{selected.contract_type === 'パート' ? `時給 ¥${selected.hourly_wage.toLocaleString()}` : `月給 ¥${selected.basic_salary.toLocaleString()}`}</p>
                <p>固定残業: {selected.fixed_overtime_hours}H / {formatCurrency(selected.fixed_overtime_amount)}</p>
                <p>扶養: {selected.dependent_count}人</p>
              </div>
            )}
          </div>

          {/* 業績手当 */}
          <div className="bg-white rounded-xl border border-green-100 p-4">
            <label className="text-xs text-gray-500 mb-1.5 block">業績手当</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                value={perfAllowance}
                onChange={e => setPerfAllowance(Number(e.target.value))}
                className="flex-1 border border-green-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
              />
              <span className="text-xs text-gray-400">円</span>
            </div>
          </div>

          {/* 住民税（上書き） */}
          <div className="bg-white rounded-xl border border-green-100 p-4">
            <label className="text-xs text-gray-500 mb-1.5 block">住民税（月額上書き）</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                value={residentTax ?? selected?.resident_tax_monthly ?? 0}
                onChange={e => setResidentTax(Number(e.target.value))}
                className="flex-1 border border-green-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
              />
              <span className="text-xs text-gray-400">円</span>
            </div>
          </div>

          {/* 追加手当 */}
          <div className="bg-white rounded-xl border border-green-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">追加手当・控除</label>
              <button onClick={addAllowance} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800">
                <Plus className="w-3 h-3" /> 追加
              </button>
            </div>
            <div className="space-y-2">
              {allowances.map((a, i) => (
                <div key={i} className="space-y-1.5 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={a.category}
                      onChange={e => updateAllowance(i, 'category', e.target.value)}
                      className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1"
                    >
                      {['業績手当', '残業手当', '通勤手当', '有給手当', '特別手当', 'その他手当'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button onClick={() => removeAllowance(i)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={a.description}
                    onChange={e => updateAllowance(i, 'description', e.target.value)}
                    placeholder="説明"
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={a.amount}
                      onChange={e => updateAllowance(i, 'amount', Number(e.target.value))}
                      className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
                    />
                    <span className="text-xs text-gray-400">円</span>
                    <label className="text-xs text-gray-500 flex items-center gap-0.5">
                      <input type="checkbox" checked={a.is_deduction} onChange={e => updateAllowance(i, 'is_deduction', e.target.checked)} />
                      控除
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={runPreview}
            className="w-full flex items-center justify-center gap-2 bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            計算プレビュー
          </button>
        </div>

        {/* 右: 計算結果 */}
        <div className="flex-1 min-w-0">
          {!preview ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-green-100">
              <Calculator className="w-8 h-8 text-green-300 mb-2" />
              <p className="text-gray-400 text-sm">従業員を選択して「計算プレビュー」をクリック</p>
            </div>
          ) : preview.loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-green-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
            </div>
          ) : preview.error ? (
            <div className="bg-red-50 rounded-xl border border-red-100 p-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-medium">計算エラー</p>
              </div>
              <p className="text-sm text-red-500 mt-1">{preview.error}</p>
            </div>
          ) : preview.result ? (
            <CalcResultView
              result={preview.result}
              employeeName={selected?.staff?.name ?? ''}
              onSave={saveCalc}
              saving={saving}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CalcResultView({
  result, employeeName, onSave, saving,
}: {
  result: PayrollCalculationResult
  employeeName: string
  onSave: () => void
  saving: boolean
}) {
  const incomes = result.breakdown.filter(b => b.type === 'income')
  const deductions = result.breakdown.filter(b => b.type === 'deduction')

  return (
    <div className="bg-white rounded-xl border border-green-100 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-green-700 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">{employeeName} 様</p>
            <p className="text-green-200 text-sm mt-0.5">給与計算明細</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(result.net_pay)}</p>
            <p className="text-green-200 text-sm">差引支給額</p>
          </div>
        </div>
      </div>

      <div className="p-5 grid md:grid-cols-2 gap-5">
        {/* 支給 */}
        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
            支給項目
          </h3>
          <div className="space-y-1.5">
            {incomes.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className={`font-medium tabular-nums ${item.amount < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between font-semibold">
            <span className="text-gray-700">支給合計</span>
            <span className="text-gray-900 tabular-nums">{formatCurrency(result.gross_pay)}</span>
          </div>
        </div>

        {/* 控除 */}
        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
            控除項目
          </h3>
          <div className="space-y-1.5">
            {deductions.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-red-500 tabular-nums">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between font-semibold">
            <span className="text-gray-700">控除合計</span>
            <span className="text-red-500 tabular-nums">{formatCurrency(result.total_deductions)}</span>
          </div>
        </div>
      </div>

      {/* 差引支給額 */}
      <div className="mx-5 mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="flex justify-between items-center">
          <span className="font-bold text-green-900">差引支給額（手取り）</span>
          <span className="text-2xl font-bold text-green-800 tabular-nums">{formatCurrency(result.net_pay)}</span>
        </div>
        <div className="mt-2 text-xs text-gray-400 space-y-0.5">
          <p>標準報酬月額: {formatCurrency(result.standard_monthly_salary)}</p>
          <p>課税支給額: {formatCurrency(result.taxable_gross)}</p>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="px-5 pb-5">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : 'この計算結果を保存する'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          保存後、給与明細タブから確認・確定処理できます
        </p>
      </div>
    </div>
  )
}
