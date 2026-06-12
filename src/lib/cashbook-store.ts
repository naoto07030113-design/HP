'use client'

import { useState, useEffect } from 'react'
import type { CashbookEntry, CashbookEntryFormData } from '@/types/cashbook'
import { getSupabaseClient } from './supabase'

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _entries: CashbookEntry[] = []
let _listeners: Array<() => void> = []
let _realtimeSubscribed = false

function notifyListeners(): void {
  _listeners.forEach((fn) => fn())
}

function sortEntries(list: CashbookEntry[]): CashbookEntry[] {
  return [...list].sort((a, b) => {
    if (b.entry_date !== a.entry_date) return b.entry_date.localeCompare(a.entry_date)
    return b.created_at.localeCompare(a.created_at)
  })
}

// ---------------------------------------------------------------------------
// Load / realtime
// ---------------------------------------------------------------------------

async function loadAll(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cashbook_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[cashbook-store] load error', error)
    return
  }

  _entries = (data ?? []) as CashbookEntry[]
  notifyListeners()
}

function ensureRealtime(): void {
  if (_realtimeSubscribed) return
  _realtimeSubscribed = true

  const supabase = getSupabaseClient()
  supabase
    .channel('cashbook-entries')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cashbook_entries' },
      () => {
        void loadAll()
      },
    )
    .subscribe()
}

export async function hydrateCashbookStore(): Promise<void> {
  if (typeof window === 'undefined') return
  ensureRealtime()
  await loadAll()
}

// ---------------------------------------------------------------------------
// Store methods
// ---------------------------------------------------------------------------

export const cashbookStore = {
  getAll: (): CashbookEntry[] => _entries,

  getByDateRange: (from: string, to: string): CashbookEntry[] =>
    _entries.filter((e) => e.entry_date >= from && e.entry_date <= to),

  getById: (id: string): CashbookEntry | null =>
    _entries.find((e) => e.id === id) ?? null,

  create: async (data: CashbookEntryFormData): Promise<CashbookEntry> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    const { data: inserted, error } = await supabase
      .from('cashbook_entries')
      .insert({ ...data, created_at: now, updated_at: now })
      .select()
      .single()

    if (error || !inserted) {
      throw new Error(error?.message ?? 'Failed to create cashbook entry')
    }

    const created = inserted as CashbookEntry

    // Optimistic update
    _entries = sortEntries([created, ..._entries])
    notifyListeners()

    return created
  },

  createMany: async (rows: CashbookEntryFormData[]): Promise<CashbookEntry[]> => {
    if (rows.length === 0) return []
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    const { data: inserted, error } = await supabase
      .from('cashbook_entries')
      .insert(rows.map((r) => ({ ...r, created_at: now, updated_at: now })))
      .select()

    if (error || !inserted) {
      throw new Error(error?.message ?? 'Failed to create cashbook entries')
    }

    const created = inserted as CashbookEntry[]

    // Optimistic update
    _entries = sortEntries([...created, ..._entries])
    notifyListeners()

    return created
  },

  update: async (id: string, data: Partial<CashbookEntryFormData>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    // Optimistic update
    _entries = sortEntries(
      _entries.map((e) => (e.id === id ? { ...e, ...data, updated_at: now } : e)),
    )
    notifyListeners()

    const { error } = await supabase
      .from('cashbook_entries')
      .update({ ...data, updated_at: now })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()

    // Optimistic update
    _entries = _entries.filter((e) => e.id !== id)
    notifyListeners()

    const { error } = await supabase.from('cashbook_entries').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useCashbookStore(): CashbookEntry[] {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return _entries
}
