'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, ChevronRight, Building2, AlertTriangle } from 'lucide-react'
import type { PayrollEmployee } from '@/types/payroll'
import PayrollEmployeeForm from '@/features/payroll/components/PayrollEmployeeForm'

export default function PayrollEmployeesPage() {
  const [employees, setEmployees] = useState<PayrollEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payroll/employees?active=true')
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = employees.filter((e) => {
    const name = e.staff?.name ?? ''
    return name.includes(search) || (e.employee_number ?? '').includes(search)
  })

  const selected = employees.find((e) => e.id === selectedId)

  return (
    <div className="flex gap-4 h-full">
      {/* 一覧 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-green-900">在籍従業員 ({employees.length}名)</h2>
          <button
            onClick={() => { setSelectedId(null); setShowForm(true) }}
            className="flex items-center gap-1.5 bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新規登録
          </button>
        </div>

        {/* 検索 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="氏名・社員番号で検索"
            className="w-full pl-9 pr-4 py-2 border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">
                従業員が見つかりません。「新規登録」から追加してください。
              </p>
            )}
            {filtered.map((emp) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                active={emp.id === selectedId}
                onClick={() => { setSelectedId(emp.id); setShowForm(true) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 詳細フォーム */}
      {showForm && (
        <div className="w-[520px] flex-shrink-0">
          <PayrollEmployeeForm
            initial={selected}
            onSaved={() => { load(); setShowForm(false) }}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  )
}

function EmployeeCard({
  emp, active, onClick,
}: {
  emp: PayrollEmployee
  active: boolean
  onClick: () => void
}) {
  const contractBadge = {
    '正社員': 'bg-green-100 text-green-700',
    'パート': 'bg-blue-100 text-blue-700',
    '業務委託': 'bg-purple-100 text-purple-700',
  }

  const hasIncompleteBank = !emp.bank_account_number || !emp.bank_name

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        active
          ? 'border-green-400 bg-green-50 shadow-sm'
          : 'border-green-100 bg-white hover:border-green-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-sm">
          {(emp.staff?.name ?? '?')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{emp.staff?.name ?? '氏名未設定'}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${contractBadge[emp.contract_type] ?? ''}`}>
              {emp.contract_type}
            </span>
            {hasIncompleteBank && (
              <span title="口座情報が未入力">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {emp.staff?.clinic?.name ?? '院未設定'}
            </span>
            {emp.employee_number && <span>#{emp.employee_number}</span>}
            <span>入社: {emp.hire_date}</span>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {emp.contract_type === 'パート'
              ? `時給 ¥${emp.hourly_wage.toLocaleString()}`
              : `月給 ¥${emp.basic_salary.toLocaleString()} / 固定残業 ${emp.fixed_overtime_hours}H`}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-2" />
      </div>
    </button>
  )
}
