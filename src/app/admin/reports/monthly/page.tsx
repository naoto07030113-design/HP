'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/common/PermissionGuard'
import { reportStore } from '@/lib/report-store'
import { cn } from '@/lib/utils'
import {
  ACTION_STATUS_LABELS,
} from '@/types/report'
import type { MonthlyReport } from '@/types/report'
import { FileText, Plus, Trash2, ChevronRight, AlertTriangle, TrendingUp } from 'lucide-react'

function formatMonth(month: string): string {
  try {
    return format(parseISO(`${month}-01`), 'yyyy年M月', { locale: ja })
  } catch {
    return month
  }
}

function formatCreatedAt(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy年M月d日', { locale: ja })
  } catch {
    return iso
  }
}

function pendingCount(report: MonthlyReport): number {
  return report.actionPlans.filter((p) => p.status === 'pending').length
}

export default function MonthlyReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    setReports(reportStore.getAll())
  }, [])

  function handleDelete(id: string) {
    reportStore.delete(id)
    setReports(reportStore.getAll())
    setDeleteTarget(null)
  }

  const totalPending = reports.reduce((sum, r) => sum + pendingCount(r), 0)
  const latestMonth = reports[0]?.month ?? null

  return (
    <PermissionGuard allowedRoles={['admin']}>
      <div className="p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">月次レポート一覧</h1>
            <p className="text-sm text-muted-foreground mt-0.5">生成済みの月次経営レポートを管理します</p>
          </div>
          <Link href="/admin/reports/meeting-ai">
            <Button size="sm" className="gap-1.5 bg-green-700 hover:bg-green-800 text-white">
              <Plus className="w-4 h-4" />
              新規レポート生成
            </Button>
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
            <p className="text-xs text-muted-foreground">総レポート数</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{reports.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
            <p className="text-xs text-muted-foreground">最新月</p>
            <p className="text-xl font-bold text-green-900 mt-1">
              {latestMonth ? formatMonth(latestMonth) : '-'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
            <p className="text-xs text-muted-foreground">未着手アクション合計</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{totalPending}</p>
          </div>
        </div>

        {/* Report list */}
        {reports.length === 0 ? (
          <div className="bg-green-50 rounded-xl border border-green-100 p-10 text-center space-y-3">
            <FileText className="w-10 h-10 text-green-300 mx-auto" />
            <p className="text-green-800 font-medium">レポートがまだありません</p>
            <p className="text-sm text-green-600">経営会議AIでレポートを生成してください</p>
            <Link href="/admin/reports/meeting-ai">
              <Button size="sm" className="mt-2 bg-green-700 hover:bg-green-800 text-white gap-1.5">
                <Plus className="w-4 h-4" />
                経営会議AIへ
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const pending = pendingCount(report)
              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-green-100 shadow-sm p-4 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-bold text-green-900">
                          {formatMonth(report.month)}
                        </span>
                        <span className="text-sm text-muted-foreground">{report.clinicName}</span>
                      </div>

                      {/* KPI chips */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {report.kpiSnapshot.sales !== undefined && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-800 border border-green-200 rounded-full px-2 py-0.5">
                            <TrendingUp className="w-3 h-3" />
                            売上 ¥{report.kpiSnapshot.sales.toLocaleString()}
                          </span>
                        )}
                        {report.kpiSnapshot.visits !== undefined && (
                          <span className="inline-flex items-center text-xs bg-green-50 text-green-800 border border-green-200 rounded-full px-2 py-0.5">
                            来院数 {report.kpiSnapshot.visits}名
                          </span>
                        )}
                        {report.kpiSnapshot.repeatRate !== undefined && (
                          <span className="inline-flex items-center text-xs bg-green-50 text-green-800 border border-green-200 rounded-full px-2 py-0.5">
                            再診率 {report.kpiSnapshot.repeatRate}%
                          </span>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {report.issues.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            課題 {report.issues.length}件
                          </span>
                        )}
                        {pending > 0 && (
                          <span className="inline-flex items-center text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                            {ACTION_STATUS_LABELS.pending} {pending}件
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          生成日: {formatCreatedAt(report.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(report.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Link href={`/admin/reports/monthly/${report.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-green-200 text-green-800 hover:bg-green-50"
                        >
                          詳細を見る
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full space-y-4">
              <h2 className="text-base font-semibold text-green-900">レポートを削除しますか?</h2>
              <p className="text-sm text-muted-foreground">この操作は取り消せません。</p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(null)}
                >
                  キャンセル
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDelete(deleteTarget)}
                >
                  削除する
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
