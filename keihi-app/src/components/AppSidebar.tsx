'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Wallet, Building2, LogOut, Receipt } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useCurrentUser } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/cashbook',   label: '経費・出納帳', icon: Wallet },
  { href: '/businesses', label: '事業所管理',   icon: Building2 },
]

interface Props {
  onClose?: () => void
}

export function AppSidebar({ onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const currentUser = useCurrentUser()

  async function handleSignOut() {
    onClose?.()
    await getSupabaseClient().auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-green-950 via-[#0f261b] to-[#0c2016] text-white">
      {/* ロゴ */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-700 to-green-900 ring-1 ring-gold-400/40 flex items-center justify-center flex-shrink-0 shadow-md">
            <Receipt className="w-4 h-4 text-gold-200" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight tracking-wide">経費・出納帳</p>
            <p className="text-[10px] text-gold-300/80 leading-tight tracking-[0.2em] mt-0.5">EXPENSE &amp; CASHBOOK</p>
          </div>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-gold-400/30 via-white/10 to-transparent" />
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto pb-3 px-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
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
      </nav>

      {/* フッター */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2.5 bg-black/10">
        {currentUser && (
          <div className="flex items-center gap-1.5 text-xs text-green-100/60">
            <span className="truncate">{currentUser.displayName || currentUser.email}</span>
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
