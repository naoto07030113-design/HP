/**
 * 簡易レート制限。
 *
 * 患者向けの未認証エンドポイント（予約作成・予約照会）を、
 * 総当たりや大量投入から守るための最低限の措置。
 *
 * 制約: プロセス内メモリで数えるため、サーバーレスの複数インスタンス間では共有されない。
 * 「無いよりは確実に良い」水準であり、本格運用では Upstash Redis 等への差し替えを想定している。
 * その前提を隠さないよう、ここに明記しておく。
 */

import { AppError, ERROR_CODES } from '../errors/AppError'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastSweep = 0

function sweep(now: number) {
  // 毎回全走査すると重いので、1分に1回だけ期限切れを掃除する
  if (now - lastSweep < 60_000) return
  lastSweep = now
  // tsconfig の target が ES5 のため for...of で Map を回さず forEach を使う
  const expired: string[] = []
  buckets.forEach((b, key) => { if (b.resetAt <= now) expired.push(key) })
  expired.forEach((key) => buckets.delete(key))
}

export type RateLimitRule = {
  /** 識別子の接頭辞。エンドポイントごとに分ける */
  scope: string
  /** 時間窓（ミリ秒） */
  windowMs: number
  /** 窓内に許す回数 */
  max: number
}

export function enforceRateLimit(rule: RateLimitRule, identifier: string | null): void {
  const now = Date.now()
  sweep(now)

  const key = `${rule.scope}:${identifier ?? 'unknown'}`
  const bucket = buckets.get(key)

  const fresh = !bucket || bucket.resetAt <= now
  const next = fresh
    ? { count: 1, resetAt: now + rule.windowMs }
    : { count: bucket!.count + 1, resetAt: bucket!.resetAt }
  buckets.set(key, next)

  // 新しい窓の1回目も max と比べる（max=0 を「無制限」と取り違えないため）
  if (next.count > rule.max) {
    const retryAfterSec = Math.ceil((next.resetAt - now) / 1000)
    throw new AppError(ERROR_CODES.RATE_LIMITED, {
      detail: `scope=${rule.scope} identifier=${identifier ?? 'unknown'} count=${next.count} retryAfter=${retryAfterSec}s`,
    })
  }
}
