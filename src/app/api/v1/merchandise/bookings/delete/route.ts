/** 物販予約の削除 */
import { defineHandler } from '@/server/http/handler'
import { merchandiseService } from '@/server/services/MerchandiseService'
import { merchandiseBookingIdSchema } from '@/server/validators/merchandise'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'merchandise.manage', schema: merchandiseBookingIdSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const removed = await merchandiseService.removeBooking(actor, body.id)
    await writeAuditLog({
      requestId, action: 'merchandise_booking.delete',
      actorId: actor.id, actorRole: actor.role, clinicId: removed.clinicId,
      targetType: 'merchandise_booking', targetId: removed.id, result: 'success',
      before: { status: removed.status, quantity: removed.quantity },
      ipAddress, userAgent,
    })
    return { removed }
  },
)
