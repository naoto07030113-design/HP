'use client'

import { useState, useEffect } from 'react'
import type { Card, CardFormData } from '@/types/card'
import { getSupabaseClient } from './supabase'

let _cards: Card[] = []
let _listeners: Array<() => void> = []
let _realtimeSubscribed = false

function notify(): void {
  _listeners.forEach((fn) => fn())
}

function sortCards(list: Card[]): Card[] {
  return [...list].sort((a, b) => a.last4.localeCompare(b.last4))
}

async function loadAll(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('cards').select('*').order('last4')
  if (error) {
    console.error('[card-store] load error', error)
    return
  }
  _cards = sortCards((data ?? []) as Card[])
  notify()
}

function ensureRealtime(): void {
  if (_realtimeSubscribed) return
  _realtimeSubscribed = true
  const supabase = getSupabaseClient()
  supabase
    .channel('cards')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
      void loadAll()
    })
    .subscribe()
}

export async function hydrateCardStore(): Promise<void> {
  if (typeof window === 'undefined') return
  ensureRealtime()
  await loadAll()
}

export const cardStore = {
  getAll: (): Card[] => _cards,

  // 下4桁から対応する事業所IDを引く（突合・自動仕分け用）
  businessForLast4: (last4: string | null | undefined): string | null => {
    if (!last4) return null
    return _cards.find((c) => c.last4 === last4)?.business_id ?? null
  },

  create: async (data: CardFormData): Promise<Card> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const { data: inserted, error } = await supabase
      .from('cards')
      .insert({ ...data, created_at: now, updated_at: now })
      .select()
      .single()
    if (error || !inserted) throw new Error(error?.message ?? 'Failed to create card')
    _cards = sortCards([..._cards, inserted as Card])
    notify()
    return inserted as Card
  },

  update: async (id: string, data: Partial<CardFormData>): Promise<void> => {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    _cards = sortCards(_cards.map((c) => (c.id === id ? { ...c, ...data, updated_at: now } : c)))
    notify()
    const { error } = await supabase.from('cards').update({ ...data, updated_at: now }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    _cards = _cards.filter((c) => c.id !== id)
    notify()
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export function useCardStore(): { cards: Card[] } {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return { cards: _cards }
}
