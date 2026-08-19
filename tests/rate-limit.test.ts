/**
 * レート制限。
 *
 * 未認証エンドポイント（Web予約・予約照会）とログインを守る最低限の措置。
 * 「窓を超えたら許可回数がリセットされる」ことまで含めて固定する。
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { enforceRateLimit } from '@/server/http/rateLimit'
import { AppError } from '@/server/errors/AppError'

afterEach(() => { vi.useRealTimers() })

describe('enforceRateLimit', () => {
  it('上限までは通り、超えると 429 で止まる', () => {
    const rule = { scope: 'test-a', windowMs: 60_000, max: 3 }
    expect(() => enforceRateLimit(rule, 'ip-1')).not.toThrow()
    expect(() => enforceRateLimit(rule, 'ip-1')).not.toThrow()
    expect(() => enforceRateLimit(rule, 'ip-1')).not.toThrow()
    try {
      enforceRateLimit(rule, 'ip-1')
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).code).toBe('RATE_LIMITED')
      expect((err as AppError).status).toBe(429)
    }
  })

  it('識別子が違えば別々に数える', () => {
    const rule = { scope: 'test-b', windowMs: 60_000, max: 1 }
    expect(() => enforceRateLimit(rule, 'ip-1')).not.toThrow()
    expect(() => enforceRateLimit(rule, 'ip-2')).not.toThrow()
    expect(() => enforceRateLimit(rule, 'ip-1')).toThrow()
  })

  it('用途（scope）が違えば別々に数える', () => {
    expect(() => enforceRateLimit({ scope: 'test-c1', windowMs: 60_000, max: 1 }, 'ip-9')).not.toThrow()
    expect(() => enforceRateLimit({ scope: 'test-c2', windowMs: 60_000, max: 1 }, 'ip-9')).not.toThrow()
  })

  it('時間窓を過ぎれば再び通る', () => {
    vi.useFakeTimers()
    const rule = { scope: 'test-d', windowMs: 1_000, max: 1 }
    expect(() => enforceRateLimit(rule, 'ip-3')).not.toThrow()
    expect(() => enforceRateLimit(rule, 'ip-3')).toThrow()
    vi.advanceTimersByTime(1_500)
    expect(() => enforceRateLimit(rule, 'ip-3')).not.toThrow()
  })

  it('識別子が取れない場合も数える（素通りさせない）', () => {
    const rule = { scope: 'test-e', windowMs: 60_000, max: 1 }
    expect(() => enforceRateLimit(rule, null)).not.toThrow()
    expect(() => enforceRateLimit(rule, null)).toThrow()
  })

  it('エラーの詳細は開発者向けにだけ残り、利用者向け文言には含まれない', () => {
    const rule = { scope: 'test-f', windowMs: 60_000, max: 0 }
    try {
      enforceRateLimit(rule, 'ip-secret')
      throw new Error('例外が投げられなかった')
    } catch (err) {
      const e = err as AppError
      expect(e.detail).toContain('ip-secret')
      expect(e.message).not.toContain('ip-secret')
    }
  })
})
