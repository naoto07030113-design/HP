'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Clock, Calculator, FileText,
  Upload, ShieldCheck, Download,
} from 'lucide-react'

const TABS = [
  { href: '/admin/payroll',            label: 'ダッシュボード',  icon: LayoutDashboard, exact: true },
  { href: '/admin/payroll/employees',  label: '従業員管理',      icon: Users },
  { href: '/admin/payroll/attendance', label: '勤怠管理',        icon: Clock },
  { href: '/admin/payroll/calculate',  label: '給与計算',        icon: Calculator },
  { href: '/admin/payroll/slips',      label: '給与明細',        icon: FileText },
  { href: '/admin/payroll/export',     label: '税理士・印刷出力', icon: Download },
  { href: '/admin/payroll/submissions',label: 'PDF申請書取込',   icon: Upload },
  { href: '/admin/payroll/compliance', label: '法令・コンプラ',  icon: ShieldCheck },
]

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="border-b border-green-100 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-green-900">給与・人事労務システム</h1>
        <p className="text-xs text-green-500 mt-0.5">MoneyForward型 給与計算・社会保険・法令対応</p>
      </div>

      {/* タブナビ */}
      <div className="border-b border-green-100 bg-white px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-green-700 text-green-800'
                    : 'border-transparent text-green-500 hover:text-green-700 hover:border-green-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6 bg-green-50/30">
        {children}
      </div>
    </div>
  )
}
