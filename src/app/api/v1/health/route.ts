/**
 * ヘルスチェック。外形監視から定期的に叩く想定。
 *
 *   /api/v1/health        アプリとDBの疎通まで確認する（監視用）
 *   /api/v1/health?live=1 プロセスが生きているかだけ返す（起動確認用・DBは見ない）
 *
 * 患者情報は一切返さない。バージョンと依存先の状態のみ。
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { logger } from '@/server/logging/logger'

export const dynamic = 'force-dynamic'

type Check = { name: string; status: 'ok' | 'error'; durationMs: number; detail?: string }

async function checkDatabase(): Promise<Check> {
  const startedAt = Date.now()
  try {
    const supabase = createServiceClient()
    // 件数だけを引く。行データは取得しない
    const { error } = await supabase
      .from('clinics')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    return { name: 'database', status: 'ok', durationMs: Date.now() - startedAt }
  } catch (err) {
    return {
      name: 'database',
      status: 'error',
      durationMs: Date.now() - startedAt,
      detail: describeError(err),
    }
  }
}

/** Supabase のエラーは Error ではなくプレーンオブジェクトで来るため個別に整形する */
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const e = err as { message?: string; code?: string; hint?: string }
    if (e.message) return e.code ? `${e.message} (code=${e.code})` : e.message
    return JSON.stringify(err).slice(0, 200)
  }
  return String(err)
}

function checkConfig(): Check {
  const missing = ['NEXT_PUBLIC_CLINIC_SUPABASE_URL', 'NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY']
    .filter((k) => !process.env[k])
  return missing.length === 0
    ? { name: 'config', status: 'ok', durationMs: 0 }
    : { name: 'config', status: 'error', durationMs: 0, detail: `未設定: ${missing.join(', ')}` }
}

export async function GET(request: Request) {
  const startedAt = Date.now()
  const requestId = request.headers.get('x-request-id') ?? `req_health_${Date.now()}`
  const liveOnly = new URL(request.url).searchParams.get('live') === '1'

  const checks: Check[] = liveOnly ? [] : [checkConfig(), await checkDatabase()]
  const healthy = checks.every((c) => c.status === 'ok')

  const body = {
    status: healthy ? 'ok' : 'degraded',
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'local',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
    uptimeMs: Math.round(process.uptime() * 1000),
    durationMs: Date.now() - startedAt,
    checks: checks.map((c) => ({
      name: c.name,
      status: c.status,
      durationMs: c.durationMs,
      // 失敗理由は監視で必要なので返す。ここに個人情報は載らない
      ...(c.detail ? { detail: c.detail } : {}),
    })),
    requestId,
  }

  if (!healthy) {
    logger.error('ヘルスチェックが degraded', {
      requestId,
      failed: checks.filter((c) => c.status === 'error').map((c) => c.name).join(','),
    })
  }

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { 'cache-control': 'no-store', 'x-request-id': requestId },
  })
}
