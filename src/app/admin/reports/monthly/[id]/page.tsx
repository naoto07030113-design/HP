'use client'

import { use, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { reportStore, hydrateReportStore } from '@/lib/report-store'
import { cn } from '@/lib/utils'
import {
  ACTION_PRIORITY_LABELS,
  ACTION_STATUS_LABELS,
  ACTION_STATUS_COLORS,
} from '@/types/report'
import type { MonthlyReport } from '@/types/report'
import { ArrowLeft, Printer, AlertTriangle, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'

const KPI_LABELS: Record<string, string> = {
  sales: '売上',
  visits: '来院数',
  newPatients: '新患数',
  repeatRate: '再診率',
  cancellationRate: 'キャンセル率',
  averageSpend: '平均単価',
}

const KPI_ORDER = ['sales', 'visits', 'newPatients', 'repeatRate', 'cancellationRate', 'averageSpend']

function formatKpiValue(key: string, value: number): string {
  if (key === 'sales' || key === 'averageSpend') {
    return '¥' + value.toLocaleString()
  }
  if (key === 'repeatRate' || key === 'cancellationRate') {
    return value + '%'
  }
  return value.toLocaleString()
}

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy年M月d日 HH:mm', { locale: ja })
  } catch {
    return iso
  }
}

function handlePDF(report: MonthlyReport) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title}</title>
<style>
@page { size: A4; margin: 20mm; }
body { font-family: 'Noto Sans JP', sans-serif; font-size: 12px; color: #1a1a1a; }
h1 { font-size: 20px; color: #14532d; border-bottom: 2px solid #14532d; padding-bottom: 8px; }
h2 { font-size: 14px; color: #166534; margin-top: 20px; }
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
.kpi-card { border: 1px solid #d1fae5; padding: 12px; border-radius: 8px; }
.kpi-label { font-size: 10px; color: #6b7280; }
.kpi-value { font-size: 18px; font-weight: bold; color: #14532d; }
.issue { background: #fef3c7; border: 1px solid #fcd34d; padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 11px; }
pre { white-space: pre-wrap; font-family: inherit; font-size: 11px; line-height: 1.7; }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th { background: #f0fdf4; padding: 6px 8px; text-align: left; border: 1px solid #d1fae5; }
td { padding: 6px 8px; border: 1px solid #e5e7eb; }
</style></head><body>
<h1>${report.title}</h1>
<p style="color:#6b7280;font-size:11px;">生成日: ${new Date(report.createdAt).toLocaleDateString('ja-JP')}</p>
<div class="kpi-grid">
${Object.entries(report.kpiSnapshot).slice(0, 6).map(([k, v]) => `<div class="kpi-card"><div class="kpi-label">${k}</div><div class="kpi-value">${typeof v === 'number' && k.includes('sales') ? '¥' + v.toLocaleString() : v}</div></div>`).join('')}
</div>
${report.issues.length > 0 ? `<h2>課題</h2>${report.issues.map((i) => `<div class="issue">${i}</div>`).join('')}` : ''}
${report.sections.map((s) => `<h2>${s.title}</h2><pre>${s.content}</pre>`).join('')}
${report.actionPlans.length > 0 ? `<h2>アクションプラン</h2><table><tr><th>カテゴリ</th><th>アクション</th><th>担当</th><th>優先度</th><th>状況</th></tr>${report.actionPlans.map((p) => `<tr><td>${p.category}</td><td>${p.action}</td><td>${p.owner}</td><td>${p.priority}</td><td>${p.status}</td></tr>`).join('')}</table>` : ''}
${report.meetingNotes ? `<h2>会議メモ</h2><pre>${report.meetingNotes}</pre>` : ''}
${report.decisions.length > 0 ? `<h2>決定事項</h2>${report.decisions.map((d, i) => `<p>${i + 1}. ${d}</p>`).join('')}` : ''}
</body></html>`
  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
    w.print()
  }
}

export default function MonthlyReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [meetingNotes, setMeetingNotes] = useState('')
  const [newDecision, setNewDecision] = useState('')
  const notesRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    hydrateReportStore().then(() => {
      const r = reportStore.getById(id)
      setReport(r)
      setMeetingNotes(r?.meetingNotes ?? '')
    })
  }, [id])

  function refresh() {
    const r = reportStore.getById(id)
    setReport(r)
    setMeetingNotes(r?.meetingNotes ?? '')
  }

  function handleStatusChange(planId: string, status: MonthlyReport['actionPlans'][number]['status']) {
    if (!report) return
    reportStore.updateActionPlan(report.id, planId, status)
    refresh()
  }

  function handleNotesBlur() {
    if (!report) return
    reportStore.updateMeetingNotes(report.id, meetingNotes)
    toast.success('会議メモを保存しました')
    refresh()
  }

  function handleAddDecision() {
    if (!report || !newDecision.trim()) return
    reportStore.addDecision(report.id, newDecision.trim())
    setNewDecision('')
    refresh()
  }

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">レポートが見つかりません</p>
        <Link href="/admin/reports/monthly">
          <Button variant="outline" size="sm">一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/admin/reports/monthly"
            className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            月次レポート一覧
          </Link>
          <h1 className="page-title">{report.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            生成日: {formatDate(report.createdAt)}
            {report.updatedAt !== report.createdAt && (
              <span className="ml-2">更新: {formatDate(report.updatedAt)}</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-green-200 text-green-800 hover:bg-green-50"
          onClick={() => handlePDF(report)}
        >
          <Printer className="w-4 h-4" />
          PDF出力
        </Button>
      </div>

      {/* KPI Snapshot */}
      <div>
        <h2 className="text-sm font-semibold text-green-800 mb-2">KPIスナップショット</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {KPI_ORDER.map((key) => {
            const value = report.kpiSnapshot[key]
            if (value === undefined) return null
            return (
              <div
                key={key}
                className="bg-white rounded-xl border border-green-100 shadow-sm p-3"
              >
                <p className="text-xs text-muted-foreground">{KPI_LABELS[key] ?? key}</p>
                <p className="text-lg font-bold text-green-900 mt-1">
                  {formatKpiValue(key, value)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Issues */}
      {report.issues.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-green-800 mb-2">課題</h2>
          <div className="space-y-1.5">
            {report.issues.map((issue, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                {issue}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis sections (tabs) */}
      <div>
        <h2 className="text-sm font-semibold text-green-800 mb-2">AI分析レポート</h2>
        {report.sections.length > 0 ? (
          <Tabs defaultValue={report.sections[0]?.id}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-green-50 p-1 mb-3">
              {report.sections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="text-xs px-2 py-1 data-[state=active]:bg-green-700 data-[state=active]:text-white"
                >
                  {section.title.replace(/^\d+\.\s*/, '')}
                </TabsTrigger>
              ))}
            </TabsList>
            {report.sections.map((section) => (
              <TabsContent key={section.id} value={section.id}>
                <div className="bg-white rounded-xl border border-green-100 p-4">
                  <h3 className="text-sm font-semibold text-green-900 mb-3">{section.title}</h3>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-green-900">
                    {section.content}
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground">セクションデータがありません</p>
        )}
      </div>

      {/* Action Plans */}
      <div>
        <h2 className="text-sm font-semibold text-green-800 mb-2">アクションプラン</h2>
        {report.actionPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">アクションプランはありません</p>
        ) : (
          <div className="bg-white rounded-xl border border-green-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100">
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">カテゴリ</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">アクション</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">担当</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">優先度</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">状況</th>
                  </tr>
                </thead>
                <tbody>
                  {report.actionPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-green-50 last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                          {plan.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-green-900 max-w-xs">{plan.action}</td>
                      <td className="px-3 py-2.5 text-green-800 whitespace-nowrap">{plan.owner}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'text-xs rounded-full px-2 py-0.5 font-medium',
                            plan.priority === 'high'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : plan.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-50 text-gray-600 border border-gray-200',
                          )}
                        >
                          {ACTION_PRIORITY_LABELS[plan.priority]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Select
                          value={plan.status}
                          onValueChange={(v) =>
                            handleStatusChange(
                              plan.id,
                              v as MonthlyReport['actionPlans'][number]['status'],
                            )
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              'h-7 text-xs w-28',
                              ACTION_STATUS_COLORS[plan.status],
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ACTION_STATUS_LABELS) as Array<keyof typeof ACTION_STATUS_LABELS>).map(
                              (s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {ACTION_STATUS_LABELS[s]}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Notes */}
      <div>
        <h2 className="text-sm font-semibold text-green-800 mb-2">経営会議ノート</h2>
        <div className="bg-white rounded-xl border border-green-100 p-4 space-y-2">
          <Textarea
            ref={notesRef}
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="会議でのメモを入力してください（フォーカスを外すと自動保存されます）"
            className="min-h-[120px] text-sm border-green-100 focus:border-green-400 resize-none"
          />
          <p className="text-xs text-muted-foreground">
            最終更新: {formatDate(report.updatedAt)}
          </p>
        </div>
      </div>

      {/* Decisions */}
      <div>
        <h2 className="text-sm font-semibold text-green-800 mb-2">決定事項</h2>
        <div className="bg-white rounded-xl border border-green-100 p-4 space-y-3">
          {report.decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">決定事項はまだありません</p>
          ) : (
            <ol className="space-y-1.5">
              {report.decisions.map((decision, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  {decision}
                </li>
              ))}
            </ol>
          )}
          <div className="flex gap-2 pt-1">
            <Input
              value={newDecision}
              onChange={(e) => setNewDecision(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddDecision()
              }}
              placeholder="新しい決定事項を入力"
              className="text-sm border-green-100 focus:border-green-400 flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddDecision}
              disabled={!newDecision.trim()}
              className="bg-green-700 hover:bg-green-800 text-white gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              追加
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
