/**
 * API ルートの共通ラッパー。
 *
 * すべての API はこれを通す。1本の関数に集約することで、
 * 「このエンドポイントだけ認証を忘れた」「ここだけログが無い」を構造的に防ぐ。
 *
 *   リクエストID付与
 *     → 認証
 *       → 認可
 *         → 入力検証
 *           → 業務処理
 *             → 監査ログ
 *               → 応答（成功/エラーとも同じ形）
 */

import { NextResponse } from 'next/server'
import type { ZodSchema } from 'zod'
import { AppError, ERROR_CODES, toErrorBody, type FieldError } from '../errors/AppError'
import { logger, type RequestLogger } from '../logging/logger'
import { requireActor, type Actor } from '../auth/session'
import { requireCapability, type Capability } from '../permissions/policy'

export type ApiSuccess<T> = { success: true; data: T; requestId: string }

/** ブラウザ → API → DB を横串で追うための ID */
function resolveRequestId(request: Request): string {
  const inbound = request.headers.get('x-request-id')
  if (inbound && /^[\w-]{8,64}$/.test(inbound)) return inbound
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`
}

function clientIp(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip')
}

export type HandlerContext<TBody> = {
  requestId: string
  log: RequestLogger
  /** auth: 'required' のときのみ入る */
  actor: Actor
  body: TBody
  request: Request
  params: Record<string, string>
  ipAddress: string | null
  userAgent: string | null
}

type Options<TBody> = {
  /** 'required' でログイン必須。'public' は患者向けの未認証エンドポイント */
  auth: 'required' | 'public'
  /** auth: 'required' のときに要求する権限 */
  capability?: Capability
  /** リクエストボディ（または検索文字列）のスキーマ */
  schema?: ZodSchema<TBody>
  /** クエリ文字列を検証する場合は 'query' を指定（既定は JSON ボディ） */
  source?: 'body' | 'query'
}

function zodToFields(err: unknown): FieldError[] | undefined {
  const issues = (err as { issues?: Array<{ path: (string | number)[]; message: string }> })?.issues
  if (!Array.isArray(issues)) return undefined
  return issues.map((i) => ({
    field: i.path.length ? i.path.join('.') : '(root)',
    message: i.message,
  }))
}

export function defineHandler<TBody = undefined>(
  options: Options<TBody>,
  handler: (ctx: HandlerContext<TBody>) => Promise<unknown>,
) {
  return async function route(
    request: Request,
    routeContext?: { params?: Record<string, string> },
  ): Promise<NextResponse> {
    const startedAt = Date.now()
    const requestId = resolveRequestId(request)
    const route = new URL(request.url).pathname
    const log = logger.child({ requestId, route, method: request.method })
    let actor: Actor | null = null

    try {
      log.info('リクエスト受信')

      // ── 認証 ──
      if (options.auth === 'required') {
        actor = await requireActor(request)
        log.debug('認証成功', { userId: actor.id, role: actor.role, clinicId: actor.clinicId ?? undefined })
        // ── 認可 ──
        if (options.capability) requireCapability(actor, options.capability)
      }

      // ── 入力検証 ──
      let body = undefined as TBody
      if (options.schema) {
        let raw: unknown
        if (options.source === 'query') {
          raw = Object.fromEntries(new URL(request.url).searchParams.entries())
        } else {
          try {
            raw = await request.json()
          } catch {
            throw new AppError(ERROR_CODES.MALFORMED_JSON, { detail: 'JSON として解釈できませんでした' })
          }
        }
        const parsed = options.schema.safeParse(raw)
        if (!parsed.success) {
          throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
            fields: zodToFields(parsed.error),
            detail: 'スキーマ検証に失敗しました',
          })
        }
        body = parsed.data
      }

      // ── 業務処理 ──
      const data = await handler({
        requestId,
        log,
        actor: actor as Actor,
        body,
        request,
        params: routeContext?.params ?? {},
        ipAddress: clientIp(request),
        userAgent: request.headers.get('user-agent'),
      })

      const durationMs = Date.now() - startedAt
      log.info('リクエスト完了', {
        status: 200,
        durationMs,
        userId: actor?.id,
        role: actor?.role,
      })

      return NextResponse.json(
        { success: true, data, requestId } satisfies ApiSuccess<unknown>,
        { status: 200, headers: { 'x-request-id': requestId, 'cache-control': 'no-store' } },
      )
    } catch (raw) {
      const err = AppError.from(raw)
      const durationMs = Date.now() - startedAt

      // 想定内の業務エラーは warn、想定外は error。
      // detail はここ（ログ）にだけ出し、利用者への応答には含めない。
      const context = {
        status: err.status,
        errorCode: err.code,
        durationMs,
        userId: actor?.id,
        role: actor?.role,
        clinicId: actor?.clinicId ?? undefined,
        detail: err.detail,
      }
      if (err.expected) log.warn('リクエスト失敗', context)
      else log.error('リクエスト失敗', { ...context, stack: err.cause instanceof Error ? err.cause.stack : undefined })

      return NextResponse.json(toErrorBody(err, requestId), {
        status: err.status,
        headers: { 'x-request-id': requestId, 'cache-control': 'no-store' },
      })
    }
  }
}
