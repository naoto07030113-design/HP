/**
 * ログイン。
 *
 * 以前はブラウザから直接 Supabase を叩いていたため、失敗の連続を数えられず、
 * 監査ログにも残らなかった。ここを通すことで回数制限と記録を持つ。
 */
import { defineHandler } from '@/server/http/handler'
import { enforceRateLimit } from '@/server/http/rateLimit'
import { authService } from '@/server/services/AuthService'
import { loginSchema } from '@/server/validators/auth'
import { writeAuditLog } from '@/server/logging/auditLog'
import { AppError } from '@/server/errors/AppError'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'public', schema: loginSchema },
  async ({ body, requestId, ipAddress, userAgent }) => {
    // 端末単位とアカウント単位の両方で数える。
    // IP だけだと同一 IP から複数アカウントを試されたときに緩く、
    // メールだけだと IP を変えずに複数アカウントを試されたときに緩いため
    enforceRateLimit({ scope: 'login:ip', windowMs: 15 * 60 * 1000, max: 20 }, ipAddress)
    enforceRateLimit({ scope: 'login:email', windowMs: 15 * 60 * 1000, max: 10 }, body.email.toLowerCase())

    try {
      const session = await authService.login(body)

      await writeAuditLog({
        requestId, action: 'login',
        actorId: session.userId, actorRole: null, clinicId: null,
        targetType: 'session', targetId: session.userId, result: 'success',
        ipAddress, userAgent,
      })

      return session
    } catch (err) {
      await writeAuditLog({
        requestId, action: 'login_failed',
        actorId: null, actorRole: null, clinicId: null,
        targetType: 'session', targetId: null, result: 'failure',
        // メールアドレスは伏字化されて保存される。パスワードは渡さない
        after: { email: body.email },
        errorCode: err instanceof AppError ? err.code : 'INTERNAL',
        ipAddress, userAgent,
      })
      throw err
    }
  },
)
