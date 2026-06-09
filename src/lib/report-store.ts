'use client'

import type { MonthlyReport, ActionPlan } from '@/types/report'

const STORAGE_KEY = 'imc_monthly_reports'

function load(): MonthlyReport[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MonthlyReport[]) : []
  } catch {
    return []
  }
}

function save(reports: MonthlyReport[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
}

export const reportStore = {
  getAll: (): MonthlyReport[] =>
    load().sort((a, b) => b.month.localeCompare(a.month)),

  getById: (id: string): MonthlyReport | null =>
    load().find((r) => r.id === id) ?? null,

  getByMonth: (month: string): MonthlyReport[] =>
    load().filter((r) => r.month === month),

  create: (data: Omit<MonthlyReport, 'id' | 'createdAt' | 'updatedAt'>): MonthlyReport => {
    const reports = load()
    const now = new Date().toISOString()
    const report: MonthlyReport = {
      ...data,
      id: `rpt-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    save([report, ...reports])
    return report
  },

  update: (id: string, data: Partial<MonthlyReport>): void => {
    const reports = load().map((r) =>
      r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r,
    )
    save(reports)
  },

  updateActionPlan: (reportId: string, planId: string, status: ActionPlan['status']): void => {
    const reports = load().map((r) => {
      if (r.id !== reportId) return r
      return {
        ...r,
        actionPlans: r.actionPlans.map((p) => p.id === planId ? { ...p, status } : p),
        updatedAt: new Date().toISOString(),
      }
    })
    save(reports)
  },

  addDecision: (reportId: string, decision: string): void => {
    const reports = load().map((r) => {
      if (r.id !== reportId) return r
      return {
        ...r,
        decisions: [...r.decisions, decision],
        updatedAt: new Date().toISOString(),
      }
    })
    save(reports)
  },

  updateMeetingNotes: (reportId: string, notes: string): void => {
    const reports = load().map((r) =>
      r.id === reportId ? { ...r, meetingNotes: notes, updatedAt: new Date().toISOString() } : r,
    )
    save(reports)
  },

  delete: (id: string): void => {
    save(load().filter((r) => r.id !== id))
  },
}
