'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { AppSidebar } from '@/components/AppSidebar'
import { StoreHydration } from '@/components/StoreHydration'
import { PaymentDueNotice } from '@/components/PaymentDueNotice'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login')
      else setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">読み込み中...</div>
      </div>
    )
  }

  return (
    <StoreHydration>
      <div className="flex h-screen bg-[hsl(var(--surface))] overflow-hidden">
        {/* デスクトップ サイドバー */}
        <aside className="hidden lg:flex lg:flex-shrink-0 lg:w-56 xl:w-60">
          <AppSidebar />
        </aside>

        {/* モバイル オーバーレイ */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-green-950/60 backdrop-blur-[2px]"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative flex flex-col w-64 max-w-xs z-50">
              <div className="absolute top-4 right-3 z-10">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-green-100/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <AppSidebar onClose={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* モバイル ヘッダー */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-green-950 text-white flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-lg text-green-100/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-white text-sm tracking-wide">経費・出納帳</span>
          </header>

          {/* 支払期日通知 */}
          <PaymentDueNotice />

          {/* ページコンテンツ */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </StoreHydration>
  )
}
