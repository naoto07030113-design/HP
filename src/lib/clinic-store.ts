'use client'

import { useState, useEffect } from 'react'
import type { Clinic, Staff, Menu } from '@/types/clinic'
import { getSupabaseClient } from './supabase'

type StoreState = {
  clinics: Clinic[]
  staff: Staff[]
  menus: Menu[]
  loading: boolean
  error: string | null
}

let _state: StoreState = {
  clinics: [],
  staff: [],
  menus: [],
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

// ── Data loading ──────────────────────────────────────────

async function loadFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient()

  setState((s) => ({ ...s, loading: true, error: null }))

  const [
    clinicsRes,
    staffRes,
    menusRes,
  ] = await Promise.all([
    supabase.from('clinics').select('*').order('sort_order'),
    supabase.from('staff').select('*').order('sort_order'),
    supabase.from('menus').select('*').order('sort_order'),
  ])

  const errors = [
    clinicsRes.error,
    staffRes.error,
    menusRes.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    setState((s) => ({ ...s, loading: false, error: errors[0]!.message }))
    return
  }

  setState((s) => ({
    ...s,
    clinics: (clinicsRes.data ?? []) as Clinic[],
    staff: (staffRes.data ?? []) as Staff[],
    menus: (menusRes.data ?? []) as Menu[],
    loading: false,
    error: null,
  }))
}

// ── Realtime subscriptions ──────────────────────────────────────────

function setupRealtime() {
  const supabase = getSupabaseClient()

  supabase
    .channel('clinic-store-clinics')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState((s) => ({ ...s, clinics: [...s.clinics, payload.new as Clinic] }))
      } else if (payload.eventType === 'UPDATE') {
        setState((s) => ({
          ...s,
          clinics: s.clinics.map((c) => c.id === payload.new.id ? (payload.new as Clinic) : c),
        }))
      } else if (payload.eventType === 'DELETE') {
        setState((s) => ({ ...s, clinics: s.clinics.filter((c) => c.id !== payload.old.id) }))
      }
    })
    .subscribe()

  supabase
    .channel('clinic-store-staff')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState((s) => ({ ...s, staff: [...s.staff, payload.new as Staff] }))
      } else if (payload.eventType === 'UPDATE') {
        setState((s) => ({
          ...s,
          staff: s.staff.map((m) => m.id === payload.new.id ? (payload.new as Staff) : m),
        }))
      } else if (payload.eventType === 'DELETE') {
        setState((s) => ({ ...s, staff: s.staff.filter((m) => m.id !== payload.old.id) }))
      }
    })
    .subscribe()

  supabase
    .channel('clinic-store-menus')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menus' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState((s) => ({ ...s, menus: [...s.menus, payload.new as Menu] }))
      } else if (payload.eventType === 'UPDATE') {
        setState((s) => ({
          ...s,
          menus: s.menus.map((m) => m.id === payload.new.id ? (payload.new as Menu) : m),
        }))
      } else if (payload.eventType === 'DELETE') {
        setState((s) => ({ ...s, menus: s.menus.filter((m) => m.id !== payload.old.id) }))
      }
    })
    .subscribe()

}

/**
 * 起動時に StoreHydrationProvider から呼ばれる。何度呼んでも安全。
 *
 * ここで読むのは院・スタッフ・メニューだけ。いずれも患者向けページにも出る公開情報で、
 * 患者側と管理側で内容が変わらないため scope は受け取るだけで使っていない
 * （呼び出し側の意図を残すために引数は残す）。
 * 予約・シフトはここでは読まない。必要な画面が API から期間で引く。
 */
export async function hydrateClinicStore(_scope: 'admin' | 'public' = 'admin'): Promise<void> {
  if (typeof window === 'undefined') return
  if (!_loadPromise) {
    _loadPromise = loadFromSupabase().then(() => {
      setupRealtime()
    })
  }
  return _loadPromise
}

// ── Clinics ──────────────────────────────────────────

export const clinicsStore = {
  getAll: () => _state.clinics,

  create: async (data: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>): Promise<Clinic> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: Clinic = { ...data, id: `opt-${Date.now()}`, created_at: now, updated_at: now }
    setState((s) => ({ ...s, clinics: [...s.clinics, optimistic] }))

    const { data: created, error } = await supabase
      .from('clinics')
      .insert(data)
      .select()
      .single()

    if (error) {
      setState((s) => ({ ...s, clinics: s.clinics.filter((c) => c.id !== optimistic.id) }))
      throw error
    }
    setState((s) => ({
      ...s,
      clinics: s.clinics.map((c) => c.id === optimistic.id ? (created as Clinic) : c),
    }))
    return created as Clinic
  },

  update: async (id: string, data: Partial<Clinic>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      clinics: s.clinics.map((c) => c.id === id ? { ...c, ...data, updated_at: now } : c),
    }))
    const { error } = await supabase.from('clinics').update({ ...data, updated_at: now }).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, clinics: s.clinics.filter((c) => c.id !== id) }))
    const { error } = await supabase.from('clinics').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Staff ──────────────────────────────────────────

export const staffStore = {
  getAll: () => _state.staff,
  getByClinic: (clinicId: string) => _state.staff.filter((s) => s.clinic_id === clinicId),

  create: async (data: Omit<Staff, 'id' | 'created_at' | 'updated_at' | 'clinic'>): Promise<Staff> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: Staff = { ...data, id: `opt-${Date.now()}`, created_at: now, updated_at: now }
    setState((s) => ({ ...s, staff: [...s.staff, optimistic] }))

    const { data: created, error } = await supabase
      .from('staff')
      .insert(data)
      .select()
      .single()

    if (error) {
      setState((s) => ({ ...s, staff: s.staff.filter((m) => m.id !== optimistic.id) }))
      throw error
    }
    setState((s) => ({
      ...s,
      staff: s.staff.map((m) => m.id === optimistic.id ? (created as Staff) : m),
    }))
    return created as Staff
  },

  update: async (id: string, data: Partial<Staff>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      staff: s.staff.map((m) => m.id === id ? { ...m, ...data, updated_at: now } : m),
    }))
    const { error } = await supabase.from('staff').update({ ...data, updated_at: now }).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, staff: s.staff.filter((m) => m.id !== id) }))
    const { error } = await supabase.from('staff').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Menus ──────────────────────────────────────────

export const menusStore = {
  getAll: () => _state.menus,
  getByClinic: (clinicId: string) => _state.menus.filter((m) => m.clinic_id === clinicId),

  create: async (data: Omit<Menu, 'id' | 'created_at' | 'updated_at'>): Promise<Menu> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: Menu = { ...data, id: `opt-${Date.now()}`, created_at: now, updated_at: now }
    setState((s) => ({ ...s, menus: [...s.menus, optimistic] }))

    const { data: created, error } = await supabase
      .from('menus')
      .insert(data)
      .select()
      .single()

    if (error) {
      setState((s) => ({ ...s, menus: s.menus.filter((m) => m.id !== optimistic.id) }))
      throw error
    }
    setState((s) => ({
      ...s,
      menus: s.menus.map((m) => m.id === optimistic.id ? (created as Menu) : m),
    }))
    return created as Menu
  },

  update: async (id: string, data: Partial<Menu>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      menus: s.menus.map((m) => m.id === id ? { ...m, ...data, updated_at: now } : m),
    }))
    const { error } = await supabase.from('menus').update({ ...data, updated_at: now }).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, menus: s.menus.filter((m) => m.id !== id) }))
    const { error } = await supabase.from('menus').delete().eq('id', id)
    if (error) throw error
  },
}

// ── React hook ──────────────────────────────────────────

export function useClinicStore() {
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

// ── Reset / reload ──────────────────────────────────────────

/** Clears local state and reloads from Supabase. Does not insert any demo data. */
export async function reloadFromServer(): Promise<void> {
  _loadPromise = null
  setState(() => ({
    clinics: [],
    staff: [],
    menus: [],
    loading: true,
    error: null,
  }))
  await hydrateClinicStore()
}
