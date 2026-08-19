'use client'

import { useState, useEffect } from 'react'
import type { Merchandise, MerchandiseFormData } from '@/types/merchandise'
import { getSupabaseClient } from './supabase'

type StoreState = {
  merchandise: Merchandise[]
  loading: boolean
  error: string | null
}

let _state: StoreState = {
  merchandise: [],
  loading: true,
  error: null,
}
let _listeners: Array<() => void> = []
let _loadPromise: Promise<void> | null = null

function notify() {
  _listeners.forEach((fn) => fn())
}

function setState(updater: (prev: StoreState) => StoreState) {
  _state = updater(_state)
  notify()
}

/**
 * 商品一覧だけを読む。
 *
 * 物販予約には患者の氏名・電話番号が入るため、ここでは読まない。
 * 管理画面は /api/v1/merchandise/bookings/* から所属院の分だけを引く。
 */
async function loadFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient()
  setState((s) => ({ ...s, loading: true, error: null }))

  const { data, error } = await supabase.from('merchandise').select('*').order('sort_order')

  if (error) {
    setState((s) => ({ ...s, loading: false, error: error.message }))
    return
  }

  setState((s) => ({
    ...s,
    merchandise: (data ?? []) as Merchandise[],
    loading: false,
    error: null,
  }))
}

function setupRealtime() {
  const supabase = getSupabaseClient()

  supabase
    .channel('merchandise-store-products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'merchandise' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState((s) => ({ ...s, merchandise: [...s.merchandise, payload.new as Merchandise] }))
      } else if (payload.eventType === 'UPDATE') {
        setState((s) => ({
          ...s,
          merchandise: s.merchandise.map((m) => m.id === payload.new.id ? (payload.new as Merchandise) : m),
        }))
      } else if (payload.eventType === 'DELETE') {
        setState((s) => ({ ...s, merchandise: s.merchandise.filter((m) => m.id !== payload.old.id) }))
      }
    })
    .subscribe()

}

export async function hydrateMerchandiseStore(_scope: 'admin' | 'public' = 'admin'): Promise<void> {
  if (typeof window === 'undefined') return
  if (!_loadPromise) {
    _loadPromise = loadFromSupabase().then(() => {
      setupRealtime()
    })
  }
  return _loadPromise
}

// ── Merchandise CRUD ──────────────────────────────────────────

export const merchandiseStore = {
  getAll: () => _state.merchandise,
  getByClinic: (clinicId: string) => _state.merchandise.filter((m) => m.clinic_id === clinicId),
  getActive: (clinicId: string) => _state.merchandise.filter((m) => m.clinic_id === clinicId && m.is_active),

  create: async (data: MerchandiseFormData): Promise<Merchandise> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: Merchandise = { ...data, id: `opt-${Date.now()}`, created_at: now, updated_at: now }
    setState((s) => ({ ...s, merchandise: [...s.merchandise, optimistic] }))

    const { data: created, error } = await supabase.from('merchandise').insert(data).select().single()
    if (error) {
      setState((s) => ({ ...s, merchandise: s.merchandise.filter((m) => m.id !== optimistic.id) }))
      throw error
    }
    setState((s) => ({
      ...s,
      merchandise: s.merchandise.map((m) => m.id === optimistic.id ? (created as Merchandise) : m),
    }))
    return created as Merchandise
  },

  update: async (id: string, data: Partial<Merchandise>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      merchandise: s.merchandise.map((m) => m.id === id ? { ...m, ...data, updated_at: now } : m),
    }))
    const { error } = await supabase.from('merchandise').update({ ...data, updated_at: now }).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, merchandise: s.merchandise.filter((m) => m.id !== id) }))
    const { error } = await supabase.from('merchandise').delete().eq('id', id)
    if (error) throw error
  },
}

// ── React hook ──────────────────────────────────────────

export function useMerchandiseStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return _state
}
