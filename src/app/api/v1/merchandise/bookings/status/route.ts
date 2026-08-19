/** 物販予約の状態変更（受付済 → 確認済 → 渡し済 など） */
import { defineHandler } from '@/server/http/handler'
import { merchandiseService } from '@/server/services/MerchandiseService'
import { merchandiseBookingStatusUpdateSchema } from '@/server/validators/merchandise'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'merchandise.manage', schema: merchandiseBookingStatusUpdateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const { before, after } = await merchandiseService.changeStatus(actor, body.id, body.status)
    await writeAuditLog({
      requestId, action: 'merchandise_booking.update',
      actorId: actor.id, actorRole: actor.role, clinicId: after.clinicId,
      targetType: 'merchandise_booking', targetId: after.id, result: 'success',
      before: { status: before.status }, after: { status: after.status },
      ipAddress, userAgent,
    })
    return { booking: after }
  },
)
