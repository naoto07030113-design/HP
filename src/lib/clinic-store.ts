'use client'

import { useState, useEffect } from 'react'
import type { Clinic, Staff, Menu, Shift, ShiftBlock, Reservation } from '@/types/clinic'
import { getSupabaseClient } from './supabase'

type StoreState = {
  clinics: Clinic[]
  staff: Staff[]
  menus: Menu[]
  shifts: Shift[]
  shiftBlocks: ShiftBlock[]
  reservations: Reservation[]
  loading: boolean
  error: string | null
}

let _state: StoreState = {
  clinics: [],
  staff: [],
  menus: [],
  shifts: [],
  shiftBlocks: [],
  reservations: [],
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
    shiftsRes,
    shiftBlocksRes,
    reservationsRes,
  ] = await Promise.all([
    supabase.from('clinics').select('*').order('sort_order'),
    supabase.from('staff').select('*').order('sort_order'),
    supabase.from('menus').select('*').order('sort_order'),
    supabase.from('shifts').select('*'),
    supabase.from('shift_blocks').select('*'),
    supabase.from('reservations').select('*').order('start_at', { ascending: false }),
  ])

  const errors = [
    clinicsRes.error,
    staffRes.error,
    menusRes.error,
    shiftsRes.error,
    shiftBlocksRes.error,
    reservationsRes.error,
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
    shifts: (shiftsRes.data ?? []) as Shift[],
    shiftBlocks: (shiftBlocksRes.data ?? []) as ShiftBlock[],
    reservations: (reservationsRes.data ?? []) as Reservation[],
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

  supabase
    .channel('clinic-store-shifts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState((s) => ({ ...s, shifts: [...s.shifts, payload.new as Shift] }))
      } else if (payload.eventType === 'UPDATE') {
        setState((s) => ({
          ...s,
          shifts: s.shifts.map((sh) => sh.id === payload.new.id ? (payload.new as Shift) : sh),
        }))
      } else if (payload.eventType === 'DELETE') {
        setState((s) => ({ ...s, shifts: s.shifts.filter((sh) => sh.id !== payload.old.id) }))
      }
    })
    .subscribe()

  supabase
    .channel('clinic-store-shift-blocks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_blocks' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState((s) => ({ ...s, shiftBlocks: [...s.shiftBlocks, payload.new as ShiftBlock] }))
      } else if (payload.eventType === 'UPDATE') {
        setState((s) => ({
          ...s,
          shiftBlocks: s.shiftBlocks.map((b) => b.id === payload.new.id ? (payload.new as ShiftBlock) : b),
        }))
      } else if (payload.eventType === 'DELETE') {
        setState((s) => ({ ...s, shiftBlocks: s.shiftBlocks.filter((b) => b.id !== payload.old.id) }))
      }
    })
    .subscribe()

  supabase
    .channel('clinic-store-reservations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState((s) => ({
          ...s,
          reservations: [payload.new as Reservation, ...s.reservations],
        }))
      } else if (payload.eventType === 'UPDATE') {
        setState((s) => ({
          ...s,
          reservations: s.reservations.map((r) =>
            r.id === payload.new.id ? (payload.new as Reservation) : r,
          ),
        }))
      } else if (payload.eventType === 'DELETE') {
        setState((s) => ({
          ...s,
          reservations: s.reservations.filter((r) => r.id !== payload.old.id),
        }))
      }
    })
    .subscribe()

}

/** Called by StoreHydrationProvider on app startup. Safe to call multiple times. */
export async function hydrateClinicStore(): Promise<void> {
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

// ── Shifts ──────────────────────────────────────────

export const shiftsStore = {
  getAll: () => _state.shifts,
  getByStaffAndDate: (staffId: string, date: string): Shift | null =>
    _state.shifts.find((s) => s.staff_id === staffId && s.work_date === date) ?? null,

  upsert: async (data: Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'staff'>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const existing = _state.shifts.find(
      (s) => s.staff_id === data.staff_id && s.work_date === data.work_date,
    )

    if (existing) {
      setState((s) => ({
        ...s,
        shifts: s.shifts.map((sh) =>
          sh.id === existing.id ? { ...sh, ...data, updated_at: now } : sh,
        ),
      }))
    } else {
      const optimistic: Shift = { ...data, id: `opt-${Date.now()}`, created_at: now, updated_at: now }
      setState((s) => ({ ...s, shifts: [...s.shifts, optimistic] }))
    }

    const { error } = await supabase
      .from('shifts')
      .upsert({ ...data, updated_at: now }, { onConflict: 'staff_id,work_date' })

    if (error) throw error
  },

  delete: async (staffId: string, date: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({
      ...s,
      shifts: s.shifts.filter((sh) => !(sh.staff_id === staffId && sh.work_date === date)),
    }))
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('staff_id', staffId)
      .eq('work_date', date)
    if (error) throw error
  },
}

// ── ShiftBlocks ──────────────────────────────────────────

export const shiftBlocksStore = {
  getAll: () => _state.shiftBlocks,
  getByDate: (date: string) => _state.shiftBlocks.filter((b) => b.block_date === date),

  create: async (data: Omit<ShiftBlock, 'id' | 'created_at' | 'staff'>): Promise<ShiftBlock> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: ShiftBlock = { ...data, id: `opt-${Date.now()}`, created_at: now }
    setState((s) => ({ ...s, shiftBlocks: [...s.shiftBlocks, optimistic] }))

    const { data: created, error } = await supabase
      .from('shift_blocks')
      .insert(data)
      .select()
      .single()

    if (error) {
      setState((s) => ({ ...s, shiftBlocks: s.shiftBlocks.filter((b) => b.id !== optimistic.id) }))
      throw error
    }
    setState((s) => ({
      ...s,
      shiftBlocks: s.shiftBlocks.map((b) => b.id === optimistic.id ? (created as ShiftBlock) : b),
    }))
    return created as ShiftBlock
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, shiftBlocks: s.shiftBlocks.filter((b) => b.id !== id) }))
    const { error } = await supabase.from('shift_blocks').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Reservations ──────────────────────────────────────────

export const reservationsStore = {
  getAll: () => _state.reservations,
  getByDate: (date: string) =>
    _state.reservations.filter((r) => r.start_at.startsWith(date)),
  getByDateRange: (from: string, to: string) =>
    _state.reservations.filter((r) => r.start_at >= from && r.start_at <= to),

  create: async (
    data: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'staff' | 'menu'>,
  ): Promise<Reservation> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: Reservation = { ...data, id: `opt-${Date.now()}`, created_at: now, updated_at: now }
    setState((s) => ({ ...s, reservations: [optimistic, ...s.reservations] }))

    const { data: created, error } = await supabase
      .from('reservations')
      .insert(data)
      .select()
      .single()

    if (error) {
      setState((s) => ({ ...s, reservations: s.reservations.filter((r) => r.id !== optimistic.id) }))
      throw error
    }
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) =>
        r.id === optimistic.id ? (created as Reservation) : r,
      ),
    }))
    return created as Reservation
  },

  update: async (id: string, data: Partial<Reservation>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) =>
        r.id === id ? { ...r, ...data, updated_at: now } : r,
      ),
    }))
    const { error } = await supabase.from('reservations').update({ ...data, updated_at: now }).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, reservations: s.reservations.filter((r) => r.id !== id) }))
    const { error } = await supabase.from('reservations').delete().eq('id', id)
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
export async function resetDemoData(): Promise<void> {
  _loadPromise = null
  setState(() => ({
    clinics: [],
    staff: [],
    menus: [],
    shifts: [],
    shiftBlocks: [],
    reservations: [],
    loading: true,
    error: null,
  }))
  await hydrateClinicStore()
}
