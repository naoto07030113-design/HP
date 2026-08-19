/**
 * ログイン。
 *
 * 以前はブラウザから直接 Supabase の signInWithPassword を呼んでいたため、
 * 失敗が何回続いたかをこちら側で数えられず、監査ログにも残らなかった。
 * サーバーを通すことで、回数制限と「誰がいつログインした / 失敗した」の記録を持つ。
 *
 * パスワードはこの層より先へ渡さない。ログにも監査ログにも出さない
 * （logger の redact でも落とされるが、そもそも渡さない）。
 */

import { createClient } from '@supabase/supabase-js'
import { AppError, ERROR_CODES } from '../errors/AppError'
import type { LoginInput } from '../validators/auth'

export type LoginResult = {
  accessToken: string
  refreshToken: string
  expiresAt: number | null
  userId: string
}

function authClient() {
  const url = process.env.NEXT_PUBLIC_CLINIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new AppError(ERROR_CODES.DEPENDENCY_UNAVAILABLE, {
      detail: 'NEXT_PUBLIC_CLINIC_SUPABASE_URL / ANON_KEY が設定されていません',
    })
  }
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export const authService = {
  async login(input: LoginInput): Promise<LoginResult> {
    const { data, error } = await authClient().auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (error || !data.session) {
      // 利用者へは「どちらが違うか」を伝えない（アカウントの存在を推測させない）
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, {
        message: 'メールアドレスまたはパスワードが正しくありません。',
        detail: `email=${input.email} reason=${error?.message ?? 'no session'}`,
      })
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? null,
      userId: data.session.user.id,
    }
  },
}
