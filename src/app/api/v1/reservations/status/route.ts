/** 来院済・キャンセルなどの状態変更（当日受付・カレンダーから） */
import { defineHandler } from '@/server/http/handler'
import { adminAppointmentService } from '@/server/services/AdminAppointmentService'
import { reservationStatusUpdateSchema } from '@/server/validators/appointment'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'appointments.write', schema: reservationStatusUpdateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const { before, after } = await adminAppointmentService.changeStatus(actor, body.id, body.status)
    await writeAuditLog({
      requestId,
      action: after.status === 'cancelled' ? 'appointment.cancel' : 'appointment.update',
      actorId: actor.id, actorRole: actor.role, clinicId: after.clinicId,
      targetType: 'reservation', targetId: after.id, result: 'success',
      before: { status: before.status }, after: { status: after.status },
      ipAddress, userAgent,
    })
    return { reservation: after }
  },
)
