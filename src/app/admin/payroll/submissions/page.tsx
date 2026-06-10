'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Upload, FileText, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, Loader2, Link2,
} from 'lucide-react'
import type { PayrollSubmission, SubmissionItem } from '@/types/payroll'
import { toast } from 'sonner'

const DEPARTMENTS = ['リハビリ', '本院', 'SANRI', 'ストレッチ', 'HaRina']

export default function SubmissionsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [submissions, setSubmissions] = useState<PayrollSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  // フォーム
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll/submissions?year=${year}&month=${month}`)
      const data = await res.json()
      setSubmissions(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    const manualText = textRef.current?.value?.trim()

    if (!file && !manualText) {
      toast.error('PDFファイルまたはテキストを入力してください')
      return
    }

    setUploading(true)
    try {
      let rawText = manualText ?? ''

      // PDFファイルの場合: サーバー側でpdftotext処理
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        const parseRes = await fetch('/api/payroll/submissions/parse-pdf', { method: 'POST', body: fd })
        if (parseRes.ok) {
          const { text } = await parseRes.json()
          rawText = text
        } else {
          toast.warning('PDFの自動解析に失敗しました。テキストを貼り付けて再試行してください。')
          return
        }
      }

      const fd = new FormData()
      fd.append('raw_text', rawText)
      fd.append('year', String(year))
      fd.append('month', String(month))
      fd.append('department', department)

      const res = await fetch('/api/payroll/submissions', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      toast.success('申請書をAI解析しました')
      if (data.discrepancies?.length > 0) {
        toast.warning(`${data.discrepancies.length}件の不整合があります。確認してください。`)
      }
      load()
      if (fileRef.current) fileRef.current.value = ''
      if (textRef.current) textRef.current.value = ''
    } catch (e) {
      toast.error(`エラー: ${e}`)
    } finally {
      setUploading(false)
    }
  }

  function statusIcon(status: string) {
    switch (status) {
      case 'validated': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'parsed': return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
    }
  }

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      pending: '処理中',
      parsed: '解析済（要確認）',
      validated: '整合性OK',
      error: 'エラー',
      processed: '給与に反映済',
    }
    return map[status] ?? status
  }

  return (
    <div className="max-w-5xl space-y-5">
      <h2 className="font-semibold text-green-900">PDF申請書取込・AI解析</h2>
      <p className="text-sm text-gray-500">
        各部署から提出された給与申請書（PDF）をアップロードすると、AIが自動解析し、従業員マスタとの整合性をチェックします。
      </p>

      {/* アップロードパネル */}
      <div className="bg-white rounded-xl border border-green-100 p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">年月</label>
            <div className="flex gap-2">
              <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                className="w-20 border border-green-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-400" />
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="flex-1 border border-green-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-400">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">部署</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full border border-green-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-400">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">PDFファイル</label>
            <input ref={fileRef} type="file" accept=".pdf"
              className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-green-100 file:text-green-700 hover:file:bg-green-200 file:text-xs cursor-pointer" />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">
            またはテキストを直接貼り付け（PDFコピペ可）
          </label>
          <textarea
            ref={textRef}
            rows={5}
            placeholder="PDFからコピーしたテキストをここに貼り付けてください..."
            className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 resize-none"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-2 bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />AI解析中...</>
          ) : (
            <><Upload className="w-4 h-4" />AIで解析・取込</>
          )}
        </button>
      </div>

      {/* 取込履歴 */}
      <h3 className="font-semibold text-green-900">取込履歴</h3>

      {loading ? (
        <div className="flex justify-center h-20 items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          まだ申請書がアップロードされていません
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-xl border border-green-100 overflow-hidden">
              {/* ヘッダー */}
              <button
                onClick={() => setExpanded(prev => prev === sub.id ? null : sub.id)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-green-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {statusIcon(sub.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {sub.year}年{sub.month}月 / {sub.department}
                      </span>
                      <span className="text-xs text-gray-400">{statusLabel(sub.status)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {sub.employee_count ? `${sub.employee_count}名` : ''}
                      {sub.created_at ? ` / 取込: ${new Date(sub.created_at).toLocaleString('ja-JP')}` : ''}
                    </p>
                  </div>
                </div>
                {expanded === sub.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {/* 詳細 */}
              {expanded === sub.id && (
                <div className="border-t border-green-100 p-4 space-y-4">
                  {/* 不整合 */}
                  {Array.isArray(sub.discrepancies) && (sub.discrepancies as Array<{ name: string; issue: string }>).length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-orange-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        整合性エラー（{(sub.discrepancies as Array<unknown>).length}件）
                      </p>
                      {(sub.discrepancies as Array<{ name: string; issue: string }>).map((d, i) => (
                        <div key={i} className="text-xs text-orange-700">
                          <span className="font-medium">{d.name}</span>: {d.issue}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 解析済み個人明細 */}
                  {Array.isArray(sub.items) && sub.items.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">解析済み個人明細</p>
                      <div className="space-y-2">
                        {(sub.items as SubmissionItem[]).map(item => (
                          <SubmissionItemRow key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SubmissionItemRow({ item }: { item: SubmissionItem }) {
  const [open, setOpen] = useState(false)
  const items = Array.isArray(item.items) ? item.items : []

  return (
    <div className={`border rounded-lg overflow-hidden ${item.is_validated ? 'border-green-200' : 'border-orange-200'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-3 py-2 flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          {item.is_validated
            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            : <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
          }
          <span className="font-medium">{item.line_number}. {item.employee_name}</span>
          <span className="text-xs text-gray-400">{item.contract_type}</span>
          {item.matched_employee_id && (
            <span title="マスタに紐付け済"><Link2 className="w-3 h-3 text-green-400" /></span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {item.total_amount.toLocaleString()}円
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {item.discrepancy_notes && (
            <p className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">{item.discrepancy_notes}</p>
          )}
          <div className="space-y-1">
            {items.map((line, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-500">{line.category} / {line.description}</span>
                <span className="font-medium tabular-nums">{line.amount.toLocaleString()}円</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
