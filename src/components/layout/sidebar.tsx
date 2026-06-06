'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Settings,
  BarChart3,
  PlusCircle,
  LogOut,
  Upload,
  MapPin,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/businesses', label: '事業者一覧', icon: Building2 },
  { href: '/businesses/search', label: 'Places検索', icon: MapPin },
  { href: '/businesses/new', label: '手動追加', icon: PlusCircle },
  { href: '/businesses/import', label: 'CSVインポート', icon: Upload },
  { href: '/settings', label: '設定', icon: Settings },
]

const exactMatchRoutes = ['/dashboard', '/businesses/new', '/businesses/import', '/businesses/search']

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200 w-64 flex-shrink-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-700">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">PreSales AI</p>
          <p className="text-xs text-gray-500">営業支援システム</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isExact = exactMatchRoutes.includes(item.href)
          const isActive = isExact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-green-50 text-green-800'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          ログアウト
        </button>
        <p className="text-xs text-gray-400 text-center pt-1">
          Pre-Site Sales AI Engine v0.1
        </p>
      </div>
    </div>
  )
}
