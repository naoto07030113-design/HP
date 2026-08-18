'use client'

/**
 * ブラウザから /api/v1 を呼ぶための共通クライアント。
 *
 * - リクエストIDを発行して送る。サーバーのログと画面のエラー表示が同じIDで結びつく
 * - ログイン中なら Authorization: Bearer を自動で付ける
 * - 失敗時は ApiError として投げる。呼び出し側は message をそのまま表示してよい
 *   （サーバーが利用者向けの文言だけを返す設計になっている）
 */

import { getSupabaseClient } from './supabase'

export type ApiFieldError = { field: string; message: string }

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId: string
  readonly fields?: ApiFieldError[]

  constructor(args: {
    code: string; message: string; status: number; requestId: string; fields?: ApiFieldError[]
  }) {
    super(args.message)
    this.name = 'ApiError'
    this.code = args.code
    this.status = args.status
    this.requestId = args.requestId
    this.fields = args.fields
  }

  /** 問い合わせ時に伝えてもらう用の短い識別子 */
  get supportCode(): string {
    return `${this.code} / ${this.requestId}`
  }
}

function newRequestId(): string {
  const raw =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2).padEnd(20, '0')
  return `req_${raw.slice(0, 20)}`
}

async function accessToken(): Promise<string | null> {
  try {
    const { data } = await getSupabaseClient().auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

type Options = {
  /** ログインが必要なAPIでは true。トークンが無ければ送信前に弾く */
  authenticated?: boolean
  signal?: AbortSignal
}

export async function apiPost<T>(path: string, body: unknown, options: Options = {}): Promise<T> {
  const requestId = newRequestId()
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-request-id': requestId,
  }

  if (options.authenticated) {
    const token = await accessToken()
    if (!token) {
      throw new ApiError({
        code: 'UNAUTHENTICATED',
        message: 'ログインが必要です。もう一度ログインしてください。',
        status: 401,
        requestId,
      })
    }
    headers.authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    })
  } catch (err) {
    // 通信そのものが失敗した場合。オフラインや遮断が主な原因
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: '通信に失敗しました。電波状況をご確認のうえ、もう一度お試しください。',
      status: 0,
      requestId,
    })
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    const error = payload?.error ?? {}
    throw new ApiError({
      code: typeof error.code === 'string' ? error.code : 'INTERNAL',
      message:
        typeof error.message === 'string'
          ? error.message
          : '処理中にエラーが発生しました。時間をおいて再度お試しください。',
      status: response.status,
      requestId: typeof error.requestId === 'string' ? error.requestId : requestId,
      fields: Array.isArray(error.fields) ? error.fields : undefined,
    })
  }

  return payload.data as T
}
