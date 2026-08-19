/** 分析レポート画面。集計はサーバーで行い、画面には結果だけを返す */
import { defineHandler } from '@/server/http/handler'
import { analyticsService } from '@/server/services/AnalyticsService'
import { analyticsReportSchema } from '@/server/validators/report'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'analytics.read', schema: analyticsReportSchema },
  async ({ actor, body }) => analyticsService.report(actor, body),
)
