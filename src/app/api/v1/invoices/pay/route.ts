/**
 * 入金処理（未払い → 支払済）。
 * 支払うべき額に足りていなければサーバーが拒否する。
 */
import { defineHandler } from '@/server/http/handler'
import { billingService } from '@/server/services/BillingService'
import { invoicePaySchema } from '@/server/validators/invoice'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'billing.write', schema: invoicePaySchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const { before, after } = await billingService.markPaid(actor, body.id, {
      paymentMethod: body.paymentMethod,
      paymentAmount: body.paymentAmount,
    })
    await writeAuditLog({
      requestId, action: 'invoice.update',
      actorId: actor.id, actorRole: actor.role, clinicId: after.clinicId,
      targetType: 'invoice', targetId: after.id, result: 'success',
      before: { status: before.status }, after: { status: after.status, paymentAmount: after.paymentAmount },
      ipAddress, userAgent,
    })
    return { invoice: after }
  },
)
