'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { StoreHydrationProvider } from '@/components/providers/StoreHydrationProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) { setReady(true); return }

    const supabase = getSupabaseClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/admin/login')
      } else {
        setReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        router.replace('/admin/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, isLoginPage])

  if (!ready) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">読み込み中...</div>
      </div>
    )
  }

  if (isLoginPage) return <>{children}</>

  return (
    <StoreHydrationProvider>
      <AppShell>{children}</AppShell>
    </StoreHydrationProvider>
  )
}
