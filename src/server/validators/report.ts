import { z } from 'zod'
import { uuidSchema } from './appointment'

/** 集計系の入力スキーマ */

const ymd = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label}の形式が正しくありません`)

export const dailyReportSchema = z.object({
  date: ymd('日付'),
  /** 未指定なら参照できる院すべて（admin のみ全院） */
  clinicId: uuidSchema.nullable().optional(),
})
export type DailyReportInput = z.infer<typeof dailyReportSchema>

export const periodFilterSchema = z.enum(['today', 'week', 'month', 'lastMonth', 'year', 'custom'])

export const dashboardSchema = z.object({
  period: periodFilterSchema.default('month'),
  clinicId: uuidSchema.nullable().optional(),
  /** period='custom' のときだけ使う */
  from: ymd('開始日').nullable().optional(),
  to: ymd('終了日').nullable().optional(),
})
export type DashboardInput = z.infer<typeof dashboardSchema>

export const clinicDetailSchema = z.object({
  clinicId: uuidSchema,
  period: periodFilterSchema.default('month'),
  from: ymd('開始日').nullable().optional(),
  to: ymd('終了日').nullable().optional(),
})
export type ClinicDetailInput = z.infer<typeof clinicDetailSchema>

export const staffDetailSchema = z.object({
  staffId: uuidSchema,
})
export type StaffDetailInput = z.infer<typeof staffDetailSchema>

export const analyticsReportSchema = z.object({
  clinicId: uuidSchema.nullable().optional(),
  /** 何日来ていない患者を「未再診」とみなすか */
  inactiveDays: z.number().int().min(7).max(365).default(60),
})
export type AnalyticsReportInput = z.infer<typeof analyticsReportSchema>

export const monthlyReportSchema = z.object({
  /** yyyy-MM */
  month: z.string().regex(/^\d{4}-\d{2}$/, '対象月の形式が正しくありません'),
  clinicId: uuidSchema.nullable().optional(),
})
export type MonthlyReportInput = z.infer<typeof monthlyReportSchema>
