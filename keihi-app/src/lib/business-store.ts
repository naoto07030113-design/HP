'use client'

import { useState, useEffect } from 'react'
import type { Business, BusinessFormData } from '@/types/business'
import { getSupabaseClient } from './supabase'

let _businesses: Business[] = []
let _listeners: Array<() => void> = []
let _realtimeSubscribed = false

function notify(): void {
  _listeners.forEach((fn) => fn())
}

function sortBusinesses(list: Business[]): Business[] {
  return [...list].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
}

async function loadAll(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[business-store] load error', error)
    return
  }
  _businesses = sortBusinesses((data ?? []) as Business[])
  notify()
}

function ensureRealtime(): void {
  if (_realtimeSubscribed) return
  _realtimeSubscribed = true
  const supabase = getSupabaseClient()
  supabase
    .channel('businesses')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
      void loadAll()
    })
    .subscribe()
}

export async function hydrateBusinessStore(): Promise<void> {
  if (typeof window === 'undefined') return
  ensureRealtime()
  await loadAll()
}

export const businessStore = {
  getAll: (): Business[] => _businesses,

  getById: (id: string): Business | null => _businesses.find((b) => b.id === id) ?? null,

  create: async (data: BusinessFormData): Promise<Business> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const { data: inserted, error } = await supabase
      .from('businesses')
      .insert({ ...data, created_at: now, updated_at: now })
      .select()
      .single()
    if (error || !inserted) throw new Error(error?.message ?? 'Failed to create business')

    const created = inserted as Business
    _businesses = sortBusinesses([..._businesses, created])
    notify()
    return created
  },

  update: async (id: string, data: Partial<BusinessFormData>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    _businesses = sortBusinesses(_businesses.map((b) => (b.id === id ? { ...b, ...data, updated_at: now } : b)))
    notify()
    const { error } = await supabase.from('businesses').update({ ...data, updated_at: now }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    _businesses = _businesses.filter((b) => b.id !== id)
    notify()
    const { error } = await supabase.from('businesses').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export function useBusinessStore(): { businesses: Business[] } {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return { businesses: _businesses }
}
