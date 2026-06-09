'use client'

import { useState, useEffect } from 'react'
import type { MedicalRecord } from '@/types/medical-record'
import { getSupabaseClient } from './supabase'

let _records: MedicalRecord[] = []
let _listeners: Array<() => void> = []
let _loadPromise: Promise<void> | null = null

function notify() {
  _listeners.forEach((fn) => fn())
}

// ── Data loading ──────────────────────────────────────────

async function loadFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .order('visit_date', { ascending: false })

  if (error) {
    console.error('[medical-record-store] load error:', error.message)
    return
  }

  _records = (data ?? []) as MedicalRecord[]
  notify()
}

// ── Realtime ──────────────────────────────────────────

function setupRealtime() {
  const supabase = getSupabaseClient()

  supabase
    .channel('medical-record-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_records' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        _records = [payload.new as MedicalRecord, ..._records]
        notify()
      } else if (payload.eventType === 'UPDATE') {
        _records = _records.map((r) =>
          r.id === payload.new.id ? (payload.new as MedicalRecord) : r,
        )
        notify()
      } else if (payload.eventType === 'DELETE') {
        _records = _records.filter((r) => r.id !== payload.old.id)
        notify()
      }
    })
    .subscribe()
}

/** Called by StoreHydrationProvider on app startup. Safe to call multiple times. */
export async function hydrateMedicalRecordStore(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!_loadPromise) {
    _loadPromise = loadFromSupabase().then(() => {
      setupRealtime()
    })
  }
  return _loadPromise
}

// ── Store ──────────────────────────────────────────

export const medicalRecordStore = {
  getAll: () => _records,

  getById: (id: string): MedicalRecord | null =>
    _records.find((r) => r.id === id) ?? null,

  getByPatient: (patientId: string): MedicalRecord[] =>
    _records
      .filter((r) => r.patient_id === patientId)
      .sort((a, b) => (a.visit_date > b.visit_date ? -1 : 1)),

  getByReservation: (reservationId: string): MedicalRecord | null =>
    _records.find((r) => r.reservation_id === reservationId) ?? null,

  create: async (
    data: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<MedicalRecord> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: MedicalRecord = {
      ...data,
      id: `opt-${Date.now()}`,
      created_at: now,
      updated_at: now,
    }
    _records = [optimistic, ..._records]
    notify()

    const { data: created, error } = await supabase
      .from('medical_records')
      .insert(data)
      .select()
      .single()

    if (error) {
      _records = _records.filter((r) => r.id !== optimistic.id)
      notify()
      throw error
    }

    _records = _records.map((r) =>
      r.id === optimistic.id ? (created as MedicalRecord) : r,
    )
    notify()
    return created as MedicalRecord
  },

  update: async (id: string, data: Partial<MedicalRecord>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    _records = _records.map((r) =>
      r.id === id ? { ...r, ...data, updated_at: now } : r,
    )
    notify()

    const { error } = await supabase
      .from('medical_records')
      .update({ ...data, updated_at: now })
      .eq('id', id)

    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    _records = _records.filter((r) => r.id !== id)
    notify()

    const { error } = await supabase.from('medical_records').delete().eq('id', id)
    if (error) throw error
  },
}

// ── React hook ──────────────────────────────────────────

export function useMedicalRecordStore(): MedicalRecord[] {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return _records
}
