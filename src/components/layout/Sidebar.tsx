'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Calendar, ClipboardList, ClipboardCheck, Building2, Users, BookOpen,
  Clock, Download, Megaphone, ExternalLink, UserRound, FileText,
  Receipt, BarChart2, MessageSquare, Settings, LogOut,
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'

const NAV_ITEMS = [
  {
    section: 'メイン',
    items: [
      { href: '/admin/today',         label: '当日受付',        icon: ClipboardCheck },
      { href: '/admin/calendar',      label: '予約カレンダー',  icon: Calendar },
      { href: '/admin/reservations',  label: '予約一覧',        icon: ClipboardList },
      { href: '/admin/patients',      label: '患者管理',        icon: UserRound },
      { href: '/admin/records',       label: 'カルテ管理',      icon: FileText },
      { href: '/admin/accounting',    label: '会計管理',        icon: Receipt },
    ],
  },
  {
    section: '分析・運営',
    items: [
      { href: '/admin/analytics',       label: '分析レポート',      icon: BarChart2 },
      { href: '/admin/communications',  label: 'コミュニケーション', icon: MessageSquare },
    ],
  },
  {
    section: '管理設定',
    items: [
      { href: '/admin/clinics',        label: '院管理',          icon: Building2 },
      { href: '/admin/staff',          label: 'スタッフ管理',    icon: Users },
      { href: '/admin/menus',          label: 'メニュー管理',    icon: BookOpen },
      { href: '/admin/shifts',         label: 'シフト管理',      icon: Clock },
      { href: '/admin/announcements',  label: 'お知らせ管理',    icon: Megaphone },
      { href: '/admin/settings',       label: 'システム設定',    icon: Settings },
    ],
  },
  {
    section: 'データ',
    items: [
      { href: '/admin/exports', label: 'CSV出力', icon: Download },
    ],
  },
]

interface Props {
  onClose?: () => void
}

export function Sidebar({ onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    onClose?.()
    await getSupabaseClient().auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-green-100">
      {/* ロゴ */}
      <div className="px-5 py-5 border-b border-green-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs tracking-tight">IMC</span>
          </div>
          <div>
            <p className="font-bold text-green-900 text-sm leading-tight">統合業務システム</p>
            <p className="text-[11px] text-green-500 leading-tight">管理画面</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {NAV_ITEMS.map((group) => (
          <div key={group.section} className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-green-400 px-3 py-1 mb-1">
              {group.section}
            </p>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn('sidebar-link', active && 'active')}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        ))}

        {/* 患者予約ポータルリンク */}
        <div className="mt-2 px-3">
          <Link
            href="/reserve"
            target="_blank"
            onClick={onClose}
            className="flex items-center gap-2 text-xs text-green-600 hover:text-green-800 py-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            患者予約ポータルを開く
          </Link>
        </div>
      </nav>

      {/* フッター */}
      <div className="px-4 py-3 border-t border-green-100 space-y-2">
        <p className="text-xs text-muted-foreground">イトーメディカルケア 業務システム</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          ログアウト
        </button>
      </div>
    </div>
  )
}
