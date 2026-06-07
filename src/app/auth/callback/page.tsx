'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://unbfufnqajavptbsrsfc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmZ1Zm5xYWphdnB0YnNyc2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzQ4NDYsImV4cCI6MjA5NjMxMDg0Nn0.wGKf5-81xc6pqB38UKt4vXl4DntwZ4pajkF8f_XwAp8'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState('起動中...')
  const [sessionInfo, setSessionInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    setStatus(`URLコード: ${code ? code.slice(0, 20) + '...' : 'なし'}`)

    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    supabase.auth.onAuthStateChange((event, s) => {
      setStatus(`認証イベント: ${event}`)
      if (s) {
        setSessionInfo(`ユーザー: ${s.user.email}`)
        setTimeout(() => { window.location.href = '/dashboard' }, 1500)
      }
    })

    supabase.auth.getSession().then(({ data: { session: s }, error: e }) => {
      if (e) { setError(`getSession エラー: ${e.message}`); return }
      if (s) {
        setSessionInfo(`ユーザー: ${s.user.email}`)
        setTimeout(() => { window.location.href = '/dashboard' }, 1500)
      } else {
        setStatus(prev => prev + ' | セッションなし・待機中')
      }
    })

    const timer = setTimeout(async () => {
      const { data: { session: s }, error: e } = await supabase.auth.getSession()
      if (s) {
        window.location.href = '/dashboard'
      } else {
        setError(`10秒タイムアウト。${e?.message ?? 'セッションが作成されませんでした'}`)
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full space-y-4">
        <h1 className="text-lg font-bold text-gray-900">ログイン処理中</h1>
        <p className="text-sm text-gray-600 font-mono bg-gray-100 p-3 rounded break-all">{status}</p>
        {sessionInfo && (
          <p className="text-sm text-green-700 font-mono bg-green-50 p-3 rounded">
            ✓ {sessionInfo} → ダッシュボードへ移動中
          </p>
        )}
        {error && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-mono bg-red-50 p-3 rounded break-all">{error}</p>
            <a href="/login" className="block text-center text-sm text-green-700 underline">
              ログインページへ戻る
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
