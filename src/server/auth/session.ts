/**
 * サーバー側の認証。
 *
 * このアプリはセッションを localStorage に保持しているため、Cookie は飛んでこない。
 * そこでクライアントは Authorization: Bearer <access_token> を付けて API を呼び、
 * サーバーはそのトークンを Supabase に問い合わせて検証する。
 *
 * 重要: ロールと所属院は app_metadata からのみ読む。
 * user_metadata は利用者本人が updateUser() で書き換えられるため、
 * ここを信頼すると受付スタッフが自分を管理者に昇格できてしまう。
 */

import { createClient } from '@supabase/supabase-js'
import { AppError, ERROR_CODES } from '../errors/AppError'

export type Role = 'admin' | 'staff' | 'receptionist'

export type Actor = {
  id: string
  email: string | null
  role: Role
  /** 所属院。admin は未設定（全院を横断できる） */
  clinicId: string | null
  displayName: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_CLINIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY

function assertConfigured(): { url: string; key: string } {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new AppError(ERROR_CODES.DEPENDENCY_UNAVAILABLE, {
      detail:
        'NEXT_PUBLIC_CLINIC_SUPABASE_URL / NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY が未設定です。' +
        '接続先が定まらないため起動できません。',
    })
  }
  return { url: SUPABASE_URL, key: ANON_KEY }
}

/** app_metadata からのみロールを決める。未設定は最小権限に倒す */
function roleFrom(appMetadata: Record<string, unknown> | undefined): Role {
  const raw = appMetadata?.role
  if (raw === 'admin') return 'admin'
  if (raw === 'staff') return 'staff'
  if (raw === 'receptionist') return 'receptionist'
  // 以前は未設定を admin として扱っていた。事故を防ぐため最小権限を既定にする
  return 'receptionist'
}

function clinicFrom(appMetadata: Record<string, unknown> | undefined): string | null {
  const raw = appMetadata?.clinic_id
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1] : null
}

/**
 * リクエストからログイン中の利用者を解決する。
 * トークンが無い・無効な場合は AppError を投げる。
 */
export async function requireActor(request: Request): Promise<Actor> {
  const token = bearerToken(request)
  if (!token) {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, {
      detail: 'Authorization ヘッダが付いていません',
    })
  }

  const { url, key } = assertConfigured()
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw new AppError(ERROR_CODES.SESSION_EXPIRED, {
      detail: error?.message ?? 'getUser がユーザーを返しませんでした',
    })
  }

  const appMeta = data.user.app_metadata as Record<string, unknown> | undefined
  const userMeta = (data.user.user_metadata ?? {}) as Record<string, unknown>

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: roleFrom(appMeta),
    clinicId: clinicFrom(appMeta),
    // 表示名は本人が変えても実害がないため user_metadata から読んでよい
    displayName:
      (typeof userMeta.name === 'string' && userMeta.name) ||
      (typeof userMeta.full_name === 'string' && userMeta.full_name) ||
      data.user.email ||
      '',
  }
}
