'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://unbfufnqajavptbsrsfc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmZ1Zm5xYWphdnB0YnNyc2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzQ4NDYsImV4cCI6MjA5NjMxMDg0Nn0.wGKf5-81xc6pqB38UKt4vXl4DntwZ4pajkF8f_XwAp8'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // createBrowserClient with detectSessionInUrl:true automatically
    // detects ?code= in the URL and exchanges it for a session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        router.replace('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        subscription.unsubscribe()
        setError('ログインに失敗しました')
      }
    })

    // fallback: check if session was already set
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        router.replace('/dashboard')
      }
    })

    const timeout = setTimeout(async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
      } else {
        setError(error?.message ?? '認証がタイムアウトしました。もう一度お試しください。')
      }
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-green-700 underline">ログインページへ戻る</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-700 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">ログイン処理中...</p>
      </div>
    </div>
  )
}
