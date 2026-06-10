'use client'

import { useEffect, useState, useCallback } from 'react'
import { Save, ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react'
import type { PayrollEmployee, PayrollAttendance } from '@/types/payroll'
import { toast } from 'sonner'
import { checkMonthlyOvertimeLimit } from '@/lib/payroll-calculator'

export default function AttendancePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [employees, setEmployees] = useState<PayrollEmployee[]>([])
  const [attendance, setAttendance] = useState<Record<string, PayrollAttendance>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/payroll/employees?active=true'),
        fetch(`/api/payroll/attendance?year=${year}&month=${month}`),
      ])
      const emps: PayrollEmployee[] = await empRes.json()
      const atts: PayrollAttendance[] = await attRes.json()

      setEmployees(Array.isArray(emps) ? emps : [])

      const map: Record<string, PayrollAttendance> = {}
      if (Array.isArray(atts)) {
        atts.forEach(a => { map[a.payroll_employee_id] = a })
      }
      setAttendance(map)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  function getOrDefault(empId: string): PayrollAttendance {
    return attendance[empId] ?? {
      id: '',
      payroll_employee_id: empId,
      year, month,
      scheduled_work_days: 21,
      actual_work_days: 21,
      paid_leave_days: 0,
      absence_days: 0,
      late_early_leave_times: 0,
      scheduled_work_hours: 168,
      actual_work_hours: 168,
      overtime_hours: 0,
      overtime_hours_over60: 0,
      late_night_hours: 0,
      holiday_work_hours: 0,
      notes: null,
      submitted_at: null,
      created_at: '',
      updated_at: '',
    }
  }

  function updateField(empId: string, key: keyof PayrollAttendance, value: unknown) {
    setAttendance(prev => ({
      ...prev,
      [empId]: { ...getOrDefault(empId), [key]: value },
    }))
  }

  async function saveRow(empId: string) {
    setSaving(empId)
    try {
      const data = getOrDefault(empId)
      const res = await fetch('/api/payroll/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, year, month, payroll_employee_id: empId }),
      })
      if (!res.ok) throw new Error('保存失敗')
      const saved = await res.json()
      setAttendance(prev => ({ ...prev, [empId]: saved }))
      toast.success('勤怠データを保存しました')
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setSaving(null)
    }
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="max-w-7xl">
      {/* 年月ナビ */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-green-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-green-900 text-lg w-28 text-center">
          {year}年{month}月
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-green-100 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-400">勤怠実績</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
        </div>
      ) : employees.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">
          従業員が登録されていません。先に従業員管理から登録してください。
        </p>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => {
            const att = getOrDefault(emp.id)
            const isSaving = saving === emp.id
            const otCheck = checkMonthlyOvertimeLimit(att.overtime_hours + att.overtime_hours_over60)

            return (
              <div key={emp.id} className="bg-white rounded-xl border border-green-100 p-4">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                      {(emp.staff?.name ?? '?')[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{emp.staff?.name}</p>
                      <p className="text-xs text-gray-400">{emp.contract_type} / {emp.staff?.clinic?.name}</p>
                    </div>
                    {otCheck.exceeded && (
                      <div className="flex items-center gap-1 text-orange-600 text-xs bg-orange-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        月60H超残業 (+{otCheck.overHours.toFixed(1)}H)
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => saveRow(emp.id)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                </div>

                {/* 入力グリッド */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <AttField label="所定労働日数" suffix="日">
                    <input
                      type="number" min={0} step={1}
                      value={att.scheduled_work_days}
                      onChange={e => updateField(emp.id, 'scheduled_work_days', Number(e.target.value))}
                      className="att-input"
                    />
                  </AttField>
                  <AttField label="出勤日数" suffix="日">
                    <input
                      type="number" min={0} step={1}
                      value={att.actual_work_days}
                      onChange={e => updateField(emp.id, 'actual_work_days', Number(e.target.value))}
                      className="att-input"
                    />
                  </AttField>
                  <AttField label="有給取得" suffix="日">
                    <input
                      type="number" min={0} step={0.5}
                      value={att.paid_leave_days}
                      onChange={e => updateField(emp.id, 'paid_leave_days', Number(e.target.value))}
                      className="att-input"
                    />
                  </AttField>
                  <AttField label="欠勤" suffix="日">
                    <input
                      type="number" min={0} step={0.5}
                      value={att.absence_days}
                      onChange={e => updateField(emp.id, 'absence_days', Number(e.target.value))}
                      className="att-input"
                    />
                  </AttField>
                  {emp.contract_type === 'パート' && (
                    <AttField label="実労働時間" suffix="H">
                      <input
                        type="number" min={0} step={0.25}
                        value={att.actual_work_hours}
                        onChange={e => updateField(emp.id, 'actual_work_hours', Number(e.target.value))}
                        className="att-input"
                      />
                    </AttField>
                  )}
                  <AttField label="残業（〜60H）" suffix="H">
                    <input
                      type="number" min={0} step={0.25}
                      value={att.overtime_hours}
                      onChange={e => updateField(emp.id, 'overtime_hours', Number(e.target.value))}
                      className="att-input"
                    />
                  </AttField>
                  <AttField label="残業（60H超）" suffix="H">
                    <input
                      type="number" min={0} step={0.25}
                      value={att.overtime_hours_over60}
                      onChange={e => updateField(emp.id, 'overtime_hours_over60', Number(e.target.value))}
                      className="att-input"
                    />
                  </AttField>
                  <AttField label="深夜労働" suffix="H">
                    <input
                      type="number" min={0} step={0.25}
                      value={att.late_night_hours}
                      onChange={e => updateField(emp.id, 'late_night_hours', Number(e.target.value))}
                      className="att-input"
                    />
                  </AttField>
                  <AttField label="休日出勤" suffix="H">
                    <input
                      type="number" min={0} step={0.25}
                      value={att.holiday_work_hours}
                      onChange={e => updateField(emp.id, 'holiday_work_hours', Number(e.target.value))}
                      className="att-input"
                    />
                  </AttField>
                </div>

                {/* 備考 */}
                <div className="mt-3">
                  <input
                    type="text"
                    value={att.notes ?? ''}
                    onChange={e => updateField(emp.id, 'notes', e.target.value)}
                    placeholder="備考（任意）"
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
                  />
                </div>

                {/* 勤怠サマリー */}
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    実績: {att.actual_work_days}日出勤 / 残業 {(att.overtime_hours + att.overtime_hours_over60).toFixed(1)}H
                    {att.paid_leave_days > 0 && ` / 有給 ${att.paid_leave_days}日`}
                    {att.absence_days > 0 && ` / 欠勤 ${att.absence_days}日`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AttField({ label, suffix, children }: { label: string; suffix: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {children}
        <span className="text-xs text-gray-400 whitespace-nowrap">{suffix}</span>
      </div>
    </div>
  )
}
