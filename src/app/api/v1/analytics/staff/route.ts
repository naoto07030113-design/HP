/** スタッフ別ダッシュボードの直近6か月の推移 */
import { defineHandler } from '@/server/http/handler'
import { analyticsService } from '@/server/services/AnalyticsService'
import { staffDetailSchema } from '@/server/validators/report'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'analytics.read', schema: staffDetailSchema },
  async ({ actor, body }) => analyticsService.staffDetail(actor, body),
)
