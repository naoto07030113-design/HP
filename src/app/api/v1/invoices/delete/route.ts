/** 会計の削除。論理削除であり、行は残る */
import { defineHandler } from '@/server/http/handler'
import { billingService } from '@/server/services/BillingService'
import { invoiceIdSchema } from '@/server/validators/invoice'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'billing.delete', schema: invoiceIdSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const removed = await billingService.remove(actor, body.id)
    await writeAuditLog({
      requestId, action: 'invoice.delete',
      actorId: actor.id, actorRole: actor.role, clinicId: removed.clinicId,
      targetType: 'invoice', targetId: removed.id, result: 'success',
      before: { invoiceNumber: removed.invoiceNumber, totalAmount: removed.totalAmount },
      ipAddress, userAgent,
    })
    return { id: removed.id }
  },
)
