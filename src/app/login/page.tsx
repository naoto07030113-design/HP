'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserClient } from '@supabase/ssr'
import { BarChart3 } from 'lucide-react'

const SUPABASE_URL = 'https://unbfufnqajavptbsrsfc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmZ1Zm5xYWphdnB0YnNyc2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzQ4NDYsImV4cCI6MjA5NjMxMDg0Nn0.wGKf5-81xc6pqB38UKt4vXl4DntwZ4pajkF8f_XwAp8'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(`コールバックエラー: ${urlError}`)
  }, [searchParams])

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) {
        setError(`認証エラー: ${error.message}`)
        setLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError('リダイレクトURLが取得できませんでした。Supabase の Google プロバイダー設定を確認してください。')
        setLoading(false)
      }
    } catch (e: unknown) {
      setError(`予期しないエラー: ${e instanceof Error ? e.message : String(e)}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 shadow-md">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pre-Site Sales AI Engine</h1>
            <p className="text-sm text-gray-500">AI事前制作型HP営業システム</p>
          </div>
        </div>

        <Card className="shadow-md border-gray-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">ログイン</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Googleアカウントでサインインしてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
              variant="outline"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  処理中...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
                  </svg>
                  Googleでログイン
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Pre-Site Sales AI Engine &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
