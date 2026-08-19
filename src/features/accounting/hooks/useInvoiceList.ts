'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'
import type { Invoice, InvoiceFormData, InvoiceStatus } from '@/types/accounting'

/**
 * 会計一覧をサーバーから取得する。
 *
 * 以前は全会計をブラウザに読み込み、金額の計算も画面側で行っていた。
 * 金額はサーバーが計算し直すため、送信するのは明細と預かり金額だけにする。
 */

type ItemDto = {
  id: string; menuId: string | null; name: string
  unitPrice: number; quantity: number; discount: number; subtotal: number
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
  items: ItemDto[]
  subtotal: number
  discountTotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  insuranceType: Invoice['insurance_type']
  insuranceCopay: number
  paymentMethod: Invoice['payment_method']
  paymentAmount: number
  changeAmount: number
  status: InvoiceStatus
  memo: string | null
  createdAt: string
  updatedAt: string
}

type Response = {
  invoices: InvoiceDto[]
  page: number
  perPage: number
  total: number
  hasNext: boolean
  stats: { todaySales: number; monthSales: number; unpaidCount: number }
}

/** API(camelCase) → 画面で使っている型(snake_case) */
export function toInvoice(d: InvoiceDto): Invoice {
  return {
    id: d.id,
    invoice_number: d.invoiceNumber,
    reservation_id: d.reservationId,
    patient_id: d.patientId,
    patient_name: d.patientName,
    clinic_id: d.clinicId,
    staff_id: d.staffId,
    visit_date: d.visitDate,
    items: d.items.map((i) => ({
      id: i.id, menu_id: i.menuId, name: i.name,
      unit_price: i.unitPrice, quantity: i.quantity, discount: i.discount, subtotal: i.subtotal,
    })),
    subtotal: d.subtotal,
    discount_total: d.discountTotal,
    tax_rate: d.taxRate,
    tax_amount: d.taxAmount,
    total_amount: d.totalAmount,
    insurance_type: d.insuranceType,
    insurance_copay: d.insuranceCopay,
    payment_method: d.paymentMethod,
    payment_amount: d.paymentAmount,
    change_amount: d.changeAmount,
    status: d.status,
    memo: d.memo,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

/**
 * 画面のフォーム型 → API の入力形。
 * 合計・消費税・釣り銭は送らない。サーバーが計算するため、
 * ここで送っても無視される（改ざん防止）。
 */
export function toApiInput(form: InvoiceFormData) {
  return {
    clinicId: form.clinic_id,
    patientId: form.patient_id,
    patientName: form.patient_name,
    staffId: form.staff_id,
    reservationId: form.reservation_id,
    visitDate: form.visit_date,
    items: form.items.map((i) => ({
      menuId: i.menu_id,
      name: i.name,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      discount: i.discount,
    })),
    insuranceType: form.insurance_type,
    insuranceCopay: form.insurance_copay,
    paymentMethod: form.payment_method,
    paymentAmount: form.payment_amount,
    status: form.status,
    memo: form.memo ?? '',
  }
}

const PER_PAGE = 50

export type InvoiceFilters = {
  clinicId: string | null
  status: InvoiceStatus | null
  search: string
  from?: string
  to?: string
  /** 患者詳細から、その患者の会計だけを引くときに使う */
  patientId?: string | null
  perPage?: number
}

export function useInvoiceList(filters: InvoiceFilters) {
  const [items, setItems] = useState<Invoice[]>([])
  const [stats, setStats] = useState({ todaySales: 0, monthSales: 0, unpaidCount: 0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const { clinicId, status, search, from, to, patientId } = filters
  const perPage = filters.perPage ?? PER_PAGE

  useEffect(() => { setPage(1) }, [clinicId, status, search, from, to, patientId])

  useEffect(() => {
    const delay = search ? 300 : 0
    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError(null)

      apiPost<Response>('/api/v1/invoices/list', {
        clinicId: clinicId ?? undefined,
        status: status ?? undefined,
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        patientId: patientId ?? undefined,
        page,
        perPage,
      }, { authenticated: true, signal: controller.signal })
        .then((res) => {
          setItems(res.invoices.map(toInvoice))
          setTotal(res.total)
          setHasNext(res.hasNext)
          setStats(res.stats)
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          setItems([])
          setError(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '会計一覧を取得できませんでした。')
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, delay)

    return () => clearTimeout(timer)
  }, [clinicId, status, search, from, to, patientId, page, perPage, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  return { items, stats, total, page, setPage, hasNext, loading, error, reload, perPage }
}
