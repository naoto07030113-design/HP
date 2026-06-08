'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import type { Invoice, InvoiceItem, InvoiceFormData } from '@/types/accounting'
import { secureSet, secureGet } from './secure-storage'

const KEY_ENC = 'accounting_store_v1_enc'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const YESTERDAY = format(addDays(new Date(), -1), 'yyyy-MM-dd')
const LAST_WEEK = format(addDays(new Date(), -7), 'yyyy-MM-dd')
const NOW = new Date().toISOString()

function makeItem(
  id: string,
  menuId: string | null,
  name: string,
  unitPrice: number,
  quantity = 1,
  discount = 0,
): InvoiceItem {
  return {
    id,
    menu_id: menuId,
    name,
    unit_price: unitPrice,
    quantity,
    discount,
    subtotal: unitPrice * quantity - discount,
  }
}

const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoice_number: `INV-${TODAY.replace(/-/g, '')}-001`,
    reservation_id: 'res-5',
    patient_id: null,
    patient_name: '渡辺 健',
    clinic_id: 'clinic-1',
    staff_id: 'staff-2',
    visit_date: TODAY,
    items: [makeItem('item-1-1', 'menu-2', 'ほぐし・マッサージ 50分', 4900)],
    subtotal: 4900,
    discount_total: 0,
    tax_rate: 0.1,
    tax_amount: 490,
    total_amount: 5390,
    insurance_type: 'none',
    insurance_copay: 0,
    payment_method: 'cash',
    payment_amount: 6000,
    change_amount: 610,
    status: 'paid',
    memo: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'inv-2',
    invoice_number: `INV-${TODAY.replace(/-/g, '')}-002`,
    reservation_id: 'res-12',
    patient_id: null,
    patient_name: '野村 敏',
    clinic_id: 'clinic-1',
    staff_id: 'staff-1',
    visit_date: YESTERDAY,
    items: [
      makeItem('item-2-1', 'menu-2', 'ほぐし・マッサージ 50分', 4900),
      makeItem('item-2-2', 'menu-4', '骨格矯正', 2150),
    ],
    subtotal: 7050,
    discount_total: 0,
    tax_rate: 0.1,
    tax_amount: 705,
    total_amount: 7755,
    insurance_type: 'none',
    insurance_copay: 0,
    payment_method: 'card',
    payment_amount: 7755,
    change_amount: 0,
    status: 'paid',
    memo: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'inv-3',
    invoice_number: `INV-${YESTERDAY.replace(/-/g, '')}-001`,
    reservation_id: null,
    patient_id: null,
    patient_name: '田中 一郎',
    clinic_id: 'clinic-1',
    staff_id: 'staff-1',
    visit_date: YESTERDAY,
    items: [makeItem('item-3-1', 'menu-5', '鍼灸治療 30分', 3250)],
    subtotal: 3250,
    discount_total: 0,
    tax_rate: 0.1,
    tax_amount: 325,
    total_amount: 3575,
    insurance_type: 'none',
    insurance_copay: 0,
    payment_method: 'paypay',
    payment_amount: 3575,
    change_amount: 0,
    status: 'paid',
    memo: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'inv-4',
    invoice_number: `INV-${LAST_WEEK.replace(/-/g, '')}-001`,
    reservation_id: null,
    patient_id: null,
    patient_name: '佐藤 美咲',
    clinic_id: 'clinic-1',
    staff_id: 'staff-2',
    visit_date: LAST_WEEK,
    items: [makeItem('item-4-1', 'menu-6', '鍼灸治療 50分', 4900)],
    subtotal: 4900,
    discount_total: 0,
    tax_rate: 0.1,
    tax_amount: 490,
    total_amount: 5390,
    insurance_type: 'health_insurance',
    insurance_copay: 1800,
    payment_method: 'cash',
    payment_amount: 2000,
    change_amount: 200,
    status: 'paid',
    memo: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'inv-5',
    invoice_number: `INV-${TODAY.replace(/-/g, '')}-003`,
    reservation_id: 'res-1',
    patient_id: null,
    patient_name: '山本 太郎',
    clinic_id: 'clinic-1',
    staff_id: 'staff-1',
    visit_date: TODAY,
    items: [makeItem('item-5-1', 'menu-2', 'ほぐし・マッサージ 50分', 4900)],
    subtotal: 4900,
    discount_total: 0,
    tax_rate: 0.1,
    tax_amount: 490,
    total_amount: 5390,
    insurance_type: 'none',
    insurance_copay: 0,
    payment_method: 'cash',
    payment_amount: 0,
    change_amount: 0,
    status: 'unpaid',
    memo: null,
    created_at: NOW,
    updated_at: NOW,
  },
]

let _invoices: Invoice[] = DEMO_INVOICES
let _listeners: Array<() => void> = []

function notifyListeners() { _listeners.forEach((fn) => fn()) }

function notify() {
  notifyListeners()
  secureSet(KEY_ENC, _invoices)
}

export async function hydrateAccountingStore() {
  if (typeof window === 'undefined') return
  const data = await secureGet<Invoice[]>(KEY_ENC)
  if (data && data.length > 0) {
    _invoices = data
    notifyListeners()
  }
}

function genId() {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function genNumber(visitDate: string): string {
  const d = visitDate.replace(/-/g, '')
  const sameDayCount = _invoices.filter((i) => i.visit_date === visitDate).length + 1
  return `INV-${d}-${String(sameDayCount).padStart(3, '0')}`
}

export const accountingStore = {
  getAll: () => _invoices,

  getByDate: (date: string) =>
    _invoices.filter((i) => i.visit_date === date),

  getByDateRange: (from: string, to: string) =>
    _invoices.filter((i) => i.visit_date >= from && i.visit_date <= to),

  getByClinic: (clinicId: string) =>
    _invoices.filter((i) => i.clinic_id === clinicId),

  getById: (id: string) =>
    _invoices.find((i) => i.id === id) ?? null,

  getTodaySales: () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return _invoices
      .filter((i) => i.visit_date === today && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0)
  },

  getMonthSales: () => {
    const month = format(new Date(), 'yyyy-MM')
    return _invoices
      .filter((i) => i.visit_date.startsWith(month) && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0)
  },

  getUnpaidCount: () =>
    _invoices.filter((i) => i.status === 'unpaid').length,

  create: (data: InvoiceFormData): Invoice => {
    const now = new Date().toISOString()
    const item: Invoice = {
      ...data,
      id: genId(),
      invoice_number: genNumber(data.visit_date),
      created_at: now,
      updated_at: now,
    }
    _invoices = [..._invoices, item]
    notify()
    return item
  },

  update: (id: string, data: Partial<Invoice>) => {
    _invoices = _invoices.map((i) =>
      i.id === id ? { ...i, ...data, updated_at: new Date().toISOString() } : i,
    )
    notify()
  },

  delete: (id: string) => {
    _invoices = _invoices.filter((i) => i.id !== id)
    notify()
  },
}

export function useAccountingStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter((l) => l !== fn) }
  }, [])
  return _invoices
}
