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
  data: Partial<Omit<MonthlyReport, 'id'>> | null
  created_at: string
  updated_at: string
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

// data は JSONB のため、旧バージョンや生成途中の行では項目が欠けていることがある。
// そのまま展開すると一覧側の report.actionPlans.filter(...) 等で画面全体が落ちるので、
// 読み込み時にこの一箇所で必ず既定値を埋めて型どおりの形に整える。
function fromRow(row: ReportRow): MonthlyReport {
  const d = (row.data ?? {}) as Partial<Omit<MonthlyReport, 'id'>>
  return {
    ...d,
    id: row.id,
    month: str(d.month, row.month),
    clinicId: str(d.clinicId, row.clinic_id || 'all'),
    clinicName: str(d.clinicName, '全院'),
    title: str(d.title, `${str(d.month, row.month)} 月次レポート`),
    summary: str(d.summary),
    sections: arr(d.sections),
    issues: arr(d.issues),
    actionPlans: arr<ActionPlan>(d.actionPlans),
    meetingNotes: str(d.meetingNotes),
    decisions: arr(d.decisions),
    kpiSnapshot: (d.kpiSnapshot && typeof d.kpiSnapshot === 'object') ? d.kpiSnapshot : {},
    createdAt: str(d.createdAt, row.created_at),
    updatedAt: str(d.updatedAt, row.updated_at),
  }
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
    persist(report).catch((err) => {
      // 画面はストア経由なので、ここでは残せる情報を必ずログに出す
      console.error('月次レポートの保存に失敗しました', err)
    })
    return report
  },

  update: (id: string, data: Partial<MonthlyReport>): void => {
    _reports = _reports.map((r) =>
      r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r,
    )
    notify()
    const updated = _reports.find((r) => r.id === id)
    if (updated) {
      persist(updated).catch((err) => {
        console.error('月次レポートの保存に失敗しました', err)
      })
    }
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
