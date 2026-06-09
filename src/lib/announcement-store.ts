'use client'

import { useState, useEffect } from 'react'
import type { Announcement } from '@/types/announcement'
import { format } from 'date-fns'
import { getSupabaseClient } from './supabase'

let _items: Announcement[] = []
let _listeners: Array<() => void> = []
let _loadPromise: Promise<void> | null = null

function notify() {
  _listeners.forEach((fn) => fn())
}

// ── Data loading ──────────────────────────────────────────

async function loadFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('display_order', { ascending: true })
    .order('start_date', { ascending: false })

  if (error) {
    console.error('[announcement-store] load error:', error.message)
    return
  }

  _items = (data ?? []) as Announcement[]
  notify()
}

// ── Realtime ──────────────────────────────────────────

function setupRealtime() {
  const supabase = getSupabaseClient()

  supabase
    .channel('announcement-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        _items = [..._items, payload.new as Announcement].sort(
          (a, b) => a.display_order - b.display_order,
        )
        notify()
      } else if (payload.eventType === 'UPDATE') {
        _items = _items.map((a) =>
          a.id === payload.new.id ? (payload.new as Announcement) : a,
        )
        notify()
      } else if (payload.eventType === 'DELETE') {
        _items = _items.filter((a) => a.id !== payload.old.id)
        notify()
      }
    })
    .subscribe()
}

/** Called by StoreHydrationProvider on app startup. Safe to call multiple times. */
export async function hydrateAnnouncementsStore(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!_loadPromise) {
    _loadPromise = loadFromSupabase().then(() => {
      setupRealtime()
    })
  }
  return _loadPromise
}

// ── Store ──────────────────────────────────────────

export const announcementsStore = {
  getAll: () => _items,

  getActive: (scope: 'company' | 'clinic', clinicId?: string): Announcement[] => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return _items
      .filter((a) => {
        if (!a.is_active) return false
        if (a.start_date > today || a.end_date < today) return false
        if (scope === 'company') return a.scope === 'company'
        return a.scope === 'company' || (a.scope === 'clinic' && a.clinic_id === clinicId)
      })
      .sort((a, b) => a.display_order - b.display_order)
  },

  create: async (
    data: Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'image_path'>,
  ): Promise<Announcement> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const optimistic: Announcement = {
      ...data,
      id: `opt-${Date.now()}`,
      image_path: null,
      created_at: now,
      updated_at: now,
    }
    _items = [..._items, optimistic]
    notify()

    const { data: created, error } = await supabase
      .from('announcements')
      .insert({ ...data, image_path: null })
      .select()
      .single()

    if (error) {
      _items = _items.filter((a) => a.id !== optimistic.id)
      notify()
      throw error
    }

    _items = _items.map((a) =>
      a.id === optimistic.id ? (created as Announcement) : a,
    )
    notify()
    return created as Announcement
  },

  update: async (id: string, data: Partial<Announcement>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    _items = _items.map((a) =>
      a.id === id ? { ...a, ...data, updated_at: now } : a,
    )
    notify()

    const { error } = await supabase
      .from('announcements')
      .update({ ...data, updated_at: now })
      .eq('id', id)

    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    _items = _items.filter((a) => a.id !== id)
    notify()

    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw error
  },

  reorder: async (fromIdx: number, toIdx: number): Promise<void> => {
    const supabase = getSupabaseClient()
    const sorted = [..._items].sort((a, b) => a.display_order - b.display_order)
    const [item] = sorted.splice(fromIdx, 1)
    sorted.splice(toIdx, 0, item)
    const reordered = sorted.map((a, i) => ({ ...a, display_order: i }))
    _items = reordered
    notify()

    const updates = reordered.map((a) =>
      supabase
        .from('announcements')
        .update({ display_order: a.display_order })
        .eq('id', a.id),
    )
    await Promise.all(updates)
  },
}

// ── React hook ──────────────────────────────────────────

export function useAnnouncementsStore(): Announcement[] {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return _items
}
