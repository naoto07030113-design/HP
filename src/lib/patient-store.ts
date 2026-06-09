'use client'

import { useState, useEffect } from 'react'
import type { Patient } from '@/types/patient'
import { getSupabaseClient } from './supabase'

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let _patients: Patient[] = []
let _listeners: Array<() => void> = []
let _loadPromise: Promise<void> | null = null

function notify() {
  _listeners.forEach((fn) => fn())
}

// ---------------------------------------------------------------------------
// Supabase load + realtime
// ---------------------------------------------------------------------------

function setupRealtime() {
  const supabase = getSupabaseClient()

  supabase
    .channel('patients-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'patients' },
      (payload) => {
        const incoming = payload.new as Patient
        const exists = _patients.some((p) => p.id === incoming.id)
        if (!exists) {
          _patients = [incoming, ..._patients]
          notify()
        }
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'patients' },
      (payload) => {
        const updated = payload.new as Patient
        _patients = _patients.map((p) => (p.id === updated.id ? updated : p))
        notify()
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'patients' },
      (payload) => {
        const deleted = payload.old as Pick<Patient, 'id'>
        _patients = _patients.filter((p) => p.id !== deleted.id)
        notify()
      },
    )
    .subscribe()
}

async function loadPatients(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[patient-store] load error:', error.message)
    return
  }

  _patients = (data ?? []) as Patient[]
  notify()
  setupRealtime()
}

// ---------------------------------------------------------------------------
// Hydration (called once by StoreHydrationProvider)
// ---------------------------------------------------------------------------

export async function hydratePatientStore(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!_loadPromise) {
    _loadPromise = loadPatients()
  }
  return _loadPromise
}

// ---------------------------------------------------------------------------
// patientStore — public CRUD API
// ---------------------------------------------------------------------------

export const patientStore = {
  getAll: (): Patient[] => _patients,

  getById: (id: string): Patient | null =>
    _patients.find((p) => p.id === id) ?? null,

  getByClinic: (clinicId: string): Patient[] =>
    _patients.filter((p) => p.clinic_id === clinicId),

  search: (query: string, clinicId?: string): Patient[] => {
    const q = query.toLowerCase()
    return _patients.filter((p) => {
      if (clinicId && p.clinic_id !== clinicId) return false
      return (
        p.name.includes(q) ||
        p.name_kana.toLowerCase().includes(q) ||
        (p.phone ?? '').replace(/-/g, '').includes(q.replace(/-/g, '')) ||
        (p.email ?? '').toLowerCase().includes(q)
      )
    })
  },

  create: async (
    data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Patient> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    // Optimistic local insert with a temporary id
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const optimistic: Patient = { ...data, id: tempId, created_at: now, updated_at: now }
    _patients = [optimistic, ..._patients]
    notify()

    const { data: inserted, error } = await supabase
      .from('patients')
      .insert(data)
      .select()
      .single()

    if (error) {
      // Roll back optimistic insert
      _patients = _patients.filter((p) => p.id !== tempId)
      notify()
      throw new Error(error.message)
    }

    const confirmed = inserted as Patient
    // Replace optimistic record with confirmed one from DB
    _patients = _patients.map((p) => (p.id === tempId ? confirmed : p))
    notify()
    return confirmed
  },

  update: async (id: string, data: Partial<Patient>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    // Optimistic update
    const prev = _patients.find((p) => p.id === id)
    _patients = _patients.map((p) =>
      p.id === id ? { ...p, ...data, updated_at: now } : p,
    )
    notify()

    const { error } = await supabase
      .from('patients')
      .update({ ...data, updated_at: now })
      .eq('id', id)

    if (error) {
      // Roll back
      if (prev) {
        _patients = _patients.map((p) => (p.id === id ? prev : p))
      }
      notify()
      throw new Error(error.message)
    }
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()

    // Optimistic delete
    const prev = _patients.find((p) => p.id === id)
    _patients = _patients.filter((p) => p.id !== id)
    notify()

    const { error } = await supabase.from('patients').delete().eq('id', id)

    if (error) {
      // Roll back
      if (prev) {
        _patients = [..._patients, prev].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      }
      notify()
      throw new Error(error.message)
    }
  },
}

// ---------------------------------------------------------------------------
// usePatientStore — React hook
// ---------------------------------------------------------------------------

export function usePatientStore(): Patient[] {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])

  return _patients
}
