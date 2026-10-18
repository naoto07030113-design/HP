import { MILKS, SIZES, SWEETNESS, TOPPINGS } from '../data/menu.js'

export const yen = (n) => `¥${n.toLocaleString('ja-JP')}`

export function defaultSelection(product) {
  const o = product.options
  return {
    size: o.size ? 'M' : null,
    sweetness: o.sweetness ? 'regular' : null,
    milk: o.milk ? 'cow' : null,
    toppings: [...(product.defaults?.toppings ?? [])],
  }
}

export function unitPrice(product, sel) {
  let total = product.price
  if (sel.size) total += SIZES.find((s) => s.id === sel.size).delta
  if (sel.milk) total += MILKS.find((m) => m.id === sel.milk).delta
  for (const t of sel.toppings) total += TOPPINGS[t].delta
  return total
}

// 同一商品・同一カスタマイズはカート内で1行にまとめる
export function lineKey(productId, sel) {
  return [productId, sel.size, sel.sweetness, sel.milk, [...sel.toppings].sort().join('+')].join('|')
}

export function describe(sel) {
  const parts = []
  if (sel.size) parts.push(`${sel.size}サイズ`)
  if (sel.sweetness) parts.push(`甘さ：${SWEETNESS.find((s) => s.id === sel.sweetness).label}`)
  if (sel.milk) parts.push(MILKS.find((m) => m.id === sel.milk).label)
  for (const t of sel.toppings) parts.push(`+${TOPPINGS[t].label}`)
  return parts
}
