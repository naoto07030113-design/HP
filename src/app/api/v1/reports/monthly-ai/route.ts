/** 月次経営レポート（経営会議AI）の生成。集計も本文もサーバーで作る */
import { defineHandler } from '@/server/http/handler'
import { monthlyReportService } from '@/server/services/MonthlyReportService'
import { monthlyReportSchema } from '@/server/validators/report'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'analytics.read', schema: monthlyReportSchema },
  async ({ actor, body, log }) => {
    const report = await monthlyReportService.generate(actor, body)
    log.debug('月次レポート生成', { month: body.month, sections: report.sections.length })
    return { report }
  },
)
