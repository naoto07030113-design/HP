'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from './supabase'

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

// ── camelCase <-> snake_case mapping ──────────────────────────────────────────

type DbRow = {
  id: number
  company_name: string
  timezone: string
  max_advance_booking_days: number
  min_cancellation_hours: number
  slot_interval_min: number
  reminder_enabled: boolean
  reminder_days_before: number
  reminder_time_of_day: string
  line_reminder_enabled: boolean
  sms_reminder_enabled: boolean
  email_reminder_enabled: boolean
  reminder_template: string
  thank_you_template: string
}

function fromDb(row: DbRow): AppSettings {
  return {
    companyName: row.company_name,
    timezone: row.timezone,
    maxAdvanceBookingDays: row.max_advance_booking_days,
    minCancellationHours: row.min_cancellation_hours,
    slotIntervalMin: row.slot_interval_min,
    reminderEnabled: row.reminder_enabled,
    reminderDaysBefore: row.reminder_days_before,
    reminderTimeOfDay: row.reminder_time_of_day,
    lineReminderEnabled: row.line_reminder_enabled,
    smsReminderEnabled: row.sms_reminder_enabled,
    emailReminderEnabled: row.email_reminder_enabled,
    reminderTemplate: row.reminder_template,
    thankYouTemplate: row.thank_you_template,
  }
}

function toDb(patch: Partial<AppSettings>): Partial<Omit<DbRow, 'id'>> {
  const row: Partial<Omit<DbRow, 'id'>> = {}
  if (patch.companyName !== undefined) row.company_name = patch.companyName
  if (patch.timezone !== undefined) row.timezone = patch.timezone
  if (patch.maxAdvanceBookingDays !== undefined) row.max_advance_booking_days = patch.maxAdvanceBookingDays
  if (patch.minCancellationHours !== undefined) row.min_cancellation_hours = patch.minCancellationHours
  if (patch.slotIntervalMin !== undefined) row.slot_interval_min = patch.slotIntervalMin
  if (patch.reminderEnabled !== undefined) row.reminder_enabled = patch.reminderEnabled
  if (patch.reminderDaysBefore !== undefined) row.reminder_days_before = patch.reminderDaysBefore
  if (patch.reminderTimeOfDay !== undefined) row.reminder_time_of_day = patch.reminderTimeOfDay
  if (patch.lineReminderEnabled !== undefined) row.line_reminder_enabled = patch.lineReminderEnabled
  if (patch.smsReminderEnabled !== undefined) row.sms_reminder_enabled = patch.smsReminderEnabled
  if (patch.emailReminderEnabled !== undefined) row.email_reminder_enabled = patch.emailReminderEnabled
  if (patch.reminderTemplate !== undefined) row.reminder_template = patch.reminderTemplate
  if (patch.thankYouTemplate !== undefined) row.thank_you_template = patch.thankYouTemplate
  return row
}

// ── Singleton state ──────────────────────────────────────────

let _settings: AppSettings = { ...DEFAULT_SETTINGS }
let _listeners: Array<() => void> = []
let _loadPromise: Promise<void> | null = null

function notify() {
  _listeners.forEach((fn) => fn())
}

// ── Data loading ──────────────────────────────────────────

async function loadFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('[settings-store] load error:', error.message)
    return
  }

  if (data) {
    _settings = { ...DEFAULT_SETTINGS, ...fromDb(data as DbRow) }
    notify()
  }
}

/** Called by StoreHydrationProvider on app startup. Safe to call multiple times. */
export async function hydrateSettingsStore(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!_loadPromise) {
    _loadPromise = loadFromSupabase()
  }
  return _loadPromise
}

// ── Store ──────────────────────────────────────────

export const settingsStore = {
  get: (): AppSettings => _settings,

  update: async (patch: Partial<AppSettings>): Promise<void> => {
    const supabase = getSupabaseClient()
    _settings = { ..._settings, ...patch }
    notify()

    const dbPatch = toDb(patch)
    const { error } = await supabase
      .from('app_settings')
      .upsert({ id: 1, ...dbPatch }, { onConflict: 'id' })

    if (error) throw error
  },
}

// ── React hook ──────────────────────────────────────────

export function useSettingsStore(): AppSettings {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  }, [])
  return _settings
}
