/**
 * 会計金額の計算。
 *
 * ここは「送信内容を書き換えれば任意の金額で会計を確定できた」問題を直した箇所で、
 * 計算式はこの1つの関数にしかない。壊れると請求額が狂うため、境界を含めて固定する。
 */
import { describe, it, expect } from 'vitest'
import { computeAmounts } from '@/server/services/BillingService'

const item = (unitPrice: number, quantity = 1, discount = 0) => ({
  menuId: null, name: '施術', unitPrice, quantity, discount,
})

describe('computeAmounts', () => {
  it('小計・消費税・合計を明細から計算する', () => {
    const r = computeAmounts({
      items: [item(5000), item(3000, 2)],
      insuranceType: 'none', insuranceCopay: 0, paymentAmount: 0,
    })
    expect(r.subtotal).toBe(11_000)
    expect(r.discountTotal).toBe(0)
    expect(r.taxAmount).toBe(1_100)
    expect(r.totalAmount).toBe(12_100)
  })

  it('割引は課税前に引く', () => {
    const r = computeAmounts({
      items: [item(10_000, 1, 1_000)],
      insuranceType: 'none', insuranceCopay: 0, paymentAmount: 0,
    })
    expect(r.discountTotal).toBe(1_000)
    expect(r.taxAmount).toBe(900)
    expect(r.totalAmount).toBe(9_900)
  })

  it('明細ごとの小計にも割引が反映される', () => {
    const r = computeAmounts({
      items: [item(2_000, 3, 500)],
      insuranceType: 'none', insuranceCopay: 0, paymentAmount: 0,
    })
    expect(r.items[0].subtotal).toBe(5_500)
  })

  it('割引が単価を超えても明細の小計は負にならない', () => {
    const r = computeAmounts({
      items: [item(1_000, 1, 5_000)],
      insuranceType: 'none', insuranceCopay: 0, paymentAmount: 0,
    })
    expect(r.items[0].subtotal).toBe(0)
    expect(r.taxAmount).toBe(0)
    expect(r.totalAmount).toBe(0)
  })

  it('消費税は四捨五入する', () => {
    const r = computeAmounts({
      items: [item(3_333)],
      insuranceType: 'none', insuranceCopay: 0, paymentAmount: 0,
    })
    expect(r.taxAmount).toBe(333)
    expect(r.totalAmount).toBe(3_666)
  })

  it('保険適用なら支払うのは自己負担額', () => {
    const r = computeAmounts({
      items: [item(10_000)],
      insuranceType: 'health_insurance', insuranceCopay: 1_500, paymentAmount: 2_000,
    })
    expect(r.totalAmount).toBe(11_000)
    expect(r.changeAmount).toBe(500)
  })

  it('自費なら合計との差額が釣り銭になる', () => {
    const r = computeAmounts({
      items: [item(5_000)],
      insuranceType: 'none', insuranceCopay: 0, paymentAmount: 10_000,
    })
    expect(r.totalAmount).toBe(5_500)
    expect(r.changeAmount).toBe(4_500)
  })

  it('預かり金額が不足していても釣り銭は負にならない', () => {
    const r = computeAmounts({
      items: [item(5_000)],
      insuranceType: 'none', insuranceCopay: 0, paymentAmount: 1_000,
    })
    expect(r.changeAmount).toBe(0)
  })

  it('明細が無ければすべて0', () => {
    const r = computeAmounts({
      items: [], insuranceType: 'none', insuranceCopay: 0, paymentAmount: 0,
    })
    expect(r.subtotal).toBe(0)
    expect(r.totalAmount).toBe(0)
  })
})
