/** 経営ダッシュボード。集計はサーバーで行い、画面には結果だけを返す */
import { defineHandler } from '@/server/http/handler'
import { analyticsService } from '@/server/services/AnalyticsService'
import { dashboardSchema } from '@/server/validators/report'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'analytics.read', schema: dashboardSchema },
  async ({ actor, body, log }) => {
    const data = await analyticsService.dashboard(actor, body)
    log.debug('ダッシュボード集計', {
      period: `${data.period.from}〜${data.period.to}`,
      clinics: data.clinics.length,
      staff: data.staff.length,
    })
    return data
  },
)
