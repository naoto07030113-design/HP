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
