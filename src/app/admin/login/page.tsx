'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseClient } from '@/lib/supabase'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.replace('/admin')
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-950 via-[#10291d] to-[#0c2016] flex items-center justify-center p-4 overflow-hidden">
      {/* 装飾: 柔らかな光 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px circle at 15% 20%, rgba(207,166,79,0.07), transparent 60%), radial-gradient(800px circle at 85% 80%, rgba(65,140,100,0.12), transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* ブランド */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-700 to-green-900 ring-1 ring-gold-400/50 shadow-lg flex items-center justify-center mb-4">
            <span className="text-gold-200 font-bold text-base tracking-[0.15em]">IMC</span>
          </div>
          <p className="font-bold text-white text-lg tracking-wide">イトーメディカルケア</p>
          <p className="text-[11px] text-gold-300/70 tracking-[0.3em] mt-1">CLINIC MANAGEMENT SYSTEM</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-7">
          <h1 className="text-lg font-bold text-green-950 mb-1">管理者ログイン</h1>
          <p className="text-xs text-muted-foreground mb-6">登録済みのアカウントでサインインしてください</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 h-11 text-[15px]" disabled={loading}>
              <LogIn className="w-4 h-4" />
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-green-100/40 mt-6 tracking-wider">
          イトーメディカルケア 統合業務システム
        </p>
      </div>
    </div>
  )
}
