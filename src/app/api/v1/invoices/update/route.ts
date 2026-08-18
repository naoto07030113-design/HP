/** 会計の更新。金額は毎回サーバーで計算し直す */
import { defineHandler } from '@/server/http/handler'
import { billingService } from '@/server/services/BillingService'
import { invoiceUpdateSchema } from '@/server/validators/invoice'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'billing.write', schema: invoiceUpdateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const { id, ...values } = body
    const { before, after } = await billingService.update(actor, id, values)
    await writeAuditLog({
      requestId, action: 'invoice.update',
      actorId: actor.id, actorRole: actor.role, clinicId: after.clinicId,
      targetType: 'invoice', targetId: after.id, result: 'success',
      before: { totalAmount: before.totalAmount, status: before.status },
      after: { totalAmount: after.totalAmount, status: after.status },
      ipAddress, userAgent,
    })
    return { invoice: after }
  },
)
