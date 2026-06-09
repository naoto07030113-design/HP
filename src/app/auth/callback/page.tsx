'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/admin/calendar')
      } else {
        router.replace('/admin/login')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="text-sm text-muted-foreground">認証処理中...</div>
    </div>
  )
}
