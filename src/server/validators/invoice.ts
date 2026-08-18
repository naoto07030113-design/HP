import { z } from 'zod'
import { uuidSchema } from './appointment'

/**
 * 会計の入力スキーマ。
 *
 * 重要: 金額の合計（subtotal / tax_amount / total_amount / change_amount）は
 * ここで受け取らない。ブラウザから送られた金額をそのまま保存すると
 * 改ざんできてしまうため、明細と支払額だけを受け取り、
 * 合計はサーバー側（BillingService）で計算する。
 */

const money = (label: string, max = 10_000_000) =>
  z.number().int(`${label}は整数で入力してください`).min(0, `${label}は0以上で入力してください`).max(max)

export const invoiceItemSchema = z.object({
  menuId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  name: z.string().trim().min(1, '品目名を入力してください').max(120),
  unitPrice: money('単価'),
  quantity: z.number().int('数量は整数で入力してください').min(1, '数量は1以上で入力してください').max(999),
  discount: money('割引'),
})
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>

export const paymentMethodSchema = z.enum(['cash', 'card', 'paypay', 'line_pay', 'insurance', 'other'])
export const insuranceTypeSchema = z.enum(['none', 'health_insurance', 'workers_comp', 'auto_accident'])
export const invoiceStatusSchema = z.enum(['unpaid', 'paid', 'cancelled'])

export const invoiceWriteSchema = z.object({
  clinicId: uuidSchema,
  patientId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  patientName: z.string().trim().min(1, '患者名を入力してください').max(100),
  staffId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  reservationId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '来院日の形式が正しくありません'),

  items: z.array(invoiceItemSchema).min(1, '明細を1件以上入力してください').max(50),

  insuranceType: insuranceTypeSchema.default('none'),
  /** 保険扱いのときの窓口負担額。自費のときは無視される */
  insuranceCopay: money('窓口負担額').default(0),
  paymentMethod: paymentMethodSchema.default('cash'),
  /** 預かった金額。釣り銭はサーバーで計算する */
  paymentAmount: money('お預かり金額').default(0),
  status: invoiceStatusSchema.default('unpaid'),
  memo: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : null)),
})
export type InvoiceWriteInput = z.infer<typeof invoiceWriteSchema>

export const invoiceCreateSchema = invoiceWriteSchema
export const invoiceUpdateSchema = invoiceWriteSchema.partial().extend({ id: uuidSchema })

export const invoiceListSchema = z.object({
  clinicId: uuidSchema.nullable().optional(),
  patientId: uuidSchema.nullable().optional(),
  status: invoiceStatusSchema.nullable().optional(),
  search: z.string().trim().max(100).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).max(10000).default(1),
  perPage: z.number().int().min(1).max(100).default(50),
})
export type InvoiceListInput = z.infer<typeof invoiceListSchema>

export const invoiceIdSchema = z.object({ id: uuidSchema })

/** 入金処理（未払い → 支払済） */
export const invoicePaySchema = z.object({
  id: uuidSchema,
  paymentMethod: paymentMethodSchema.optional(),
  paymentAmount: money('お預かり金額').optional(),
})
