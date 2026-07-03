'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PermissionGuard } from '@/components/common/PermissionGuard'
import { useClinicStore } from '@/lib/clinic-store'
import { reportStore } from '@/lib/report-store'
import { generateMonthlyReport } from '@/lib/ai-report-generator'
import { cn } from '@/lib/utils'
import {
  ACTION_PRIORITY_LABELS,
  ACTION_STATUS_LABELS,
} from '@/types/report'
import type { MonthlyReport } from '@/types/report'
import { toast } from 'sonner'

type GeneratedReport = Omit<MonthlyReport, 'id' | 'createdAt' | 'updatedAt'>

function formatMonth(month: string): string {
  try {
    return format(parseISO(`${month}-01`), 'yyyy年M月', { locale: ja })
  } catch {
    return month
  }
}

export default function MeetingAIPage() {
  const router = useRouter()
  const store = useClinicStore()

  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [clinicId, setClinicId] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<GeneratedReport | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    setPreview(null)
    setSaved(false)
    const clinic = store.clinics.find((c) => c.id === clinicId)
    const result = generateMonthlyReport(
      month,
      clinicId,
      clinicId === 'all' ? '全院' : (clinic?.name ?? ''),
      store.reservations,
      store.staff,
      store.clinics,
    )
    setPreview(result)
    setGenerating(false)
  }

  function handleSave() {
    if (!preview) return
    reportStore.create(preview)
    setSaved(true)
    toast.success('レポートを保存しました')
    router.push('/admin/reports/monthly')
  }

  return (
    <PermissionGuard allowedRoles={['admin']}>
      <div className="p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="page-title">経営会議AI</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            月次経営レポートを自動生成します
          </p>
        </div>

        {/* Configuration panel */}
        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-green-800">レポート設定</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Month selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-green-800" htmlFor="month-input">
                対象月
              </label>
              <input
                id="month-input"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className={cn(
                  'flex h-9 w-full rounded-md border border-green-200 bg-white px-3 py-1 text-sm shadow-sm',
                  'focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400',
                  'text-green-900',
                )}
              />
            </div>

            {/* Clinic selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-green-800" htmlFor="clinic-select">
                対象院
              </label>
              <select
                id="clinic-select"
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className={cn(
                  'flex h-9 w-full rounded-md border border-green-200 bg-white px-3 py-1 text-sm shadow-sm',
                  'focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400',
                  'text-green-900',
                )}
              >
                <option value="all">全院</option>
                {store.clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || store.loading}
            className="bg-green-700 hover:bg-green-800 text-white gap-2"
          >
            {generating ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              'レポート生成'
            )}
          </Button>

          {store.loading && (
            <p className="text-xs text-muted-foreground">データ読み込み中...</p>
          )}
        </div>

        {/* Loading state */}
        {generating && (
          <div className="bg-green-50 rounded-xl border border-green-100 p-8 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <p className="text-sm text-green-700 font-medium">
              {formatMonth(month)} のレポートを生成しています...
            </p>
            <p className="text-xs text-green-500">データを分析しています。しばらくお待ちください。</p>
          </div>
        )}

        {/* Preview panel */}
        {preview && !generating && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-base font-bold text-green-900">{preview.title}</h2>
              </div>
              <p className="text-sm text-green-800 leading-relaxed">{preview.summary}</p>

              {/* KPI chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {preview.kpiSnapshot.sales !== undefined && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center min-w-[90px]">
                    <p className="text-xs text-muted-foreground">売上</p>
                    <p className="text-sm font-bold text-green-900">
                      ¥{preview.kpiSnapshot.sales.toLocaleString()}
                    </p>
                  </div>
                )}
                {preview.kpiSnapshot.visits !== undefined && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center min-w-[80px]">
                    <p className="text-xs text-muted-foreground">来院数</p>
                    <p className="text-sm font-bold text-green-900">
                      {preview.kpiSnapshot.visits}名
                    </p>
                  </div>
                )}
                {preview.kpiSnapshot.newPatients !== undefined && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center min-w-[80px]">
                    <p className="text-xs text-muted-foreground">新患数</p>
                    <p className="text-sm font-bold text-green-900">
                      {preview.kpiSnapshot.newPatients}名
                    </p>
                  </div>
                )}
                {preview.kpiSnapshot.repeatRate !== undefined && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center min-w-[80px]">
                    <p className="text-xs text-muted-foreground">再診率</p>
                    <p className="text-sm font-bold text-green-900">
                      {preview.kpiSnapshot.repeatRate}%
                    </p>
                  </div>
                )}
                {preview.kpiSnapshot.cancellationRate !== undefined && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center min-w-[100px]">
                    <p className="text-xs text-muted-foreground">キャンセル率</p>
                    <p className="text-sm font-bold text-green-900">
                      {preview.kpiSnapshot.cancellationRate}%
                    </p>
                  </div>
                )}
                {preview.kpiSnapshot.averageSpend !== undefined && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center min-w-[90px]">
                    <p className="text-xs text-muted-foreground">平均単価</p>
                    <p className="text-sm font-bold text-green-900">
                      ¥{preview.kpiSnapshot.averageSpend.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Issues */}
            {preview.issues.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-green-800">課題</h2>
                <div className="space-y-1.5">
                  {preview.issues.map((issue, i) => (
                    <div
                      key={i}
                      className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800"
                    >
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section tabs */}
            {preview.sections.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-green-800 mb-2">AI分析レポート</h2>
                <Tabs defaultValue={preview.sections[0]?.id}>
                  <TabsList className="flex flex-wrap h-auto gap-1 bg-green-50 p-1 mb-3">
                    {preview.sections.map((section) => (
                      <TabsTrigger
                        key={section.id}
                        value={section.id}
                        className="text-xs px-2 py-1 data-[state=active]:bg-green-700 data-[state=active]:text-white"
                      >
                        {section.title.replace(/^\d+\.\s*/, '')}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {preview.sections.map((section) => (
                    <TabsContent key={section.id} value={section.id}>
                      <div className="bg-white rounded-xl border border-green-100 p-4">
                        <h3 className="text-sm font-semibold text-green-900 mb-3">
                          {section.title}
                        </h3>
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-green-900">
                          {section.content}
                        </pre>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {/* Action plans preview */}
            {preview.actionPlans.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-green-800 mb-2">アクションプラン</h2>
                <div className="bg-white rounded-xl border border-green-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-green-50 border-b border-green-100">
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">
                            カテゴリ
                          </th>
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">
                            アクション
                          </th>
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">
                            担当
                          </th>
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">
                            優先度
                          </th>
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-green-800">
                            状況
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.actionPlans.map((plan) => (
                          <tr key={plan.id} className="border-b border-green-50 last:border-0">
                            <td className="px-3 py-2.5">
                              <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                                {plan.category}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-green-900 max-w-xs">{plan.action}</td>
                            <td className="px-3 py-2.5 text-green-800 whitespace-nowrap">
                              {plan.owner}
                            </td>
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
                              <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                                {ACTION_STATUS_LABELS[plan.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Save panel */}
            <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-green-800 mb-3">レポートを保存</h2>
              <p className="text-xs text-muted-foreground mb-4">
                保存したレポートは「月次レポート一覧」から確認できます。会議メモや決定事項を追記することもできます。
              </p>
              {saved ? (
                <div className="inline-flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  保存済み
                </div>
              ) : (
                <Button
                  onClick={handleSave}
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  このレポートを保存
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
