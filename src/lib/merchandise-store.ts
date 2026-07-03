'use client'

import { useState, useEffect } from 'react'
import type { Merchandise, MerchandiseBooking, MerchandiseFormData, MerchandiseBookingFormData } from '@/types/merchandise'
import { getSupabaseClient } from './supabase'

type StoreState = {
  merchandise: Merchandise[]
  bookings: MerchandiseBooking[]
  loading: boolean
  error: string | null
}

let _state: StoreState = {
  merchandise: [],
  bookings: [],
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

async function loadFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient()
  setState((s) => ({ ...s, loading: true, error: null }))

  const [mercRes, bookRes] = await Promise.all([
    supabase.from('merchandise').select('*').order('sort_order'),
    supabase.from('merchandise_bookings').select('*, merchandise(*)').order('booked_at', { ascending: false }),
  ])

  // 予約一覧はスタッフ専用（患者側の匿名アクセスでは読めない）ため、
  // 商品一覧と独立して処理し、片方の失敗でもう片方を壊さない
  if (mercRes.error) {
    setState((s) => ({ ...s, loading: false, error: mercRes.error!.message }))
    return
  }

  setState((s) => ({
    ...s,
    merchandise: (mercRes.data ?? []) as Merchandise[],
    bookings: bookRes.error ? s.bookings : ((bookRes.data ?? []) as MerchandiseBooking[]),
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

  supabase
    .channel('merchandise-store-bookings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'merchandise_bookings' }, () => {
      loadFromSupabase()
    })
    .subscribe()
}

export async function hydrateMerchandiseStore(): Promise<void> {
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

// ── Bookings CRUD ──────────────────────────────────────────

export const merchandiseBookingsStore = {
  getAll: () => _state.bookings,
  getByClinic: (clinicId: string) => _state.bookings.filter((b) => b.clinic_id === clinicId),
  getByMerchandise: (mercId: string) => _state.bookings.filter((b) => b.merchandise_id === mercId),

  create: async (data: MerchandiseBookingFormData): Promise<MerchandiseBooking> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    // 患者(anon)は予約一覧の閲覧権限を持たないため、RETURNING(.select())を使わず
    // IDをクライアント側で発行して挿入する
    const id = crypto.randomUUID()
    const { error } = await supabase
      .from('merchandise_bookings')
      .insert({ ...data, id, booked_at: now })
    if (error) throw error
    const booking: MerchandiseBooking = {
      ...data,
      id,
      booked_at: now,
      created_at: now,
      updated_at: now,
    } as MerchandiseBooking
    setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }))
    return booking
  },

  updateStatus: async (id: string, status: MerchandiseBooking['status']): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => b.id === id ? { ...b, status, updated_at: now } : b),
    }))
    const { error } = await supabase.from('merchandise_bookings').update({ status, updated_at: now }).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) }))
    const { error } = await supabase.from('merchandise_bookings').delete().eq('id', id)
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
