/**
 * 会計の業務ルール。
 *
 * ここでの最重要事項は **金額をサーバーで計算すること**。
 * 以前はブラウザが計算した小計・消費税・合計・釣り銭をそのまま保存していたため、
 * 送信内容を書き換えれば任意の金額で会計を確定できた。
 * 現在は明細（単価・数量・割引）と預かり金額だけを受け取り、
 * 合計はこの層で計算し直す。
 */

import {
  invoiceRepository, type InvoiceRow, type InvoiceListQuery, type InvoiceItemRow,
} from '../repositories/InvoiceRepository'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { assertClinicAccess, clinicScope, requireCapability } from '../permissions/policy'
import type { Actor } from '../auth/session'
import type { InvoiceListInput, InvoiceWriteInput, InvoiceItemInput } from '../validators/invoice'

/** 消費税率。将来の税率変更に備え、計算に使う値をここ1箇所に置く */
const TAX_RATE = 0.1

export type InvoiceItemDto = {
  id: string
  menuId: string | null
  name: string
  unitPrice: number
  quantity: number
  discount: number
  subtotal: number
}

export type InvoiceDto = {
  id: string
  invoiceNumber: string
  reservationId: string | null
  patientId: string | null
  patientName: string
  clinicId: string
  staffId: string | null
  visitDate: string
  items: InvoiceItemDto[]
  subtotal: number
  discountTotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  insuranceType: InvoiceRow['insurance_type']
  insuranceCopay: number
  paymentMethod: InvoiceRow['payment_method']
  paymentAmount: number
  changeAmount: number
  status: InvoiceRow['status']
  memo: string | null
  createdAt: string
  updatedAt: string
}

function toItemDto(r: InvoiceItemRow): InvoiceItemDto {
  return {
    id: r.id,
    menuId: r.menu_id,
    name: r.name,
    unitPrice: r.unit_price,
    quantity: r.quantity,
    discount: r.discount,
    subtotal: r.subtotal,
  }
}

function toDto(r: InvoiceRow): InvoiceDto {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    reservationId: r.reservation_id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    clinicId: r.clinic_id,
    staffId: r.staff_id,
    visitDate: r.visit_date,
    items: (r.invoice_items ?? []).map(toItemDto),
    subtotal: r.subtotal,
    discountTotal: r.discount_total,
    taxRate: Number(r.tax_rate),
    taxAmount: r.tax_amount,
    totalAmount: r.total_amount,
    insuranceType: r.insurance_type,
    insuranceCopay: r.insurance_copay,
    paymentMethod: r.payment_method,
    paymentAmount: r.payment_amount,
    changeAmount: r.change_amount,
    status: r.status,
    memo: r.memo,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export type ComputedAmounts = {
  subtotal: number
  discountTotal: number
  taxAmount: number
  totalAmount: number
  changeAmount: number
  items: Array<InvoiceItemInput & { subtotal: number }>
}

/**
 * 金額の計算。ここが会計の唯一の計算式。
 * 画面側の表示計算と食い違わないよう、丸め方も含めてここに集約する。
 */
export function computeAmounts(args: {
  items: InvoiceItemInput[]
  insuranceType: InvoiceRow['insurance_type']
  insuranceCopay: number
  paymentAmount: number
}): ComputedAmounts {
  const items = args.items.map((it) => ({
    ...it,
    // 割引が単価×数量を超えてもマイナスにしない
    subtotal: Math.max(0, it.unitPrice * it.quantity - it.discount),
  }))

  const subtotal = args.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0)
  const discountTotal = args.items.reduce((s, it) => s + it.discount, 0)
  const taxable = Math.max(0, subtotal - discountTotal)
  const taxAmount = Math.round(taxable * TAX_RATE)
  const totalAmount = taxable + taxAmount

  // 保険扱いのときに窓口で受け取るのは自己負担額
  const payable = args.insuranceType === 'none' ? totalAmount : args.insuranceCopay
  const changeAmount = Math.max(0, args.paymentAmount - payable)

  return { subtotal, discountTotal, taxAmount, totalAmount, changeAmount, items }
}

function toItemRows(items: ComputedAmounts['items']): Array<Record<string, unknown>> {
  return items.map((it) => ({
    menu_id: it.menuId,
    name: it.name,
    unit_price: it.unitPrice,
    quantity: it.quantity,
    discount: it.discount,
    subtotal: it.subtotal,
  }))
}

export const billingService = {
  async list(actor: Actor, input: InvoiceListInput) {
    requireCapability(actor, 'billing.read')
    const scope = clinicScope(actor)

    const query: InvoiceListQuery = {
      clinicScope: scope,
      clinicFilter: input.clinicId ?? null,
      patientId: input.patientId ?? null,
      status: input.status ?? null,
      search: input.search,
      from: input.from,
      to: input.to,
      page: input.page,
      perPage: input.perPage,
    }
    const [{ rows, total }, stats] = await Promise.all([
      invoiceRepository.list(query),
      invoiceRepository.stats({ clinicScope: scope, clinicFilter: input.clinicId ?? null }),
    ])
    return {
      invoices: rows.map(toDto),
      page: input.page,
      perPage: input.perPage,
      total,
      hasNext: input.page * input.perPage < total,
      stats,
    }
  },

  async get(actor: Actor, id: string): Promise<InvoiceDto> {
    requireCapability(actor, 'billing.read')
    const row = await invoiceRepository.findById(id)
    if (!row) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '会計が見つかりませんでした。', detail: `invoiceId=${id}`,
      })
    }
    assertClinicAccess(actor, row.clinic_id)
    return toDto(row)
  },

  async create(actor: Actor, input: InvoiceWriteInput): Promise<InvoiceDto> {
    requireCapability(actor, 'billing.write')
    assertClinicAccess(actor, input.clinicId)

    // 金額はここで計算する。ブラウザから来た合計は受け取っていない
    const amounts = computeAmounts({
      items: input.items,
      insuranceType: input.insuranceType,
      insuranceCopay: input.insuranceCopay,
      paymentAmount: input.paymentAmount,
    })

    const invoiceNumber = await invoiceRepository.nextInvoiceNumber(input.visitDate)

    const row = await invoiceRepository.insert(
      {
        invoice_number: invoiceNumber,
        reservation_id: input.reservationId,
        patient_id: input.patientId,
        patient_name: input.patientName,
        clinic_id: input.clinicId,
        staff_id: input.staffId,
        visit_date: input.visitDate,
        subtotal: amounts.subtotal,
        discount_total: amounts.discountTotal,
        tax_rate: TAX_RATE,
        tax_amount: amounts.taxAmount,
        total_amount: amounts.totalAmount,
        insurance_type: input.insuranceType,
        insurance_copay: input.insuranceCopay,
        payment_method: input.paymentMethod,
        payment_amount: input.paymentAmount,
        change_amount: amounts.changeAmount,
        status: input.status,
        memo: input.memo,
      },
      toItemRows(amounts.items),
      actor.id,
    )
    return toDto(row)
  },

  async update(actor: Actor, id: string, input: Partial<InvoiceWriteInput>) {
    requireCapability(actor, 'billing.write')

    const current = await invoiceRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '会計が見つかりませんでした。', detail: `invoiceId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)

    if (current.status === 'cancelled') {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
        message: 'キャンセル済みの会計は変更できません。',
        detail: `invoiceId=${id} status=cancelled`,
      })
    }

    // 明細が来ていれば金額を計算し直す。来ていなければ現在の明細で計算し直す
    const items: InvoiceItemInput[] = input.items ?? (current.invoice_items ?? []).map((it) => ({
      menuId: it.menu_id, name: it.name, unitPrice: it.unit_price,
      quantity: it.quantity, discount: it.discount,
    }))
    const amounts = computeAmounts({
      items,
      insuranceType: input.insuranceType ?? current.insurance_type,
      insuranceCopay: input.insuranceCopay ?? current.insurance_copay,
      paymentAmount: input.paymentAmount ?? current.payment_amount,
    })

    const patch: Record<string, unknown> = {
      subtotal: amounts.subtotal,
      discount_total: amounts.discountTotal,
      tax_rate: TAX_RATE,
      tax_amount: amounts.taxAmount,
      total_amount: amounts.totalAmount,
      change_amount: amounts.changeAmount,
    }
    const optional: Array<[keyof InvoiceWriteInput, string]> = [
      ['reservationId', 'reservation_id'], ['patientId', 'patient_id'],
      ['patientName', 'patient_name'], ['clinicId', 'clinic_id'], ['staffId', 'staff_id'],
      ['visitDate', 'visit_date'], ['insuranceType', 'insurance_type'],
      ['insuranceCopay', 'insurance_copay'], ['paymentMethod', 'payment_method'],
      ['paymentAmount', 'payment_amount'], ['status', 'status'], ['memo', 'memo'],
    ]
    for (const [from, to] of optional) {
      if (input[from] !== undefined) patch[to] = input[from]
    }

    const row = await invoiceRepository.update(
      id, patch, input.items ? toItemRows(amounts.items) : null, actor.id,
    )
    return { before: toDto(current), after: toDto(row) }
  },

  /** 入金処理。金額はここで確定させる */
  async markPaid(
    actor: Actor, id: string,
    options: { paymentMethod?: InvoiceRow['payment_method']; paymentAmount?: number },
  ) {
    requireCapability(actor, 'billing.write')

    const current = await invoiceRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '会計が見つかりませんでした。', detail: `invoiceId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)

    if (current.status === 'paid') {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
        message: 'この会計は既に支払済みです。', detail: `invoiceId=${id}`,
      })
    }
    if (current.status === 'cancelled') {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
        message: 'キャンセル済みの会計は入金できません。', detail: `invoiceId=${id}`,
      })
    }

    const payable = current.insurance_type === 'none' ? current.total_amount : current.insurance_copay
    const paymentAmount = options.paymentAmount ?? payable

    if (paymentAmount < payable) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
        message: `お預かり金額が不足しています（不足 ¥${(payable - paymentAmount).toLocaleString()}）。`,
        detail: `invoiceId=${id} payable=${payable} paid=${paymentAmount}`,
      })
    }

    const row = await invoiceRepository.update(id, {
      status: 'paid',
      payment_method: options.paymentMethod ?? current.payment_method,
      payment_amount: paymentAmount,
      change_amount: Math.max(0, paymentAmount - payable),
    }, null, actor.id)

    return { before: toDto(current), after: toDto(row) }
  },

  async remove(actor: Actor, id: string): Promise<InvoiceDto> {
    requireCapability(actor, 'billing.delete')

    const current = await invoiceRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '会計が見つかりませんでした。', detail: `invoiceId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)

    await invoiceRepository.softDelete(id, actor.id)
    return toDto(current)
  },
}
