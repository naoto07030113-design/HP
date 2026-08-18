/** 会計一覧。所属院の外は返さない。ページングと集計はサーバー側 */
import { defineHandler } from '@/server/http/handler'
import { billingService } from '@/server/services/BillingService'
import { invoiceListSchema } from '@/server/validators/invoice'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'billing.read', schema: invoiceListSchema },
  async ({ actor, body, log }) => {
    const result = await billingService.list(actor, body)
    log.debug('会計一覧', { total: result.total, page: result.page })
    return result
  },
)
