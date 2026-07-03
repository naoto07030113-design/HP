'use client'

import { useState, useEffect } from 'react'
import type { ClosedDay, ClosedDayFormData, ClosedDayCloseType } from '@/types/clinic'
import { getSupabaseClient } from './supabase'

type StoreState = {
  closedDays: ClosedDay[]
  loading: boolean
}

let _state: StoreState = { closedDays: [], loading: true }
let _listeners: Array<() => void> = []
let _loadPromise: Promise<void> | null = null

function notify() { _listeners.forEach((fn) => fn()) }
function setState(updater: (prev: StoreState) => StoreState) {
  _state = updater(_state)
  notify()
}

async function loadAll(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('closed_days')
    .select('*')
    .order('closed_date', { ascending: true, nullsFirst: false })

  if (error) {
    setState((s) => ({ ...s, loading: false }))
    return
  }
  setState(() => ({ closedDays: (data ?? []) as ClosedDay[], loading: false }))
}

function setupRealtime() {
  const supabase = getSupabaseClient()
  supabase
    .channel('closed-days-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'closed_days' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState((s) => ({ ...s, closedDays: [...s.closedDays, payload.new as ClosedDay] }))
      } else if (payload.eventType === 'UPDATE') {
        setState((s) => ({
          ...s,
          closedDays: s.closedDays.map((d) => d.id === payload.new.id ? (payload.new as ClosedDay) : d),
        }))
      } else if (payload.eventType === 'DELETE') {
        setState((s) => ({
          ...s,
          closedDays: s.closedDays.filter((d) => d.id !== payload.old.id),
        }))
      }
    })
    .subscribe()
}

export async function hydrateClosedDaysStore(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!_loadPromise) {
    _loadPromise = loadAll().then(() => { setupRealtime() })
  }
  return _loadPromise
}

// ── 時間変換ユーティリティ ──────────────────────────────────────────

// ── Store API ──────────────────────────────────────────

export const closedDaysStore = {
  getAll: () => _state.closedDays,

  getByClinic: (clinicId: string) =>
    _state.closedDays.filter((d) => d.clinic_id === null || d.clinic_id === clinicId),

  /**
   * 指定日・院に対する休診情報を返す。
   * - allDay: true なら終日休診（予約不可）
   * - closedFrom/closedTo: 部分休診の開始〜終了時刻 'HH:MM'
   */
  getClosureForDate(date: Date, clinicId: string): {
    allDay: boolean
    closedFrom: string | null
    closedTo: string | null
  } | null {
    const entries = this.getByClinic(clinicId)
    const dow = date.getDay()
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    const matched = entries.filter((d) => {
      if (d.repeat_type === 'weekly') return d.day_of_week === dow
      return d.closed_date === dateStr
    })

    if (matched.length === 0) return null

    // 終日休診が1件でもあれば終日
    if (matched.some((d) => d.close_type === 'all_day')) {
      return { allDay: true, closedFrom: null, closedTo: null }
    }

    // 部分休診: 最初の1件を時間帯に変換
    const first = matched[0]
    switch (first.close_type) {
      case 'morning':
        return { allDay: false, closedFrom: '00:00', closedTo: '12:00' }
      case 'afternoon':
        return { allDay: false, closedFrom: '12:00', closedTo: '23:59' }
      case 'time_range':
        return { allDay: false, closedFrom: first.close_from, closedTo: first.close_to }
      default:
        return { allDay: true, closedFrom: null, closedTo: null }
    }
  },

  create: async (data: ClosedDayFormData): Promise<ClosedDay> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: ClosedDay = { ...data, id: `opt-${Date.now()}`, created_at: now, updated_at: now }
    setState((s) => ({ ...s, closedDays: [...s.closedDays, optimistic] }))

    const { data: created, error } = await supabase
      .from('closed_days')
      .insert(data)
      .select()
      .single()

    if (error) {
      setState((s) => ({ ...s, closedDays: s.closedDays.filter((d) => d.id !== optimistic.id) }))
      throw error
    }
    setState((s) => ({
      ...s,
      closedDays: s.closedDays.map((d) => d.id === optimistic.id ? (created as ClosedDay) : d),
    }))
    return created as ClosedDay
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    setState((s) => ({ ...s, closedDays: s.closedDays.filter((d) => d.id !== id) }))
    const { error } = await supabase.from('closed_days').delete().eq('id', id)
    if (error) throw error
  },
}

// ── React hook ──────────────────────────────────────────

export function useClosedDaysStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter((l) => l !== fn) }
  }, [])
  return _state
}
