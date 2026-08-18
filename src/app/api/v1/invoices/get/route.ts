/** 会計1件 */
import { defineHandler } from '@/server/http/handler'
import { billingService } from '@/server/services/BillingService'
import { invoiceIdSchema } from '@/server/validators/invoice'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'billing.read', schema: invoiceIdSchema },
  async ({ actor, body }) => ({ invoice: await billingService.get(actor, body.id) }),
)
