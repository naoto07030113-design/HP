'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Calendar, ClipboardList, ClipboardCheck, Building2, Users, BookOpen,
  Clock, Download, Megaphone, ExternalLink, UserRound, FileText,
  Receipt, BarChart2, MessageSquare, Settings, LogOut, ShieldCheck,
  LayoutList, Bell, LayoutDashboard, FileBarChart, BrainCircuit, CalendarOff,
  ShoppingBag, Home,
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useCurrentUser, PERMISSIONS, ROLE_LABELS } from '@/lib/auth-store'
import { useClinicStore } from '@/lib/clinic-store'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  show?: (role: ReturnType<typeof useCurrentUser>) => boolean
}

interface NavGroup {
  section: string
  items: NavItem[]
  show?: (role: ReturnType<typeof useCurrentUser>) => boolean
}

const NAV_ITEMS: NavGroup[] = [
  {
    section: 'メイン',
    items: [
      { href: '/admin',               label: 'ホーム',           icon: Home },
      { href: '/admin/today',         label: '当日受付',        icon: ClipboardCheck },
      { href: '/admin/calendar',      label: '予約カレンダー',  icon: Calendar },
      { href: '/admin/reservations',  label: '予約一覧',        icon: ClipboardList },
      { href: '/admin/patients',      label: '患者管理',        icon: UserRound },
      { href: '/admin/records',       label: 'カルテ管理',      icon: FileText },
      {
        href: '/admin/accounting', label: '会計管理', icon: Receipt,
        show: (u) => u ? PERMISSIONS.canViewAccounting(u.role) : false,
      },
      {
        href: '/admin/daily', label: '日計表', icon: LayoutList,
        show: (u) => u ? PERMISSIONS.canViewAccounting(u.role) : false,
      },
    ],
  },
  {
    section: '経営管理',
    show: (u) => u ? PERMISSIONS.canAccessDashboard(u.role) : false,
    items: [
      {
        href: '/admin/dashboard/executive', label: '経営ダッシュボード', icon: LayoutDashboard,
        show: (u) => u ? PERMISSIONS.canAccessDashboard(u.role) : false,
      },
      {
        href: '/admin/dashboard/clinic', label: '院別ダッシュボード', icon: Building2,
        show: (u) => u ? PERMISSIONS.canAccessDashboard(u.role) : false,
      },
      {
        href: '/admin/dashboard/staff', label: 'スタッフ別ダッシュボード', icon: Users,
        show: (u) => u ? PERMISSIONS.canAccessDashboard(u.role) : false,
      },
      {
        href: '/admin/reports/meeting-ai', label: '経営会議AI', icon: BrainCircuit,
        show: (u) => u ? PERMISSIONS.canAccessReports(u.role) : false,
      },
      {
        href: '/admin/reports/monthly', label: '月次レポート', icon: FileBarChart,
        show: (u) => u ? PERMISSIONS.canAccessReports(u.role) : false,
      },
    ],
  },
  {
    section: '分析・運営',
    show: (u) => u ? PERMISSIONS.canAccessAnalytics(u.role) : false,
    items: [
      { href: '/admin/analytics',       label: '分析レポート',      icon: BarChart2 },
      { href: '/admin/reminders',       label: 'リマインド送信',    icon: Bell },
      { href: '/admin/communications',  label: 'コミュニケーション', icon: MessageSquare },
    ],
  },
  {
    section: '管理設定',
    show: (u) => u ? PERMISSIONS.canManageClinics(u.role) || PERMISSIONS.canManageShifts(u.role) : false,
    items: [
      {
        href: '/admin/clinics', label: '院管理', icon: Building2,
        show: (u) => u ? PERMISSIONS.canManageClinics(u.role) : false,
      },
      {
        href: '/admin/staff', label: 'スタッフ管理', icon: Users,
        show: (u) => u ? PERMISSIONS.canManageStaff(u.role) : false,
      },
      {
        href: '/admin/menus', label: 'メニュー管理', icon: BookOpen,
        show: (u) => u ? PERMISSIONS.canManageMenus(u.role) : false,
      },
      { href: '/admin/shifts',         label: 'シフト管理',      icon: Clock },
      { href: '/admin/schedule',       label: '休診日管理',      icon: CalendarOff },
      {
        href: '/admin/merchandise', label: '物販管理', icon: ShoppingBag,
        show: (u) => u ? PERMISSIONS.canManageMerchandise(u.role) : false,
      },
      {
        href: '/admin/announcements', label: 'お知らせ管理', icon: Megaphone,
        show: (u) => u ? PERMISSIONS.canManageAnnouncements(u.role) : false,
      },
      {
        href: '/admin/settings', label: 'システム設定', icon: Settings,
        show: (u) => u ? PERMISSIONS.canAccessSettings(u.role) : false,
      },
    ],
  },
  {
    section: 'データ',
    show: (u) => u ? PERMISSIONS.canAccessExports(u.role) : false,
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
  const currentUser = useCurrentUser()
  const { clinics } = useClinicStore()
  const restrictedClinic = currentUser?.clinic_id
    ? clinics.find((c) => c.id === currentUser.clinic_id)
    : null

  async function handleSignOut() {
    onClose?.()
    await getSupabaseClient().auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-green-950 via-[#0f261b] to-[#0c2016] text-white">
      {/* ロゴ */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-700 to-green-900 ring-1 ring-gold-400/40 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-gold-200 font-bold text-xs tracking-widest">IMC</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight tracking-wide">統合業務システム</p>
            <p className="text-[10px] text-gold-300/80 leading-tight tracking-[0.2em] mt-0.5">CLINIC MANAGEMENT</p>
          </div>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-gold-400/30 via-white/10 to-transparent" />
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto pb-3 px-3">
        {NAV_ITEMS.map((group) => {
          if (group.show && !group.show(currentUser)) return null
          const visibleItems = group.items.filter((item) => !item.show || item.show(currentUser))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.section} className="mb-5">
              <p className="text-[10px] font-semibold tracking-[0.25em] text-green-300/40 px-3 py-1 mb-1">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== '/admin' && href !== '/' && pathname.startsWith(href))
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={cn('sidebar-link', active && 'active')}
                    >
                      <Icon className={cn('w-4 h-4 flex-shrink-0', active && 'text-gold-300')} />
                      <span>{label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* 患者予約ポータルリンク */}
        <div className="mt-1 px-1">
          <Link
            href="/reserve"
            target="_blank"
            onClick={onClose}
            className="flex items-center justify-center gap-2 text-xs text-green-100/70 hover:text-white border border-white/10 hover:border-gold-400/40 hover:bg-white/[0.04] rounded-lg py-2.5 transition-all duration-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            患者予約ポータルを開く
          </Link>
        </div>
      </nav>

      {/* フッター */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2.5 bg-black/10">
        {currentUser && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-green-100/60">
              <ShieldCheck className="w-3 h-3 text-gold-400/80 flex-shrink-0" />
              <span className="truncate max-w-[110px]">{currentUser.displayName || currentUser.email}</span>
              <span className="text-gold-300/80 font-medium flex-shrink-0">({ROLE_LABELS[currentUser.role]})</span>
            </div>
            {restrictedClinic && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-300/70">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{restrictedClinic.name} のみ</span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs text-green-100/50 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          ログアウト
        </button>
      </div>
    </div>
  )
}
