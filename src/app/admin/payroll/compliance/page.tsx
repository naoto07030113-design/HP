'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, ShieldCheck, AlertTriangle, ExternalLink, CheckCircle2, Clock } from 'lucide-react'
import type { PayrollCompliance, ImpactLevel } from '@/types/payroll'
import { toast } from 'sonner'

const IMPACT_MAP: Record<ImpactLevel, { label: string; cls: string }> = {
  critical: { label: '緊急', cls: 'bg-red-100 text-red-700 border-red-200' },
  high:     { label: '高',   cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium:   { label: '中',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low:      { label: '低',   cls: 'bg-blue-100 text-blue-700 border-blue-200' },
}

const CATEGORY_MAP: Record<string, string> = {
  '最低賃金': '💰',
  '社会保険': '🏥',
  '税制': '📊',
  '労働法': '⚖️',
  '育休': '👶',
  'その他': '📋',
}

export default function CompliancePage() {
  const [items, setItems] = useState<PayrollCompliance[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [applying, setApplying] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payroll/compliance')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function markApplied(id: string) {
    setApplying(id)
    try {
      const res = await fetch('/api/payroll/compliance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_applied: true }),
      })
      if (!res.ok) throw new Error()
      toast.success('対応済みにしました')
      load()
    } catch {
      toast.error('更新失敗')
    } finally {
      setApplying(null)
    }
  }

  const filtered = items.filter(item => {
    if (filter === 'pending') return !item.is_applied
    if (filter === 'done') return item.is_applied
    return true
  })

  const pendingCritical = items.filter(i => !i.is_applied && i.impact_level === 'critical').length
  const pendingHigh = items.filter(i => !i.is_applied && i.impact_level === 'high').length
  const pendingAll = items.filter(i => !i.is_applied).length

  return (
    <div className="max-w-4xl space-y-5">
      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600 font-medium">緊急対応が必要</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{pendingCritical}件</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium">要対応（高）</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{pendingHigh}件</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium">対応済</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{items.length - pendingAll}件</p>
        </div>
      </div>

      {/* フィルター & 追加 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'pending', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-green-700 border border-green-200 hover:border-green-400'
              }`}
            >
              {f === 'all' ? 'すべて' : f === 'pending' ? '未対応' : '対応済'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(o => !o)}
          className="flex items-center gap-1.5 text-sm text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:border-green-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          手動追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showAdd && <AddComplianceForm onSaved={() => { setShowAdd(false); load() }} />}

      {/* 一覧 */}
      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const impact = IMPACT_MAP[item.impact_level]
            const catIcon = CATEGORY_MAP[item.category] ?? '📋'
            const isApplying = applying === item.id

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 transition-opacity ${
                  item.is_applied ? 'opacity-60' : 'border-green-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl mt-0.5 flex-shrink-0">{catIcon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm">{item.law_name}</h3>
                          <span className={`px-2 py-0.5 rounded border text-xs font-medium ${impact.cls}`}>
                            {impact.label}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          {item.is_applied && (
                            <span className="text-xs text-green-600 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> 対応済
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span>施行日: {item.effective_date}</span>
                          {item.prefecture && <span>対象: {item.prefecture}</span>}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mt-2">{item.summary}</p>

                    {item.detail && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.detail}</p>
                    )}

                    {item.action_required && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-amber-800">
                          <span className="font-medium">対応事項: </span>
                          {item.action_required}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          法令ソース
                        </a>
                      )}
                      {!item.is_applied && (
                        <button
                          onClick={() => markApplied(item.id)}
                          disabled={isApplying}
                          className="flex items-center gap-1.5 text-xs bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isApplying ? '更新中...' : '対応済みにする'}
                        </button>
                      )}
                      {item.applied_at && (
                        <span className="text-xs text-gray-400">
                          対応: {new Date(item.applied_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">
              {filter === 'pending' ? '未対応の法令変更はありません' : 'データがありません'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AddComplianceForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState({
    category: '労働法',
    law_name: '',
    effective_date: '',
    prefecture: '',
    summary: '',
    detail: '',
    impact_level: 'medium',
    action_required: '',
    source_url: '',
  })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/payroll/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, prefecture: form.prefecture || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('追加しました')
      onSaved()
    } catch {
      toast.error('追加失敗')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={submit} className="bg-green-50 rounded-xl border border-green-200 p-4 space-y-3">
      <p className="font-semibold text-sm text-green-900">法令・制度変更を手動追加</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">カテゴリ</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="input text-sm">
            {['最低賃金', '社会保険', '税制', '労働法', '育休', 'その他'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">重要度</label>
          <select value={form.impact_level} onChange={e => set('impact_level', e.target.value)} className="input text-sm">
            <option value="critical">緊急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">法令名・制度名</label>
        <input type="text" value={form.law_name} onChange={e => set('law_name', e.target.value)} required className="input text-sm" placeholder="例: 最低賃金改定（令和7年10月）" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">施行日</label>
          <input type="date" value={form.effective_date} onChange={e => set('effective_date', e.target.value)} required className="input text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">対象都道府県（任意）</label>
          <input type="text" value={form.prefecture} onChange={e => set('prefecture', e.target.value)} className="input text-sm" placeholder="例: 千葉" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">概要</label>
        <input type="text" value={form.summary} onChange={e => set('summary', e.target.value)} required className="input text-sm" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">対応事項</label>
        <input type="text" value={form.action_required} onChange={e => set('action_required', e.target.value)} className="input text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
          {saving ? '追加中...' : '追加する'}
        </button>
        <button type="button" onClick={onSaved} className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">キャンセル</button>
      </div>
    </form>
  )
}
