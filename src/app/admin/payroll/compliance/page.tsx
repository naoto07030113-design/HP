'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, ShieldCheck, AlertTriangle, ExternalLink, CheckCircle2, Clock,
  Sparkles, RefreshCw, ChevronDown, ChevronRight, Zap, X, Info,
} from 'lucide-react'
import type { PayrollCompliance, ImpactLevel } from '@/types/payroll'
import { toast } from 'sonner'

const IMPACT_MAP: Record<ImpactLevel, { label: string; cls: string }> = {
  critical: { label: '緊急', cls: 'bg-red-100 text-red-700 border-red-200' },
  high:     { label: '高',   cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium:   { label: '中',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low:      { label: '低',   cls: 'bg-blue-100 text-blue-700 border-blue-200' },
}

const CATEGORY_MAP: Record<string, string> = {
  '最低賃金': '💰', '社会保険': '🏥', '税制': '📊',
  '労働法': '⚖️', '育休': '👶', 'その他': '📋',
}

interface ScanHistory {
  id: string
  scanned_at: string
  status: string
  found_count: number
  new_count: number
  error_message?: string
}

interface RateProposal {
  id: string
  title: string
  category: string
  change_type: 'rate_update' | 'new_item' | 'manual_required'
  description: string
  source_url?: string
  effective_date?: string
  proposed_value?: Record<string, unknown>
  review_status: 'pending' | 'approved' | 'rejected' | 'applied'
  created_at: string
}

type ComplianceWithAI = PayrollCompliance & { ai_detected?: boolean; review_status?: string }

export default function CompliancePage() {
  const [items, setItems]           = useState<ComplianceWithAI[]>([])
  const [proposals, setProposals]   = useState<RateProposal[]>([])
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [loading, setLoading]       = useState(true)
  const [scanning, setScanning]     = useState(false)
  const [filter, setFilter]         = useState<'all' | 'pending' | 'done'>('all')
  const [applying, setApplying]     = useState<string | null>(null)
  const [showAdd, setShowAdd]       = useState(false)
  const [showProposals, setShowProposals] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState<RateProposal | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [compRes, propRes, histRes] = await Promise.all([
        fetch('/api/payroll/compliance'),
        fetch('/api/payroll/law-check/proposals?status=pending'),
        fetch('/api/payroll/law-check'),
      ])
      const [comp, prop, hist] = await Promise.all([
        compRes.json(), propRes.json(), histRes.json(),
      ])
      setItems(Array.isArray(comp) ? comp : [])
      setProposals(Array.isArray(prop) ? prop : [])
      setScanHistory(Array.isArray(hist) ? hist : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function runScan() {
    setScanning(true)
    try {
      const res = await fetch('/api/payroll/law-check', {
        method: 'POST',
        headers: { 'x-manual-trigger': '1' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'スキャン失敗')
      if (data.new > 0) {
        toast.success(`スキャン完了: ${data.new}件の新しい法改正情報を検出しました`)
      } else {
        toast.success(`スキャン完了: 新しい法改正情報はありませんでした（${data.found}件確認済み）`)
      }
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setScanning(false)
    }
  }

  async function markApplied(id: string) {
    setApplying(id)
    try {
      await fetch('/api/payroll/compliance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_applied: true }),
      })
      toast.success('対応済みにしました')
      load()
    } catch {
      toast.error('更新失敗')
    } finally {
      setApplying(null)
    }
  }

  async function handleProposal(id: string, action: 'approve' | 'reject' | 'apply', manualValue?: Record<string, unknown>) {
    setApplying(id)
    try {
      const res = await fetch('/api/payroll/law-check/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, manual_value: manualValue }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? '更新失敗')
      }
      const labels = { approve: '承認', reject: '却下', apply: 'DB反映' }
      toast.success(`${labels[action]}しました`)
      setSelectedProposal(null)
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setApplying(null)
    }
  }

  const filtered = items.filter(item => {
    if (filter === 'pending') return !item.is_applied
    if (filter === 'done')    return item.is_applied
    return true
  })

  const pendingCritical = items.filter(i => !i.is_applied && i.impact_level === 'critical').length
  const pendingHigh     = items.filter(i => !i.is_applied && i.impact_level === 'high').length
  const pendingAll      = items.filter(i => !i.is_applied).length
  const lastScan        = scanHistory[0]

  return (
    <div className="max-w-4xl space-y-5">

      {/* AIスキャンバー */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-green-200" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">AI法改正モニタリング</p>
            <p className="text-green-200 text-xs">
              {lastScan
                ? `最終スキャン: ${new Date(lastScan.scanned_at).toLocaleString('ja-JP')} / 検出 ${lastScan.found_count}件`
                : 'まだスキャンが実行されていません'
              }
              　（毎月1日 09:00 自動実行）
            </p>
          </div>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 bg-white text-green-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 disabled:opacity-60 transition-colors flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'スキャン中...' : '今すぐスキャン'}
        </button>
      </div>

      {/* 承認待ちプロポーザル */}
      {proposals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowProposals(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-amber-900 text-sm">
                AIが料率変更を検出 — 承認待ち {proposals.length}件
              </span>
            </div>
            {showProposals ? <ChevronDown className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-4 h-4 text-amber-600" />}
          </button>

          {showProposals && (
            <div className="px-4 pb-4 space-y-2">
              {proposals.map(p => (
                <div key={p.id} className="bg-white border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          {p.category}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {p.change_type === 'rate_update' ? '料率変更' : p.change_type === 'new_item' ? '新制度' : '運用変更'}
                        </span>
                        {p.effective_date && (
                          <span className="text-[10px] text-gray-400">
                            施行: {p.effective_date}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{p.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedProposal(p)}
                      className="flex-shrink-0 text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      確認・承認
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {showAdd && <AddComplianceForm onSaved={() => { setShowAdd(false); load() }} />}

      {/* 法令一覧 */}
      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const impact  = IMPACT_MAP[item.impact_level]
            const catIcon = CATEGORY_MAP[item.category] ?? '📋'
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
                          {item.ai_detected && (
                            <span className="flex items-center gap-0.5 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                              <Sparkles className="w-2.5 h-2.5" /> AI検出
                            </span>
                          )}
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
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          法令ソース
                        </a>
                      )}
                      {!item.is_applied && (
                        <button
                          onClick={() => markApplied(item.id)}
                          disabled={applying === item.id}
                          className="flex items-center gap-1.5 text-xs bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {applying === item.id ? '更新中...' : '対応済みにする'}
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

      {/* スキャン履歴 */}
      {scanHistory.length > 0 && (
        <details className="bg-white rounded-xl border border-green-100 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2">
            <Info className="w-3.5 h-3.5" />
            スキャン実行履歴 ({scanHistory.length}件)
          </summary>
          <div className="px-4 pb-3 space-y-1.5">
            {scanHistory.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  s.status === 'completed' ? 'bg-green-400' :
                  s.status === 'error'     ? 'bg-red-400'   : 'bg-yellow-400'
                }`} />
                <span>{new Date(s.scanned_at).toLocaleString('ja-JP')}</span>
                <span>検出 {s.found_count}件 / 新規 {s.new_count}件</span>
                {s.error_message && <span className="text-red-500 truncate">{s.error_message}</span>}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* プロポーザル承認モーダル */}
      {selectedProposal && (
        <ProposalModal
          proposal={selectedProposal}
          applying={applying === selectedProposal.id}
          onClose={() => setSelectedProposal(null)}
          onAction={handleProposal}
        />
      )}
    </div>
  )
}

/* ============================================================
   プロポーザル承認モーダル
   ============================================================ */
function ProposalModal({
  proposal, applying, onClose, onAction,
}: {
  proposal: RateProposal
  applying: boolean
  onClose: () => void
  onAction: (id: string, action: 'approve' | 'reject' | 'apply', value?: Record<string, unknown>) => void
}) {
  const pv = proposal.proposed_value
  const [editValue, setEditValue] = useState<Record<string, string>>(
    pv ? Object.fromEntries(Object.entries(pv).map(([k, v]) => [k, String(v ?? '')])) : {}
  )

  const canAutoApply = proposal.change_type === 'rate_update' &&
    (proposal.category === '最低賃金' || proposal.category === '社会保険')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-amber-600 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-200">AI検出 — 承認確認</p>
            <h2 className="font-bold">{proposal.title}</h2>
          </div>
          <button onClick={onClose} className="text-amber-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{proposal.category}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {proposal.change_type === 'rate_update' ? '料率変更' : proposal.change_type === 'new_item' ? '新制度' : '運用変更'}
            </span>
            {proposal.effective_date && (
              <span className="text-xs text-gray-500">施行: {proposal.effective_date}</span>
            )}
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">{proposal.description}</p>

          {proposal.source_url && (
            <a href={proposal.source_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              公式ソースを確認する
            </a>
          )}

          {/* 料率変更の提案値 */}
          {pv && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">提案されている変更内容</p>
              {Object.entries(pv).map(([key, val]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{key}</label>
                  {canAutoApply ? (
                    <input
                      type="text"
                      value={editValue[key] ?? String(val ?? '')}
                      onChange={e => setEditValue(v => ({ ...v, [key]: e.target.value }))}
                      className="input text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">{String(val)}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {!canAutoApply && proposal.change_type !== 'rate_update' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <p className="font-medium mb-1">この変更は自動反映できません</p>
              <p>法令ソースを確認し、必要に応じて手動で給与システムの設定を更新してください。</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2 pt-2">
            {canAutoApply && (
              <button
                onClick={() => onAction(proposal.id, 'apply', Object.fromEntries(
                  Object.entries(editValue).map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)])
                ))}
                disabled={applying}
                className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {applying ? '反映中...' : 'DBに反映して承認'}
              </button>
            )}
            {!canAutoApply && (
              <button
                onClick={() => onAction(proposal.id, 'approve')}
                disabled={applying}
                className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {applying ? '処理中...' : '確認済みとして承認'}
              </button>
            )}
            <button
              onClick={() => onAction(proposal.id, 'reject')}
              disabled={applying}
              className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              却下
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   手動追加フォーム
   ============================================================ */
function AddComplianceForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState({
    category: '労働法', law_name: '', effective_date: '', prefecture: '',
    summary: '', detail: '', impact_level: 'medium', action_required: '', source_url: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

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
    } catch { toast.error('追加失敗') }
    finally { setSaving(false) }
  }

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
          <label className="text-xs text-gray-500 mb-1 block">対象都道府県</label>
          <input type="text" value={form.prefecture} onChange={e => set('prefecture', e.target.value)} className="input text-sm" placeholder="例: 千葉（全国は空欄）" />
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
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
          {saving ? '追加中...' : '追加する'}
        </button>
        <button type="button" onClick={onSaved} className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">キャンセル</button>
      </div>
    </form>
  )
}
