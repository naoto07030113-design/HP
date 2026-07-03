'use client'

import type { MonthlyReport, ActionPlan } from '@/types/report'
import { getSupabaseClient } from './supabase'

// Supabase `monthly_reports` テーブル（id TEXT, month TEXT, clinic_id TEXT, data JSONB）に保存。
// 旧バージョンは localStorage 保存だったため、初回ロード時に残っていれば自動移行する。

const LEGACY_STORAGE_KEY = 'imc_monthly_reports'

let _reports: MonthlyReport[] = []
let _listeners: Array<() => void> = []
let _loadPromise: Promise<void> | null = null

function notify() {
  _listeners.forEach((fn) => fn())
}

type ReportRow = {
  id: string
  month: string
  clinic_id: string
  data: Omit<MonthlyReport, 'id'>
  created_at: string
  updated_at: string
}

function fromRow(row: ReportRow): MonthlyReport {
  return { ...row.data, id: row.id }
}

function toRow(report: MonthlyReport): Omit<ReportRow, 'created_at' | 'updated_at'> {
  const { id, ...data } = report
  return { id, month: report.month, clinic_id: report.clinicId, data }
}

async function persist(report: MonthlyReport): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('monthly_reports')
    .upsert({ ...toRow(report), updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
}

async function migrateLegacyLocalStorage(): Promise<void> {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return
    const legacy = JSON.parse(raw) as MonthlyReport[]
    if (!Array.isArray(legacy) || legacy.length === 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return
    }
    const existingIds = new Set(_reports.map((r) => r.id))
    const toMigrate = legacy.filter((r) => !existingIds.has(r.id))
    if (toMigrate.length > 0) {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('monthly_reports')
        .upsert(toMigrate.map(toRow), { onConflict: 'id' })
      if (error) return // テーブル未作成などの場合は localStorage を残して次回に再試行
      _reports = [...toMigrate, ..._reports].sort((a, b) => b.month.localeCompare(a.month))
      notify()
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // 移行失敗時は何もしない（次回ロードで再試行）
  }
}

async function loadAll(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .order('month', { ascending: false })
  if (!error) {
    _reports = ((data ?? []) as ReportRow[]).map(fromRow)
    notify()
  }
  await migrateLegacyLocalStorage()
}

export async function hydrateReportStore(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!_loadPromise) {
    _loadPromise = loadAll()
  }
  return _loadPromise
}

export const reportStore = {
  subscribe(fn: () => void): () => void {
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter((l) => l !== fn)
    }
  },

  getAll: (): MonthlyReport[] =>
    [..._reports].sort((a, b) => b.month.localeCompare(a.month)),

  getById: (id: string): MonthlyReport | null =>
    _reports.find((r) => r.id === id) ?? null,

  getByMonth: (month: string): MonthlyReport[] =>
    _reports.filter((r) => r.month === month),

  create: (data: Omit<MonthlyReport, 'id' | 'createdAt' | 'updatedAt'>): MonthlyReport => {
    const now = new Date().toISOString()
    const report: MonthlyReport = {
      ...data,
      id: `rpt-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    _reports = [report, ..._reports]
    notify()
    persist(report).catch(() => {})
    return report
  },

  update: (id: string, data: Partial<MonthlyReport>): void => {
    _reports = _reports.map((r) =>
      r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r,
    )
    notify()
    const updated = _reports.find((r) => r.id === id)
    if (updated) persist(updated).catch(() => {})
  },

  updateActionPlan: (reportId: string, planId: string, status: ActionPlan['status']): void => {
    const report = _reports.find((r) => r.id === reportId)
    if (!report) return
    reportStore.update(reportId, {
      actionPlans: report.actionPlans.map((p) => (p.id === planId ? { ...p, status } : p)),
    })
  },

  addDecision: (reportId: string, decision: string): void => {
    const report = _reports.find((r) => r.id === reportId)
    if (!report) return
    reportStore.update(reportId, { decisions: [...report.decisions, decision] })
  },

  updateMeetingNotes: (reportId: string, notes: string): void => {
    reportStore.update(reportId, { meetingNotes: notes })
  },

  delete: (id: string): void => {
    _reports = _reports.filter((r) => r.id !== id)
    notify()
    getSupabaseClient().from('monthly_reports').delete().eq('id', id).then(() => {})
  },
}
