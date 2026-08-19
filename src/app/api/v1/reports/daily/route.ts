/** 日計表。集計はサーバーで行い、画面には結果だけを返す */
import { defineHandler } from '@/server/http/handler'
import { dailyReportService } from '@/server/services/DailyReportService'
import { dailyReportSchema } from '@/server/validators/report'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'analytics.read', schema: dailyReportSchema },
  async ({ actor, body, log }) => {
    const report = await dailyReportService.build(actor, body)
    log.debug('日計', { date: report.date, count: report.kpi.count })
    return report
  },
)
