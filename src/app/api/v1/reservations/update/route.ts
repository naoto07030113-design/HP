/** 予約の更新。日時や担当者が変わるときは重複を見直す */
import { defineHandler } from '@/server/http/handler'
import { adminAppointmentService } from '@/server/services/AdminAppointmentService'
import { adminReservationUpdateSchema } from '@/server/validators/appointment'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'appointments.write', schema: adminReservationUpdateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const { id, ...values } = body
    const { before, after } = await adminAppointmentService.update(actor, id, values)
    await writeAuditLog({
      requestId, action: 'appointment.update',
      actorId: actor.id, actorRole: actor.role, clinicId: after.clinicId,
      targetType: 'reservation', targetId: after.id, result: 'success',
      before: { startAt: before.startAt, endAt: before.endAt, staffId: before.staffId, status: before.status },
      after: { startAt: after.startAt, endAt: after.endAt, staffId: after.staffId, status: after.status },
      ipAddress, userAgent,
    })
    return { reservation: after }
  },
)
