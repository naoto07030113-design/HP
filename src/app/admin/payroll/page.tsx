'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, FileText, Upload, ShieldAlert, ChevronRight,
  Banknote, Calendar,
} from 'lucide-react'
import { formatCurrency } from '@/lib/payroll-calculator'
import type { PayrollCompliance, PayrollCalculation } from '@/types/payroll'

interface DashboardData {
  activeEmployees: number
  monthlyGross: number
  monthlyNet: number
  draftCount: number
  confirmedCount: number
  paidCount: number
  complianceAlerts: PayrollCompliance[]
  recentCalculations: (PayrollCalculation & {
    employee: { staff: { name: string; clinic: { name: string } } }
  })[]
}

export default function PayrollDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  useEffect(() => {
    async function load() {
      try {
        const [empRes, calcsRes, complianceRes] = await Promise.all([
          fetch('/api/payroll/employees?active=true'),
          fetch(`/api/payroll/slips?year=${year}&month=${month}`),
          fetch('/api/payroll/compliance'),
        ])

        const employees = await empRes.json()
        const calcs: PayrollCalculation[] = await calcsRes.json()
        const compliance: PayrollCompliance[] = await complianceRes.json()

        const activeCalcs = Array.isArray(calcs) ? calcs : []

        setData({
          activeEmployees: Array.isArray(employees) ? employees.length : 0,
          monthlyGross: activeCalcs.reduce((s, c) => s + c.gross_pay, 0),
          monthlyNet: activeCalcs.reduce((s, c) => s + c.net_pay, 0),
          draftCount: activeCalcs.filter(c => c.status === 'draft').length,
          confirmedCount: activeCalcs.filter(c => c.status === 'confirmed').length,
          paidCount: activeCalcs.filter(c => c.status === 'paid').length,
          complianceAlerts: compliance
            .filter(c => !c.is_applied)
            .sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3 }
              return order[a.impact_level] - order[b.impact_level]
            })
            .slice(0, 5),
          recentCalculations: (activeCalcs.slice(0, 5) as (PayrollCalculation & {
            employee: { staff: { name: string; clinic: { name: string } } }
          })[]),
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [year, month])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
      </div>
    )
  }

  const impactBadge = (level: string) => {
    const map = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-blue-100 text-blue-700',
    }
    const labels = { critical: '緊急', high: '高', medium: '中', low: '低' }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[level as keyof typeof map] ?? ''}`}>
        {labels[level as keyof typeof labels] ?? level}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 当月ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-900">{year}年{month}月度 給与処理状況</span>
        </div>
        <Link
          href="/admin/payroll/calculate"
          className="flex items-center gap-1.5 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          給与計算を開始
        </Link>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="在籍従業員"
          value={`${data?.activeEmployees ?? 0}名`}
          bg="bg-blue-50"
          href="/admin/payroll/employees"
        />
        <KpiCard
          icon={<Banknote className="w-5 h-5 text-green-600" />}
          label="当月総支給額"
          value={formatCurrency(data?.monthlyGross ?? 0)}
          bg="bg-green-50"
          href="/admin/payroll/slips"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          label="当月差引支給額"
          value={formatCurrency(data?.monthlyNet ?? 0)}
          bg="bg-emerald-50"
          href="/admin/payroll/slips"
        />
        <KpiCard
          icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
          label="法令対応未完了"
          value={`${data?.complianceAlerts.length ?? 0}件`}
          bg="bg-red-50"
          href="/admin/payroll/compliance"
        />
      </div>

      {/* 給与処理ステータス */}
      <div className="bg-white rounded-xl border border-green-100 p-5">
        <h2 className="font-semibold text-green-900 mb-4">給与処理ステータス（{month}月）</h2>
        <div className="flex gap-4 flex-wrap">
          <StatusBar label="下書き" count={data?.draftCount ?? 0} color="bg-gray-200" total={data?.activeEmployees ?? 1} />
          <StatusBar label="確定" count={data?.confirmedCount ?? 0} color="bg-blue-400" total={data?.activeEmployees ?? 1} />
          <StatusBar label="振込済" count={data?.paidCount ?? 0} color="bg-green-500" total={data?.activeEmployees ?? 1} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* コンプライアンスアラート */}
        <div className="bg-white rounded-xl border border-green-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-green-900">法令・制度変更アラート</h2>
            </div>
            <Link href="/admin/payroll/compliance" className="text-xs text-green-600 hover:underline">
              すべて確認 →
            </Link>
          </div>
          {(data?.complianceAlerts.length ?? 0) === 0 ? (
            <div className="flex items-center gap-2 text-green-600 text-sm py-4">
              <CheckCircle2 className="w-4 h-4" />
              未対応の法令変更はありません
            </div>
          ) : (
            <ul className="space-y-2.5">
              {data?.complianceAlerts.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  {impactBadge(c.impact_level)}
                  <div>
                    <p className="font-medium text-gray-800">{c.law_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.summary}</p>
                    <p className="text-xs text-gray-400 mt-0.5">施行: {c.effective_date}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* クイックアクセス */}
        <div className="bg-white rounded-xl border border-green-100 p-5">
          <h2 className="font-semibold text-green-900 mb-4">クイックアクション</h2>
          <div className="space-y-2">
            <QuickAction
              href="/admin/payroll/submissions"
              icon={<Upload className="w-4 h-4" />}
              label="PDF申請書をアップロード"
              desc="AIが自動解析・整合性チェック"
              color="text-purple-600 bg-purple-50"
            />
            <QuickAction
              href="/admin/payroll/attendance"
              icon={<Clock className="w-4 h-4" />}
              label="勤怠データを入力"
              desc={`${month}月分の出勤情報を登録`}
              color="text-blue-600 bg-blue-50"
            />
            <QuickAction
              href="/admin/payroll/calculate"
              icon={<FileText className="w-4 h-4" />}
              label="給与計算を実行"
              desc="社会保険・税額を自動計算"
              color="text-green-600 bg-green-50"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon, label, value, bg, href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
  href: string
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-green-100 p-4 hover:border-green-300 transition-colors">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </Link>
  )
}

function StatusBar({
  label, count, color, total,
}: {
  label: string
  count: number
  color: string
  total: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{count}名 ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function QuickAction({
  href, icon, label, desc, color,
}: {
  href: string
  icon: React.ReactNode
  label: string
  desc: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
    </Link>
  )
}
