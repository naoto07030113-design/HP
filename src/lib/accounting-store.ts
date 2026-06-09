'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { Invoice, InvoiceItem, InvoiceFormData } from '@/types/accounting'
import { getSupabaseClient } from './supabase'

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _invoices: Invoice[] = []
let _listeners: Array<() => void> = []
let _realtimeSubscribed = false

function notifyListeners(): void {
  _listeners.forEach((fn) => fn())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRow(inv: Record<string, unknown>): Invoice {
  const raw = inv as Record<string, unknown> & { invoice_items?: unknown[] }
  const items: InvoiceItem[] = Array.isArray(raw.invoice_items)
    ? (raw.invoice_items as InvoiceItem[])
    : []
  const { invoice_items: _discarded, ...rest } = raw
  void _discarded
  return { ...(rest as Omit<Invoice, 'items'>), items }
}

function genNumber(visitDate: string, existingCount: number): string {
  const d = visitDate.replace(/-/g, '')
  const seq = existingCount + 1
  return `INV-${d}-${String(seq).padStart(3, '0')}`
}

// ---------------------------------------------------------------------------
// Load / realtime
// ---------------------------------------------------------------------------

async function loadAll(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[accounting-store] load error', error)
    return
  }

  _invoices = (data ?? []).map(mapRow)
  notifyListeners()
}

function ensureRealtime(): void {
  if (_realtimeSubscribed) return
  _realtimeSubscribed = true

  const supabase = getSupabaseClient()
  supabase
    .channel('accounting-invoices')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'invoices' },
      () => {
        void loadAll()
      },
    )
    .subscribe()
}

export async function hydrateAccountingStore(): Promise<void> {
  if (typeof window === 'undefined') return
  ensureRealtime()
  await loadAll()
}

// ---------------------------------------------------------------------------
// Store methods
// ---------------------------------------------------------------------------

export const accountingStore = {
  getAll: (): Invoice[] => _invoices,

  getByDate: (date: string): Invoice[] =>
    _invoices.filter((i) => i.visit_date === date),

  getByDateRange: (from: string, to: string): Invoice[] =>
    _invoices.filter((i) => i.visit_date >= from && i.visit_date <= to),

  getById: (id: string): Invoice | null =>
    _invoices.find((i) => i.id === id) ?? null,

  getTodaySales: (): number => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return _invoices
      .filter((i) => i.visit_date === today && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0)
  },

  getMonthSales: (): number => {
    const month = format(new Date(), 'yyyy-MM')
    return _invoices
      .filter((i) => i.visit_date.startsWith(month) && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0)
  },

  getUnpaidCount: (): number =>
    _invoices.filter((i) => i.status === 'unpaid').length,

  create: async (data: InvoiceFormData): Promise<Invoice> => {
    const supabase = getSupabaseClient()

    // Count existing invoices for that visit_date to generate a unique number
    const sameDayCount = _invoices.filter(
      (i) => i.visit_date === data.visit_date,
    ).length
    const invoice_number = genNumber(data.visit_date, sameDayCount)
    const now = new Date().toISOString()

    // Build the row without items
    const { items, ...invoiceFields } = data
    const invoiceRow = {
      ...invoiceFields,
      invoice_number,
      created_at: now,
      updated_at: now,
    }

    const { data: inserted, error: insertError } = await supabase
      .from('invoices')
      .insert(invoiceRow)
      .select()
      .single()

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? 'Failed to create invoice')
    }

    // Insert items
    if (items.length > 0) {
      const itemRows = items.map((item) => ({
        ...item,
        invoice_id: inserted.id as string,
      }))
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemRows)
      if (itemsError) {
        throw new Error(itemsError.message)
      }
    }

    const created: Invoice = { ...(inserted as Omit<Invoice, 'items'>), items }

    // Optimistic update
    _invoices = [created, ..._invoices].sort((a, b) => {
      if (b.visit_date !== a.visit_date) return b.visit_date.localeCompare(a.visit_date)
      return b.created_at.localeCompare(a.created_at)
    })
    notifyListeners()

    return created
  },

  update: async (id: string, data: Partial<InvoiceFormData>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    const { items, ...invoiceFields } = data as Partial<InvoiceFormData>

    // Optimistic update
    _invoices = _invoices.map((i) =>
      i.id === id
        ? {
            ...i,
            ...invoiceFields,
            items: items ?? i.items,
            updated_at: now,
          }
        : i,
    )
    notifyListeners()

    // Persist invoice fields
    if (Object.keys(invoiceFields).length > 0) {
      const { error } = await supabase
        .from('invoices')
        .update({ ...invoiceFields, updated_at: now })
        .eq('id', id)
      if (error) throw new Error(error.message)
    }

    // Replace items if provided
    if (items !== undefined) {
      const { error: delError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id)
      if (delError) throw new Error(delError.message)

      if (items.length > 0) {
        const itemRows = items.map((item) => ({ ...item, invoice_id: id }))
        const { error: insError } = await supabase
          .from('invoice_items')
          .insert(itemRows)
        if (insError) throw new Error(insError.message)
      }
    }
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()

    // Optimistic update
    _invoices = _invoices.filter((i) => i.id !== id)
    notifyListeners()

    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useAccountingStore(): Invoice[] {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return _invoices
}
