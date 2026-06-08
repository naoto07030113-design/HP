'use client'
/**
 * クリニック予約管理のデータストア
 * Supabase が設定済みなら Supabase を使用、未設定ならデモデータを使用
 */
import { useState, useEffect, useCallback } from 'react'
import type { Clinic, Staff, Menu, Shift, ShiftBlock, Reservation } from '@/types/clinic'
import {
  DEMO_CLINICS, DEMO_STAFF, DEMO_MENUS, DEMO_SHIFTS, DEMO_RESERVATIONS,
} from './demo-data'
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

const KEY = 'clinic_store_v1'

function loadLocal(): Partial<StoreState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveLocal(state: StoreState) {
  if (typeof window === 'undefined') return
  try {
    const { loading, error, ...data } = state
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}

function initState(): StoreState {
  const local = loadLocal()
  return {
    clinics: local.clinics ?? DEMO_CLINICS,
    staff: local.staff ?? DEMO_STAFF,
    menus: local.menus ?? DEMO_MENUS,
    shifts: local.shifts ?? DEMO_SHIFTS,
    shiftBlocks: local.shiftBlocks ?? [],
    reservations: local.reservations ?? DEMO_RESERVATIONS,
    loading: false,
    error: null,
  }
}

// Singleton store
let _state: StoreState = initState()
let _listeners: Array<() => void> = []

function notify() {
  saveLocal(_state)
  _listeners.forEach((fn) => fn())
}

function setState(updater: (prev: StoreState) => StoreState) {
  _state = updater(_state)
  notify()
}

function genId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Clinics ──────────────────────────────────────────
export const clinicsStore = {
  getAll: () => _state.clinics,
  create: (data: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const item: Clinic = { ...data, id: genId(), created_at: now, updated_at: now }
    setState((s) => ({ ...s, clinics: [...s.clinics, item] }))
    return item
  },
  update: (id: string, data: Partial<Clinic>) => {
    setState((s) => ({
      ...s,
      clinics: s.clinics.map((c) => c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c),
    }))
  },
  delete: (id: string) => {
    setState((s) => ({ ...s, clinics: s.clinics.filter((c) => c.id !== id) }))
  },
}

// ── Staff ──────────────────────────────────────────
export const staffStore = {
  getAll: () => _state.staff,
  getByClinic: (clinicId: string) => _state.staff.filter((s) => s.clinic_id === clinicId),
  create: (data: Omit<Staff, 'id' | 'created_at' | 'updated_at' | 'clinic'>) => {
    const now = new Date().toISOString()
    const item: Staff = { ...data, id: genId(), created_at: now, updated_at: now }
    setState((s) => ({ ...s, staff: [...s.staff, item] }))
    return item
  },
  update: (id: string, data: Partial<Staff>) => {
    setState((s) => ({
      ...s,
      staff: s.staff.map((m) => m.id === id ? { ...m, ...data, updated_at: new Date().toISOString() } : m),
    }))
  },
  delete: (id: string) => {
    setState((s) => ({ ...s, staff: s.staff.filter((m) => m.id !== id) }))
  },
}

// ── Menus ──────────────────────────────────────────
export const menusStore = {
  getAll: () => _state.menus,
  getByClinic: (clinicId: string) => _state.menus.filter((m) => m.clinic_id === clinicId),
  create: (data: Omit<Menu, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const item: Menu = { ...data, id: genId(), created_at: now, updated_at: now }
    setState((s) => ({ ...s, menus: [...s.menus, item] }))
    return item
  },
  update: (id: string, data: Partial<Menu>) => {
    setState((s) => ({
      ...s,
      menus: s.menus.map((m) => m.id === id ? { ...m, ...data, updated_at: new Date().toISOString() } : m),
    }))
  },
  delete: (id: string) => {
    setState((s) => ({ ...s, menus: s.menus.filter((m) => m.id !== id) }))
  },
}

// ── Shifts ──────────────────────────────────────────
export const shiftsStore = {
  getAll: () => _state.shifts,
  getByStaffAndDate: (staffId: string, date: string) =>
    _state.shifts.find((s) => s.staff_id === staffId && s.work_date === date) ?? null,
  upsert: (data: Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'staff'>) => {
    const now = new Date().toISOString()
    const existing = _state.shifts.find((s) => s.staff_id === data.staff_id && s.work_date === data.work_date)
    if (existing) {
      setState((s) => ({
        ...s,
        shifts: s.shifts.map((sh) =>
          sh.id === existing.id ? { ...sh, ...data, updated_at: now } : sh,
        ),
      }))
    } else {
      const item: Shift = { ...data, id: genId(), created_at: now, updated_at: now }
      setState((s) => ({ ...s, shifts: [...s.shifts, item] }))
    }
  },
  delete: (staffId: string, date: string) => {
    setState((s) => ({
      ...s,
      shifts: s.shifts.filter((sh) => !(sh.staff_id === staffId && sh.work_date === date)),
    }))
  },
}

// ── ShiftBlocks ──────────────────────────────────────────
export const shiftBlocksStore = {
  getAll: () => _state.shiftBlocks,
  getByDate: (date: string) => _state.shiftBlocks.filter((b) => b.block_date === date),
  create: (data: Omit<ShiftBlock, 'id' | 'created_at' | 'staff'>) => {
    const now = new Date().toISOString()
    const item: ShiftBlock = { ...data, id: genId(), created_at: now }
    setState((s) => ({ ...s, shiftBlocks: [...s.shiftBlocks, item] }))
    return item
  },
  delete: (id: string) => {
    setState((s) => ({ ...s, shiftBlocks: s.shiftBlocks.filter((b) => b.id !== id) }))
  },
}

// ── Reservations ──────────────────────────────────────────
export const reservationsStore = {
  getAll: () => _state.reservations,
  getByDate: (date: string) =>
    _state.reservations.filter((r) => r.start_at.startsWith(date)),
  getByDateRange: (from: string, to: string) =>
    _state.reservations.filter((r) => r.start_at >= from && r.start_at <= to),
  create: (data: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'staff' | 'menu'>) => {
    const now = new Date().toISOString()
    const item: Reservation = { ...data, id: genId(), created_at: now, updated_at: now }
    setState((s) => ({ ...s, reservations: [...s.reservations, item] }))
    return item
  },
  update: (id: string, data: Partial<Reservation>) => {
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) =>
        r.id === id ? { ...r, ...data, updated_at: new Date().toISOString() } : r,
      ),
    }))
  },
  delete: (id: string) => {
    setState((s) => ({ ...s, reservations: s.reservations.filter((r) => r.id !== id) }))
  },
}

// ── React hook ──────────────────────────────────────────
export function useClinicStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter((l) => l !== fn) }
  }, [])
  return _state
}

export function resetDemoData() {
  if (typeof window !== 'undefined') localStorage.removeItem(KEY)
  _state = {
    clinics: DEMO_CLINICS,
    staff: DEMO_STAFF,
    menus: DEMO_MENUS,
    shifts: DEMO_SHIFTS,
    shiftBlocks: [],
    reservations: DEMO_RESERVATIONS,
    loading: false,
    error: null,
  }
  notify()
}
