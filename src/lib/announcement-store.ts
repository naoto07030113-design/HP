'use client'

import { useState, useEffect } from 'react'
import type { Announcement } from '@/types/announcement'
import { format } from 'date-fns'

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    banner_mode: 'text',
    title: '【夏季休業のお知らせ】8月13日(火)〜15日(木) 全院休業',
    body: '誠に勝手ながら、上記期間を夏季休業とさせていただきます。ご不便をおかけして申し訳ございません。',
    image_url: null, image_path: null, image_alt: null, attachment_name: null,
    scope: 'company', clinic_id: null,
    type: 'important',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
    is_active: true, display_order: 0,
    link_url: null, link_label: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    banner_mode: 'text',
    title: '【初回限定キャンペーン】初診カウンセリング料0円！',
    body: '7月末まで、初診カウンセリング（通常5,500円）を無料でご提供しております。',
    image_url: null, image_path: null, image_alt: null, attachment_name: null,
    scope: 'company', clinic_id: null,
    type: 'campaign',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(Date.now() + 60 * 86400000), 'yyyy-MM-dd'),
    is_active: true, display_order: 1,
    link_url: null, link_label: '詳細はこちら',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'ann-3',
    banner_mode: 'text',
    title: '【本院 駐車場案内】近隣コインパーキングのご利用をお願いします',
    body: '院前の駐車スペースは満車になりやすい時間帯があります。お近くのコインパーキングをご利用ください。',
    image_url: null, image_path: null, image_alt: null, attachment_name: null,
    scope: 'clinic', clinic_id: 'clinic-1',
    type: 'normal',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(Date.now() + 365 * 86400000), 'yyyy-MM-dd'),
    is_active: true, display_order: 0,
    link_url: null, link_label: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

const KEY = 'announcement_store_v2'

let _items: Announcement[] = (() => {
  if (typeof window === 'undefined') return DEMO_ANNOUNCEMENTS
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : DEMO_ANNOUNCEMENTS
  } catch { return DEMO_ANNOUNCEMENTS }
})()

let _listeners: Array<() => void> = []

function notify() {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(KEY, JSON.stringify(_items)) } catch {}
  }
  _listeners.forEach((fn) => fn())
}

function genId() { return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }

export const announcementsStore = {
  getAll: () => _items,
  getActive: (scope: 'company' | 'clinic', clinicId?: string) => {
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
  create: (data: Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'image_path'>) => {
    const now = new Date().toISOString()
    const item: Announcement = { ...data, id: genId(), image_path: null, created_at: now, updated_at: now }
    _items = [..._items, item]
    notify()
    return item
  },
  update: (id: string, data: Partial<Announcement>) => {
    _items = _items.map((a) => a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a)
    notify()
  },
  delete: (id: string) => {
    _items = _items.filter((a) => a.id !== id)
    notify()
  },
  reorder: (fromIdx: number, toIdx: number) => {
    const sorted = [..._items].sort((a, b) => a.display_order - b.display_order)
    const [item] = sorted.splice(fromIdx, 1)
    sorted.splice(toIdx, 0, item)
    _items = sorted.map((a, i) => ({ ...a, display_order: i }))
    notify()
  },
}

export function useAnnouncementsStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter((l) => l !== fn) }
  }, [])
  return _items
}
