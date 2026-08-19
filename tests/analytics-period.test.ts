/**
 * 集計の期間計算。
 *
 * 「今月」「前月」「前期比」の区切りがずれると、ダッシュボードの数字が
 * まるごと嘘になる。基準日を固定して境界を確認する。
 */
import { describe, it, expect } from 'vitest'
import { getPeriodRange, getPrevPeriodRange } from '@/server/services/AnalyticsService'

// 2026-08-19（水）を基準にする
const TODAY = new Date(2026, 7, 19)

describe('getPeriodRange', () => {
  it('今日', () => {
    expect(getPeriodRange('today', undefined, TODAY)).toEqual({ from: '2026-08-19', to: '2026-08-19' })
  })

  it('今週（日曜はじまり）', () => {
    expect(getPeriodRange('week', undefined, TODAY)).toEqual({ from: '2026-08-16', to: '2026-08-22' })
  })

  it('今月は月末まで', () => {
    expect(getPeriodRange('month', undefined, TODAY)).toEqual({ from: '2026-08-01', to: '2026-08-31' })
  })

  it('前月', () => {
    expect(getPeriodRange('lastMonth', undefined, TODAY)).toEqual({ from: '2026-07-01', to: '2026-07-31' })
  })

  it('今年', () => {
    expect(getPeriodRange('year', undefined, TODAY)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })

  it('月末（30日の月）も正しく取れる', () => {
    expect(getPeriodRange('month', undefined, new Date(2026, 3, 10)))
      .toEqual({ from: '2026-04-01', to: '2026-04-30' })
  })

  it('うるう年の2月も正しく取れる', () => {
    expect(getPeriodRange('month', undefined, new Date(2028, 1, 10)))
      .toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })

  it('年をまたぐ前月', () => {
    expect(getPeriodRange('lastMonth', undefined, new Date(2026, 0, 15)))
      .toEqual({ from: '2025-12-01', to: '2025-12-31' })
  })

  it('カスタム期間はそのまま使う', () => {
    const custom = { from: '2026-05-01', to: '2026-05-10' }
    expect(getPeriodRange('custom', custom, TODAY)).toEqual(custom)
  })
})

describe('getPrevPeriodRange', () => {
  it('同じ長さだけ前へずらす', () => {
    expect(getPrevPeriodRange({ from: '2026-08-01', to: '2026-08-31' }))
      .toEqual({ from: '2026-07-01', to: '2026-07-31' })
  })

  it('1日なら前日', () => {
    expect(getPrevPeriodRange({ from: '2026-08-19', to: '2026-08-19' }))
      .toEqual({ from: '2026-08-18', to: '2026-08-18' })
  })

  it('1週間なら前週', () => {
    expect(getPrevPeriodRange({ from: '2026-08-16', to: '2026-08-22' }))
      .toEqual({ from: '2026-08-09', to: '2026-08-15' })
  })

  it('月をまたいでもずれない', () => {
    expect(getPrevPeriodRange({ from: '2026-03-01', to: '2026-03-31' }))
      .toEqual({ from: '2026-01-29', to: '2026-02-28' })
  })
})
