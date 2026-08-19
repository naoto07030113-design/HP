/** 予約の作成。枠の重複はサーバーで確認する */
import { defineHandler } from '@/server/http/handler'
import { adminAppointmentService } from '@/server/services/AdminAppointmentService'
import { adminReservationCreateSchema } from '@/server/validators/appointment'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'appointments.write', schema: adminReservationCreateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const reservation = await adminAppointmentService.create(actor, body)
    await writeAuditLog({
      requestId, action: 'appointment.create',
      actorId: actor.id, actorRole: actor.role, clinicId: reservation.clinicId,
      targetType: 'reservation', targetId: reservation.id, result: 'success',
      after: { startAt: reservation.startAt, status: reservation.status },
      ipAddress, userAgent,
    })
    return { reservation }
  },
)
