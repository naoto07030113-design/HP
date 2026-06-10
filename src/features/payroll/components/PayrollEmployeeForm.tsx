'use client'

import { useEffect, useState } from 'react'
import { X, Save, AlertTriangle } from 'lucide-react'
import type { PayrollEmployee } from '@/types/payroll'

interface Props {
  initial?: PayrollEmployee
  onSaved: () => void
  onClose: () => void
}

interface StaffOption {
  id: string
  name: string
  clinic?: { name: string }
}

export default function PayrollEmployeeForm({ initial, onSaved, onClose }: Props) {
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!initial

  const [form, setForm] = useState({
    staff_id: initial?.staff_id ?? '',
    employee_number: initial?.employee_number ?? '',
    contract_type: initial?.contract_type ?? '正社員',
    hire_date: initial?.hire_date ?? '',
    resignation_date: initial?.resignation_date ?? '',
    birth_date: initial?.birth_date ?? '',
    basic_salary: initial?.basic_salary ?? 0,
    hourly_wage: initial?.hourly_wage ?? 0,
    fixed_overtime_hours: initial?.fixed_overtime_hours ?? 0,
    fixed_overtime_amount: initial?.fixed_overtime_amount ?? 0,
    health_insurance_enrolled: initial?.health_insurance_enrolled ?? true,
    pension_enrolled: initial?.pension_enrolled ?? true,
    employment_insurance_enrolled: initial?.employment_insurance_enrolled ?? true,
    dependent_count: initial?.dependent_count ?? 0,
    resident_tax_monthly: initial?.resident_tax_monthly ?? 0,
    commute_allowance_monthly: initial?.commute_allowance_monthly ?? 0,
    commute_allowance_taxable: initial?.commute_allowance_taxable ?? 0,
    bank_name: initial?.bank_name ?? '',
    bank_branch: initial?.bank_branch ?? '',
    bank_account_type: initial?.bank_account_type ?? '普通',
    bank_account_number: initial?.bank_account_number ?? '',
    bank_account_holder: initial?.bank_account_holder ?? '',
    notes: initial?.notes ?? '',
    is_active: initial?.is_active ?? true,
  })

  useEffect(() => {
    fetch('/api/payroll/employees?active=true')
      .then(r => r.json())
      .then((data: PayrollEmployee[]) => {
        const usedStaffIds = data.map(e => e.staff_id).filter(Boolean)
        fetch('/api/staff')
          .then(r => r.json())
          .then((staff: StaffOption[]) => {
            const available = Array.isArray(staff)
              ? staff.filter(s => !usedStaffIds.includes(s.id) || s.id === initial?.staff_id)
              : []
            setStaffOptions(available)
          })
          .catch(() => setStaffOptions([]))
      })
      .catch(() => {})
  }, [initial?.staff_id])

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.staff_id && !isEdit) { setError('スタッフを選択してください'); return }
    if (!form.hire_date) { setError('入社日を入力してください'); return }

    setSaving(true)
    setError('')
    try {
      const body = {
        ...form,
        basic_salary: Number(form.basic_salary),
        hourly_wage: Number(form.hourly_wage),
        fixed_overtime_hours: Number(form.fixed_overtime_hours),
        fixed_overtime_amount: Number(form.fixed_overtime_amount),
        dependent_count: Number(form.dependent_count),
        resident_tax_monthly: Number(form.resident_tax_monthly),
        commute_allowance_monthly: Number(form.commute_allowance_monthly),
        commute_allowance_taxable: Number(form.commute_allowance_taxable),
        resignation_date: form.resignation_date || null,
        birth_date: form.birth_date || null,
        bank_name: form.bank_name || null,
        bank_branch: form.bank_branch || null,
        bank_account_number: form.bank_account_number || null,
        bank_account_holder: form.bank_account_holder || null,
        notes: form.notes || null,
      }

      const url = isEdit
        ? `/api/payroll/employees/${initial!.id}`
        : '/api/payroll/employees'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'エラーが発生しました')
      }
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-green-100 shadow-sm h-full overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-green-100 px-5 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-green-900">
          {isEdit ? '従業員情報編集' : '従業員新規登録'}
        </h3>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* 基本情報 */}
        <Section title="基本情報">
          <Field label="スタッフ紐付け" required={!isEdit}>
            {isEdit ? (
              <div className="text-sm text-gray-600 py-1.5">{initial?.staff?.name}</div>
            ) : (
              <select
                value={form.staff_id}
                onChange={e => set('staff_id', e.target.value)}
                className="input"
                required
              >
                <option value="">スタッフを選択</option>
                {staffOptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.clinic ? `(${s.clinic.name})` : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="社員番号">
              <input
                type="text"
                value={form.employee_number}
                onChange={e => set('employee_number', e.target.value)}
                className="input"
                placeholder="例: EMP001"
              />
            </Field>
            <Field label="雇用形態">
              <select
                value={form.contract_type}
                onChange={e => set('contract_type', e.target.value)}
                className="input"
              >
                {['正社員', 'パート', '業務委託'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="入社日" required>
              <input
                type="date"
                value={form.hire_date}
                onChange={e => set('hire_date', e.target.value)}
                className="input"
                required
              />
            </Field>
            <Field label="生年月日">
              <input
                type="date"
                value={form.birth_date}
                onChange={e => set('birth_date', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="退職日">
            <input
              type="date"
              value={form.resignation_date}
              onChange={e => set('resignation_date', e.target.value)}
              className="input"
            />
          </Field>
        </Section>

        {/* 賃金設定 */}
        <Section title="賃金設定">
          {(form.contract_type === '正社員') && (
            <>
              <Field label="基本給（月給）">
                <NumInput value={form.basic_salary} onChange={v => set('basic_salary', v)} suffix="円" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="固定残業時間">
                  <NumInput value={form.fixed_overtime_hours} onChange={v => set('fixed_overtime_hours', v)} suffix="H/月" />
                </Field>
                <Field label="固定残業代">
                  <NumInput value={form.fixed_overtime_amount} onChange={v => set('fixed_overtime_amount', v)} suffix="円" />
                </Field>
              </div>
            </>
          )}
          {form.contract_type === 'パート' && (
            <Field label="時給">
              <NumInput value={form.hourly_wage} onChange={v => set('hourly_wage', v)} suffix="円/時" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="非課税通勤手当（月額）">
              <NumInput value={form.commute_allowance_monthly} onChange={v => set('commute_allowance_monthly', v)} suffix="円" />
            </Field>
            <Field label="課税通勤手当（月額）">
              <NumInput value={form.commute_allowance_taxable} onChange={v => set('commute_allowance_taxable', v)} suffix="円" />
            </Field>
          </div>
        </Section>

        {/* 社会保険・税務 */}
        <Section title="社会保険・税務">
          <div className="space-y-2">
            <CheckboxField
              label="健康保険加入"
              checked={form.health_insurance_enrolled}
              onChange={v => set('health_insurance_enrolled', v)}
            />
            <CheckboxField
              label="厚生年金加入"
              checked={form.pension_enrolled}
              onChange={v => set('pension_enrolled', v)}
            />
            <CheckboxField
              label="雇用保険加入"
              checked={form.employment_insurance_enrolled}
              onChange={v => set('employment_insurance_enrolled', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="扶養家族数">
              <NumInput value={form.dependent_count} onChange={v => set('dependent_count', v)} suffix="人" />
            </Field>
            <Field label="住民税（月額）">
              <NumInput value={form.resident_tax_monthly} onChange={v => set('resident_tax_monthly', v)} suffix="円" />
            </Field>
          </div>
        </Section>

        {/* 口座情報 */}
        <Section title="振込口座">
          <div className="grid grid-cols-2 gap-3">
            <Field label="銀行名">
              <input
                type="text"
                value={form.bank_name}
                onChange={e => set('bank_name', e.target.value)}
                className="input"
                placeholder="例: 三菱UFJ銀行"
              />
            </Field>
            <Field label="支店名">
              <input
                type="text"
                value={form.bank_branch}
                onChange={e => set('bank_branch', e.target.value)}
                className="input"
                placeholder="例: 新宿支店"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="口座種別">
              <select
                value={form.bank_account_type}
                onChange={e => set('bank_account_type', e.target.value)}
                className="input"
              >
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </Field>
            <Field label="口座番号">
              <input
                type="text"
                value={form.bank_account_number}
                onChange={e => set('bank_account_number', e.target.value)}
                className="input"
                placeholder="例: 1234567"
              />
            </Field>
          </div>
          <Field label="口座名義（カタカナ）">
            <input
              type="text"
              value={form.bank_account_holder}
              onChange={e => set('bank_account_holder', e.target.value)}
              className="input"
              placeholder="例: イトウ タロウ"
            />
          </Field>
        </Section>

        {/* 備考 */}
        <Section title="備考">
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className="input resize-none h-20"
            placeholder="特記事項があれば記入"
          />
          {isEdit && (
            <CheckboxField
              label="在籍中（オフで退職扱い）"
              checked={form.is_active}
              onChange={v => set('is_active', v)}
            />
          )}
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : (isEdit ? '変更を保存' : '登録する')}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function NumInput({
  value, onChange, suffix,
}: {
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="input flex-1"
        min={0}
      />
      {suffix && <span className="text-xs text-gray-400 whitespace-nowrap">{suffix}</span>}
    </div>
  )
}

function CheckboxField({
  label, checked, onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 accent-green-600"
      />
      {label}
    </label>
  )
}
