/**
 * 会計の作成。
 * 金額はサーバーで計算する（ブラウザから合計を受け取らない）。
 * 伝票番号もサーバーで採番する。
 */
import { defineHandler } from '@/server/http/handler'
import { billingService } from '@/server/services/BillingService'
import { invoiceCreateSchema } from '@/server/validators/invoice'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'billing.write', schema: invoiceCreateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent, log }) => {
    const invoice = await billingService.create(actor, body)
    log.info('会計を作成', { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount })
    await writeAuditLog({
      requestId, action: 'invoice.create',
      actorId: actor.id, actorRole: actor.role, clinicId: invoice.clinicId,
      targetType: 'invoice', targetId: invoice.id, result: 'success',
      after: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount, status: invoice.status },
      ipAddress, userAgent,
    })
    return { invoice }
  },
)
