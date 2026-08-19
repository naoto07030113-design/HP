/** 院別ダッシュボードの追加集計（メニュー別ランキング・直近6か月の推移） */
import { defineHandler } from '@/server/http/handler'
import { analyticsService } from '@/server/services/AnalyticsService'
import { clinicDetailSchema } from '@/server/validators/report'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'analytics.read', schema: clinicDetailSchema },
  async ({ actor, body }) => analyticsService.clinicDetail(actor, body),
)
