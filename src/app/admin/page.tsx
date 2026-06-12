'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Calendar, ClipboardList, ClipboardCheck, Building2, Users, BookOpen,
  Clock, Download, Megaphone, UserRound, FileText, Receipt, BarChart2,
  MessageSquare, Settings, LayoutList, Bell, LayoutDashboard, FileBarChart,
  BrainCircuit, CalendarOff, ShoppingBag, ChevronRight,
} from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { usePatientStore } from '@/lib/patient-store'
import { useCurrentUser, PERMISSIONS, ROLE_LABELS } from '@/lib/auth-store'
import { cn } from '@/lib/utils'

interface QuickLink {
  href: string
  label: string
  icon: React.ElementType
  description: string
  color: string
}

interface Section {
  title: string
  items: QuickLink[]
  adminOnly?: boolean
}

const SECTIONS: Section[] = [
  {
    title: 'メイン業務',
    items: [
      { href: '/admin/today',        label: '当日受付',        icon: ClipboardCheck, description: '本日の予約確認・受付処理',   color: 'from-green-500 to-green-700' },
      { href: '/admin/calendar',     label: '予約カレンダー',  icon: Calendar,        description: 'カレンダー形式で予約を確認', color: 'from-blue-500 to-blue-700' },
      { href: '/admin/reservations', label: '予約一覧',        icon: ClipboardList,   description: '全予約の一覧・検索・管理',   color: 'from-indigo-500 to-indigo-700' },
      { href: '/admin/patients',     label: '患者管理',        icon: UserRound,       description: '患者情報の登録・編集・検索', color: 'from-teal-500 to-teal-700' },
      { href: '/admin/records',      label: 'カルテ管理',      icon: FileText,        description: '診療記録の作成・確認',       color: 'from-cyan-500 to-cyan-700' },
      { href: '/admin/accounting',   label: '会計管理',        icon: Receipt,         description: '会計・請求書の作成・管理',   color: 'from-amber-500 to-amber-700' },
      { href: '/admin/daily',        label: '日計表',          icon: LayoutList,      description: '日別の売上集計レポート',     color: 'from-orange-500 to-orange-700' },
      { href: '/admin/merchandise',  label: '物販管理',        icon: ShoppingBag,     description: '物販商品の登録・予約管理',   color: 'from-pink-500 to-pink-700' },
    ],
  },
  {
    title: '経営管理',
    adminOnly: true,
    items: [
      { href: '/admin/dashboard/executive', label: '経営ダッシュボード', icon: LayoutDashboard, description: '全院の経営指標を一覧', color: 'from-violet-500 to-violet-700' },
      { href: '/admin/dashboard/clinic',    label: '院別ダッシュボード', icon: Building2,       description: '各院の詳細パフォーマンス', color: 'from-purple-500 to-purple-700' },
      { href: '/admin/dashboard/staff',     label: 'スタッフ別分析',     icon: Users,           description: 'スタッフごとの実績分析', color: 'from-fuchsia-500 to-fuchsia-700' },
      { href: '/admin/reports/meeting-ai',  label: '経営会議AI',         icon: BrainCircuit,    description: 'AIによる経営分析レポート', color: 'from-rose-500 to-rose-700' },
      { href: '/admin/reports/monthly',     label: '月次レポート',        icon: FileBarChart,    description: '月次の売上・患者レポート', color: 'from-red-500 to-red-700' },
    ],
  },
  {
    title: '分析・運営',
    items: [
      { href: '/admin/analytics',      label: '分析レポート',       icon: BarChart2,    description: '詳細な分析・グラフ表示',    color: 'from-emerald-500 to-emerald-700' },
      { href: '/admin/reminders',      label: 'リマインド送信',     icon: Bell,         description: '予約リマインドの送信管理',   color: 'from-yellow-500 to-yellow-700' },
      { href: '/admin/communications', label: 'コミュニケーション', icon: MessageSquare, description: '患者へのメッセージ管理',    color: 'from-lime-500 to-lime-700' },
    ],
  },
  {
    title: '管理設定',
    adminOnly: true,
    items: [
      { href: '/admin/clinics',       label: '院管理',          icon: Building2,  description: '院の基本情報・営業時間設定',  color: 'from-slate-500 to-slate-700' },
      { href: '/admin/staff',         label: 'スタッフ管理',    icon: Users,      description: 'スタッフ情報・権限の管理',    color: 'from-stone-500 to-stone-700' },
      { href: '/admin/menus',         label: 'メニュー管理',    icon: BookOpen,   description: '施術メニューの登録・設定',    color: 'from-zinc-500 to-zinc-700' },
      { href: '/admin/shifts',        label: 'シフト管理',      icon: Clock,      description: 'スタッフのシフト作成・管理',  color: 'from-neutral-500 to-neutral-700' },
      { href: '/admin/schedule',      label: '休診日管理',      icon: CalendarOff, description: '定休日・臨時休診の設定',     color: 'from-gray-500 to-gray-700' },
      { href: '/admin/announcements', label: 'お知らせ管理',    icon: Megaphone,  description: '院内・患者向けお知らせ',      color: 'from-sky-500 to-sky-700' },
      { href: '/admin/settings',      label: 'システム設定',    icon: Settings,   description: 'アプリ全体の設定',           color: 'from-blue-600 to-blue-800' },
    ],
  },
  {
    title: 'データ',
    adminOnly: true,
    items: [
      { href: '/admin/exports', label: 'CSV出力', icon: Download, description: '患者・予約データのエクスポート', color: 'from-green-600 to-green-800' },
    ],
  },
]

export default function AdminHomePage() {
  const currentUser = useCurrentUser()
  const store = useClinicStore()
  const patients = usePatientStore()

  const isAdmin = currentUser?.role === 'admin'
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayReservations = store.reservations.filter((r) => r.start_at.startsWith(todayStr))
  const activeClinics = store.clinics.filter((c) => c.is_active)

  const visibleSections = SECTIONS.filter((s) => !s.adminOnly || isAdmin)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ヘッダー */}
      <div className="relative bg-gradient-to-br from-green-950 via-green-900 to-[#16382a] rounded-2xl text-white px-6 py-6 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ background: 'radial-gradient(400px circle at 90% 10%, rgba(207,166,79,0.12), transparent 55%)' }}
        />
        <div className="relative">
          <p className="text-[10px] text-gold-300/80 tracking-[0.3em] mb-1">ITO MEDICAL CARE</p>
          <h1 className="text-xl font-bold tracking-tight">
            {currentUser ? `${currentUser.displayName || currentUser.email}` : '管理システム'}
          </h1>
          <p className="text-green-200/70 text-sm mt-1">
            {format(new Date(), 'yyyy年M月d日（E）', { locale: ja })}
            {currentUser && (
              <span className="ml-2 text-gold-300/80">
                {ROLE_LABELS[currentUser.role]}
                {currentUser.clinic_id && store.clinics.find(c => c.id === currentUser.clinic_id)
                  ? ` · ${store.clinics.find(c => c.id === currentUser.clinic_id)!.name}`
                  : ''}
              </span>
            )}
          </p>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      </div>

      {/* クイックスタット */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '本日の予約', value: todayReservations.length, unit: '件' },
          { label: '患者数',     value: patients.length, unit: '名' },
          { label: '稼働院数',   value: activeClinics.length, unit: '院' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-green-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-green-900">{stat.value}<span className="text-sm font-normal ml-0.5">{stat.unit}</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ナビゲーションセクション */}
      {visibleSections.map((section) => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-green-700/60 uppercase mb-3">{section.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {section.items.map(({ href, label, icon: Icon, description, color }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group bg-white rounded-xl border border-green-100 shadow-sm',
                  'hover:shadow-md hover:border-green-200 hover:-translate-y-0.5',
                  'transition-all duration-200 p-4 flex flex-col gap-3',
                )}
              >
                <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-950 leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{description}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-green-300 group-hover:text-green-600 transition-colors mt-auto self-end" />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
