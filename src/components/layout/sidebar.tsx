'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Settings,
  Zap,
  PlusCircle,
} from 'lucide-react'

const navItems = [
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    icon: LayoutDashboard,
  },
  {
    href: '/businesses',
    label: '事業者一覧',
    icon: Building2,
  },
  {
    href: '/businesses/new',
    label: '新規追加',
    icon: PlusCircle,
  },
  {
    href: '/settings',
    label: '設定',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200 w-64">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">PreSales AI</p>
          <p className="text-xs text-gray-500">営業支援システム</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                isActive && 'active'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Pre-Site Sales AI Engine v0.1
        </p>
      </div>
    </div>
  )
}
