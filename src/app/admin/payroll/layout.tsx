'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCurrentUser, ROLE_LABELS } from '@/lib/auth-store'
import { getSupabaseClient } from '@/lib/supabase'
import {
  LayoutDashboard, Users, Clock, Calculator, FileText,
  Upload, ShieldCheck, Download, LogOut, ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

const TABS = [
  { href: '/admin/payroll',             label: 'ダッシュボード',   icon: LayoutDashboard, exact: true },
  { href: '/admin/payroll/employees',   label: '従業員管理',       icon: Users },
  { href: '/admin/payroll/attendance',  label: '勤怠管理',         icon: Clock },
  { href: '/admin/payroll/calculate',   label: '給与計算',         icon: Calculator },
  { href: '/admin/payroll/slips',       label: '給与明細',         icon: FileText },
  { href: '/admin/payroll/export',      label: '税理士・印刷出力', icon: Download },
  { href: '/admin/payroll/submissions', label: 'PDF申請書取込',    icon: Upload },
  { href: '/admin/payroll/compliance',  label: '法令・コンプラ',   icon: ShieldCheck, badge: true },
]

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname()
  const router      = useRouter()
  const currentUser = useCurrentUser()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* グローバルヘッダー */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* ロゴ */}
          <Link href="/admin/payroll" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-green-800 flex items-center justify-center">
              <span className="text-white font-bold text-[10px] tracking-tight">IMC</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">給与・人事労務</span>
          </Link>

          {/* 他システムへの導線 */}
          <Link
            href="/admin/calendar"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            予約・受付システムへ
          </Link>
        </div>

        {/* ユーザーメニュー */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors py-1 px-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-800 text-[10px] font-bold">
                {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
              </span>
            </div>
            <span className="max-w-[120px] truncate">
              {currentUser?.displayName || currentUser?.email || ''}
            </span>
            {currentUser?.role && (
              <span className="text-xs text-gray-400">
                {ROLE_LABELS[currentUser.role]}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-0 overflow-x-auto">
          {TABS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-green-700 text-green-800'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
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
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
