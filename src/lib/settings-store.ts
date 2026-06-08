'use client'

import { useState, useEffect } from 'react'
import { secureSet, secureGet } from './secure-storage'

const KEY = 'app_settings_v1'

export interface AppSettings {
  companyName: string
  timezone: string
  maxAdvanceBookingDays: number
  minCancellationHours: number
  slotIntervalMin: number
  reminderEnabled: boolean
  reminderDaysBefore: number
  reminderTimeOfDay: string
  lineReminderEnabled: boolean
  smsReminderEnabled: boolean
  emailReminderEnabled: boolean
  reminderTemplate: string
  thankYouTemplate: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: '有限会社イトーメディカルケア',
  timezone: 'Asia/Tokyo',
  maxAdvanceBookingDays: 60,
  minCancellationHours: 24,
  slotIntervalMin: 30,
  reminderEnabled: true,
  reminderDaysBefore: 1,
  reminderTimeOfDay: '10:00',
  lineReminderEnabled: false,
  smsReminderEnabled: false,
  emailReminderEnabled: false,
  reminderTemplate:
    '【イトーメディカルケア】明日のご予約のご確認です。\n日時: {{date}} {{time}}\n院名: {{clinic}}\n担当: {{staff}}\nご不明な点はお電話ください。',
  thankYouTemplate:
    '【イトーメディカルケア】本日はご来院いただきありがとうございました。またのご来院をお待ちしております。',
}

let _settings: AppSettings = { ...DEFAULT_SETTINGS }
let _listeners: Array<() => void> = []

function notify() {
  _listeners.forEach((fn) => fn())
  secureSet(KEY, _settings)
}

export async function hydrateSettingsStore() {
  if (typeof window === 'undefined') return
  const data = await secureGet<AppSettings>(KEY)
  if (data) {
    _settings = { ...DEFAULT_SETTINGS, ...data }
    _listeners.forEach((fn) => fn())
  }
}

export const settingsStore = {
  get: () => _settings,
  update: (patch: Partial<AppSettings>) => {
    _settings = { ..._settings, ...patch }
    notify()
  },
  reset: () => {
    _settings = { ...DEFAULT_SETTINGS }
    notify()
  },
}

export function useSettingsStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter((l) => l !== fn) }
  }, [])
  return _settings
}
