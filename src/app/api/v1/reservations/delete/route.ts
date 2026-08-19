/** 予約の削除。論理削除であり、行は残る */
import { defineHandler } from '@/server/http/handler'
import { adminAppointmentService } from '@/server/services/AdminAppointmentService'
import { reservationIdSchema } from '@/server/validators/appointment'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'appointments.delete', schema: reservationIdSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const removed = await adminAppointmentService.remove(actor, body.id)
    await writeAuditLog({
      requestId, action: 'appointment.cancel',
      actorId: actor.id, actorRole: actor.role, clinicId: removed.clinicId,
      targetType: 'reservation', targetId: removed.id, result: 'success',
      before: { startAt: removed.startAt, status: removed.status },
      ipAddress, userAgent,
    })
    return { id: removed.id }
  },
)
