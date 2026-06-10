'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Send, CheckCircle2, Clock, FileText, Search,
  ChevronRight, X, Edit2, Trash2, Eye, RefreshCw,
} from 'lucide-react'

// ---- Types ----------------------------------------------------------------

type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled'

interface ContractListItem {
  id: string
  title: string
  status: ContractStatus
  sent_at: string | null
  signed_at: string | null
  sign_token: string
  valid_from: string | null
  valid_until: string | null
  created_at: string
  employee: {
    id: string
    employee_number: string | null
    staff: { name: string; clinic: { name: string } | null } | null
  } | null
  template: { title: string; department: string; contract_type: string } | null
}

interface ContractDetail extends ContractListItem {
  content: string
  signer_name: string | null
  signer_ip: string | null
  variables_used: Record<string, string> | null
  notes: string | null
}

interface ContractTemplate {
  id: string
  department: string
  contract_type: string
  title: string
  content: string
  variables: Array<{ key: string; label: string; default: string }>
  is_active: boolean
}

interface PayrollEmployee {
  id: string
  employee_number: string | null
  staff: { name: string; clinic: { name: string } | null } | null
}

// ---- Helpers ---------------------------------------------------------------

const STATUS_TABS: { key: ContractStatus | 'all'; label: string }[] = [
  { key: 'all',       label: 'すべて' },
  { key: 'draft',     label: '下書き' },
  { key: 'sent',      label: '送付済' },
  { key: 'signed',    label: '署名済' },
]

const statusStyle: Record<ContractStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-amber-100 text-amber-700',
  signed:    'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

const statusLabel: Record<ContractStatus, string> = {
  draft:     '下書き',
  sent:      '送付済',
  signed:    '署名済',
  cancelled: 'キャンセル',
}

function getEmpName(emp: ContractListItem['employee']) {
  if (!emp) return '不明'
  const s = Array.isArray(emp.staff) ? emp.staff[0] : emp.staff
  return s?.name ?? '氏名未設定'
}

function getClinicName(emp: ContractListItem['employee']) {
  if (!emp) return ''
  const s = Array.isArray(emp.staff) ? emp.staff[0] : emp.staff
  const c = Array.isArray(s?.clinic) ? s?.clinic[0] : s?.clinic
  return (c as { name?: string } | null)?.name ?? ''
}

// ---- Main Page -------------------------------------------------------------

export default function ContractsPage() {
  const [tab, setTab]                   = useState<ContractStatus | 'all'>('all')
  const [contracts, setContracts]       = useState<ContractListItem[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [detail, setDetail]             = useState<ContractDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showCreate, setShowCreate]     = useState(false)
  const [showTmplEditor, setShowTmplEditor] = useState(false)
  const [sending, setSending]           = useState(false)
  const [sendMsg, setSendMsg]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = tab === 'all'
        ? '/api/payroll/contracts'
        : `/api/payroll/contracts?status=${tab}`
      const res = await fetch(url)
      const data = await res.json()
      setContracts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await fetch(`/api/payroll/contracts/${id}`)
      const data = await res.json()
      setDetail(data)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId, loadDetail])

  const filtered = contracts.filter(c => {
    const name = getEmpName(c.employee)
    const clinic = getClinicName(c.employee)
    const q = search.toLowerCase()
    return (
      name.includes(search) ||
      clinic.includes(search) ||
      c.title.includes(search) ||
      (c.employee?.employee_number ?? '').includes(q)
    )
  })

  async function handleSend() {
    if (!selectedId || !detail) return
    setSending(true)
    setSendMsg('')
    try {
      const res = await fetch(`/api/payroll/contracts/${selectedId}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラー')
      setSendMsg('送信しました')
      await load()
      await loadDetail(selectedId)
    } catch (e) {
      setSendMsg(`エラー: ${(e as Error).message}`)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm('この契約書を削除しますか？')) return
    await fetch(`/api/payroll/contracts/${selectedId}`, { method: 'DELETE' })
    setSelectedId(null)
    await load()
  }

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* ---- 左: 一覧パネル ---- */}
      <div className="flex flex-col w-80 flex-shrink-0 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-green-900 text-sm">労務・契約管理</h2>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowTmplEditor(true)}
              className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              テンプレート
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-green-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-green-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              新規作成
            </button>
          </div>
        </div>

        {/* 検索 */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="氏名・院名で検索"
            className="w-full pl-8 pr-3 py-2 border border-green-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>

        {/* ステータスタブ */}
        <div className="flex gap-0 border-b border-gray-200 mb-2">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-green-700 text-green-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 一覧 */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">契約書がありません</p>
          ) : (
            filtered.map(c => (
              <ContractCard
                key={c.id}
                contract={c}
                active={c.id === selectedId}
                onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ---- 右: 詳細パネル ---- */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {!selectedId ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            <div className="text-center space-y-2">
              <FileText className="w-10 h-10 mx-auto text-gray-300" />
              <p>左の一覧から契約書を選択してください</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
          </div>
        ) : detail ? (
          <DetailPanel
            detail={detail}
            sending={sending}
            sendMsg={sendMsg}
            onSend={handleSend}
            onDelete={handleDelete}
            onRefresh={() => loadDetail(selectedId)}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>

      {/* ---- モーダル: 新規作成 ---- */}
      {showCreate && (
        <CreateContractModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}

      {/* ---- モーダル: テンプレート編集 ---- */}
      {showTmplEditor && (
        <TemplateEditorModal onClose={() => setShowTmplEditor(false)} />
      )}
    </div>
  )
}

// ---- Contract List Card ----------------------------------------------------

function ContractCard({
  contract, active, onClick,
}: {
  contract: ContractListItem
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        active
          ? 'border-green-400 bg-green-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-green-200'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-medium text-gray-900 text-xs truncate">{getEmpName(contract.employee)}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${statusStyle[contract.status]}`}>
              {statusLabel[contract.status]}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 truncate mb-0.5">{contract.title}</p>
          <p className="text-[10px] text-gray-400">{getClinicName(contract.employee)}</p>
          {contract.sent_at && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              送付: {new Date(contract.sent_at).toLocaleDateString('ja-JP')}
            </p>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" />
      </div>
    </button>
  )
}

// ---- Detail Panel ----------------------------------------------------------

function DetailPanel({
  detail, sending, sendMsg, onSend, onDelete, onRefresh, onClose,
}: {
  detail: ContractDetail
  sending: boolean
  sendMsg: string
  onSend: () => void
  onDelete: () => void
  onRefresh: () => void
  onClose: () => void
}) {
  const [previewMode, setPreviewMode] = useState<'preview' | 'source'>('preview')

  const canSend = detail.status === 'draft' || detail.status === 'sent'

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusStyle[detail.status]}`}>
              {statusLabel[detail.status]}
            </span>
            {detail.template && (
              <span className="text-xs text-gray-400">
                {detail.template.department} / {detail.template.contract_type}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{detail.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {getEmpName(detail.employee)}
            {getClinicName(detail.employee) && ` （${getClinicName(detail.employee)}）`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
          <button onClick={onRefresh} className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ステータス情報 */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>作成: {new Date(detail.created_at).toLocaleDateString('ja-JP')}</span>
        {detail.sent_at && <span>送付: {new Date(detail.sent_at).toLocaleDateString('ja-JP')}</span>}
        {detail.signed_at && (
          <span className="text-green-700 font-medium">
            署名: {new Date(detail.signed_at).toLocaleDateString('ja-JP')} ({detail.signer_name})
          </span>
        )}
        {detail.valid_from && (
          <span>有効期間: {detail.valid_from} 〜 {detail.valid_until ?? ''}</span>
        )}
      </div>

      {/* アクションバー */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        {canSend && (
          <button
            onClick={onSend}
            disabled={sending}
            className="flex items-center gap-1.5 bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {detail.status === 'sent' ? '再送信' : 'メール送信'}
          </button>
        )}
        {detail.status === 'draft' && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            削除
          </button>
        )}
        {detail.status === 'signed' && (
          <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            署名完了
          </div>
        )}
        {detail.status === 'sent' && (
          <div className="flex items-center gap-1.5 text-amber-600 text-xs">
            <Clock className="w-3.5 h-3.5" />
            署名待ち
          </div>
        )}

        {sendMsg && (
          <span className={`text-xs ml-auto ${sendMsg.startsWith('エラー') ? 'text-red-600' : 'text-green-600'}`}>
            {sendMsg}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setPreviewMode('preview')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
              previewMode === 'preview' ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-3 h-3" />
            プレビュー
          </button>
          <button
            onClick={() => setPreviewMode('source')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
              previewMode === 'source' ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-3 h-3" />
            ソース
          </button>
        </div>
      </div>

      {/* 契約書本文 */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {previewMode === 'preview' ? (
          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: detail.content }}
          />
        ) : (
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
            {detail.content}
          </pre>
        )}
      </div>

      {/* 署名リンク */}
      {(detail.status === 'sent' || detail.status === 'signed') && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-[10px] text-gray-400 mb-1">署名URL</p>
          <a
            href={`/sign/${detail.sign_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-700 hover:underline break-all"
          >
            {`${typeof window !== 'undefined' ? window.location.origin : ''}/sign/${detail.sign_token}`}
          </a>
        </div>
      )}
    </div>
  )
}

// ---- Create Contract Modal -------------------------------------------------

function CreateContractModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep]                 = useState<'select' | 'variables'>('select')
  const [templates, setTemplates]       = useState<ContractTemplate[]>([])
  const [employees, setEmployees]       = useState<PayrollEmployee[]>([])
  const [selectedTmpl, setSelectedTmpl] = useState<ContractTemplate | null>(null)
  const [selectedEmp, setSelectedEmp]   = useState<string>('')
  const [variables, setVariables]       = useState<Record<string, string>>({})
  const [validFrom, setValidFrom]       = useState('')
  const [validUntil, setValidUntil]     = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')
  const [empSearch, setEmpSearch]       = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/payroll/contracts/templates').then(r => r.json()),
      fetch('/api/payroll/employees?active=true').then(r => r.json()),
    ]).then(([tmpl, emp]) => {
      setTemplates(Array.isArray(tmpl) ? tmpl : [])
      setEmployees(Array.isArray(emp) ? emp : [])
    })
  }, [])

  function selectTemplate(t: ContractTemplate) {
    setSelectedTmpl(t)
    const defaults: Record<string, string> = {}
    for (const v of t.variables) defaults[v.key] = v.default
    setVariables(defaults)
    setStep('variables')
  }

  async function handleCreate() {
    if (!selectedTmpl || !selectedEmp) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/payroll/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payroll_employee_id: selectedEmp,
          template_id: selectedTmpl.id,
          variables,
          valid_from: validFrom || undefined,
          valid_until: validUntil || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラー')
      onCreated()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredEmps = employees.filter(e => {
    const s = Array.isArray(e.staff) ? e.staff[0] : e.staff
    const name = s?.name ?? ''
    return name.includes(empSearch) || (e.employee_number ?? '').includes(empSearch)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            {step === 'select' ? '契約書テンプレートを選択' : '変数を入力'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'select' ? (
            <div className="space-y-4">
              {/* テンプレート選択 */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">テンプレートを選択</p>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectTemplate(t)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedTmpl?.id === t.id
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-900 mb-1">{t.department}</p>
                      <p className="text-[10px] text-gray-500">{t.contract_type}</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{t.title}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 従業員選択 */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">従業員を選択</p>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    placeholder="氏名・社員番号"
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredEmps.map(e => {
                    const s = Array.isArray(e.staff) ? e.staff[0] : e.staff
                    const c = Array.isArray(s?.clinic) ? s?.clinic[0] : s?.clinic
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEmp(e.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                          selectedEmp === e.id
                            ? 'border-green-400 bg-green-50 text-green-900'
                            : 'border-gray-100 hover:border-green-200 text-gray-700'
                        }`}
                      >
                        <span className="font-medium">{s?.name ?? '氏名未設定'}</span>
                        <span className="text-gray-400 ml-2">{(c as { name?: string } | null)?.name ?? ''}</span>
                        {e.employee_number && <span className="text-gray-400 ml-2">#{e.employee_number}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 選択情報サマリー */}
              <div className="bg-green-50 rounded-lg px-4 py-3 text-xs">
                <p className="font-medium text-green-900">{selectedTmpl?.title}</p>
                <p className="text-green-700 mt-0.5">
                  {employees.find(e => e.id === selectedEmp)
                    ? (() => {
                        const e = employees.find(emp => emp.id === selectedEmp)!
                        const s = Array.isArray(e.staff) ? e.staff[0] : e.staff
                        return s?.name ?? ''
                      })()
                    : ''}
                </p>
              </div>

              {/* 変数フォーム */}
              {selectedTmpl?.variables.map(v => (
                <div key={v.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {v.label}
                  </label>
                  <input
                    type="text"
                    value={variables[v.key] ?? ''}
                    onChange={e => setVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                    placeholder={v.default || v.label}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}

              {/* 有効期間 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">有効開始日（任意）</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={e => setValidFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">有効終了日（任意）</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="px-6 py-2 text-red-600 text-xs">{error}</p>}

        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
          {step === 'variables' && (
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors ml-auto"
          >
            キャンセル
          </button>
          {step === 'select' ? (
            <button
              onClick={() => selectedTmpl && selectedEmp && setStep('variables')}
              disabled={!selectedTmpl || !selectedEmp}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-40 transition-colors"
            >
              次へ
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-40 transition-colors"
            >
              {submitting ? '作成中...' : '契約書を作成'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Template Editor Modal -------------------------------------------------

function TemplateEditorModal({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates]   = useState<ContractTemplate[]>([])
  const [selected, setSelected]     = useState<ContractTemplate | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState('')

  useEffect(() => {
    fetch('/api/payroll/contracts/templates')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setTemplates(list)
        if (list.length > 0) {
          setSelected(list[0])
          setEditContent(list[0].content)
        }
      })
  }, [])

  function selectTmpl(t: ContractTemplate) {
    setSelected(t)
    setEditContent(t.content)
    setMsg('')
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/payroll/contracts/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, content: editContent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラー')
      setTemplates(prev => prev.map(t => t.id === selected.id ? { ...t, content: editContent } : t))
      setMsg('保存しました')
    } catch (e) {
      setMsg(`エラー: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">契約書テンプレート編集</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* テンプレート一覧 */}
          <div className="w-52 flex-shrink-0 border-r border-gray-100 overflow-y-auto p-3 space-y-1">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => selectTmpl(t)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                  selected?.id === t.id
                    ? 'bg-green-50 text-green-900 font-medium border border-green-200'
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <p className="font-medium">{t.department} / {t.contract_type}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{t.title}</p>
              </button>
            ))}
          </div>

          {/* エディタ */}
          <div className="flex-1 flex flex-col min-w-0 p-4">
            {selected && (
              <>
                <p className="text-xs text-gray-400 mb-2">
                  HTMLテンプレートを編集できます。{'{{変数名}}'} の形式で変数を埋め込みます。
                </p>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  spellCheck={false}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
          {msg && (
            <span className={`text-xs ${msg.startsWith('エラー') ? 'text-red-600' : 'text-green-600'}`}>
              {msg}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              閉じる
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selected}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-40 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
