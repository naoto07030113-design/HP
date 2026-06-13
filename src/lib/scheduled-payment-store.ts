'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import type { ScheduledPayment, ScheduledPaymentFormData } from '@/types/cashbook'
import { getSupabaseClient } from './supabase'

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _payments: ScheduledPayment[] = []
let _listeners: Array<() => void> = []
let _realtimeSubscribed = false

function notifyListeners(): void {
  _listeners.forEach((fn) => fn())
}

function sortPayments(list: ScheduledPayment[]): ScheduledPayment[] {
  return [...list].sort((a, b) => a.due_date.localeCompare(b.due_date) || a.created_at.localeCompare(b.created_at))
}

// ---------------------------------------------------------------------------
// Load / realtime
// ---------------------------------------------------------------------------

async function loadAll(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('[scheduled-payment-store] load error', error)
    return
  }

  _payments = sortPayments((data ?? []) as ScheduledPayment[])
  notifyListeners()
}

function ensureRealtime(): void {
  if (_realtimeSubscribed) return
  _realtimeSubscribed = true

  const supabase = getSupabaseClient()
  supabase
    .channel('scheduled-payments')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'scheduled_payments' },
      () => {
        void loadAll()
      },
    )
    .subscribe()
}

export async function hydrateScheduledPaymentStore(): Promise<void> {
  if (typeof window === 'undefined') return
  ensureRealtime()
  await loadAll()
}

// ---------------------------------------------------------------------------
// Store methods
// ---------------------------------------------------------------------------

export const scheduledPaymentStore = {
  getAll: (): ScheduledPayment[] => _payments,

  getPending: (): ScheduledPayment[] =>
    _payments.filter((p) => p.status === 'pending'),

  // 通知対象: 振込期日の前日以降（前日・当日・期日超過）で未払いのもの
  getDueSoon: (): ScheduledPayment[] => {
    const notifyFrom = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    return _payments.filter((p) => p.status === 'pending' && p.due_date <= notifyFrom)
  },

  create: async (data: ScheduledPaymentFormData): Promise<ScheduledPayment> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    const { data: inserted, error } = await supabase
      .from('scheduled_payments')
      .insert({ ...data, created_at: now, updated_at: now })
      .select()
      .single()

    if (error || !inserted) {
      throw new Error(error?.message ?? 'Failed to create scheduled payment')
    }

    const created = inserted as ScheduledPayment

    // Optimistic update
    _payments = sortPayments([created, ..._payments])
    notifyListeners()

    return created
  },

  update: async (id: string, data: Partial<ScheduledPaymentFormData>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    // Optimistic update
    _payments = sortPayments(
      _payments.map((p) => (p.id === id ? { ...p, ...data, updated_at: now } : p)),
    )
    notifyListeners()

    const { error } = await supabase
      .from('scheduled_payments')
      .update({ ...data, updated_at: now })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()

    // Optimistic update
    _payments = _payments.filter((p) => p.id !== id)
    notifyListeners()

    const { error } = await supabase.from('scheduled_payments').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useScheduledPaymentStore(): ScheduledPayment[] {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return _payments
}
