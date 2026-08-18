/**
 * 予約の日時変更（患者向け・未認証）。
 *
 * 本人確認（予約ID＋電話番号）に加えて、変更後の枠が空いているかを
 * サーバー側で必ず確認する。空き判定をブラウザだけに任せると、
 * 同時操作でダブルブッキングが成立してしまう。
 */

import { defineHandler } from '@/server/http/handler'
import { enforceRateLimit } from '@/server/http/rateLimit'
import { appointmentService } from '@/server/services/AppointmentService'
import { rescheduleAppointmentSchema } from '@/server/validators/appointment'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'public', schema: rescheduleAppointmentSchema },
  async ({ body, ipAddress, userAgent, requestId }) => {
    enforceRateLimit({ scope: 'appointments.reschedule', windowMs: 60_000, max: 5 }, ipAddress)

    const { before, after } = await appointmentService.reschedule(
      body.reservationId, body.phone, body.startAt, body.endAt,
    )

    await writeAuditLog({
      requestId,
      action: 'appointment.reschedule',
      actorId: null,
      actorRole: 'patient',
      clinicId: before.clinic_id,
      targetType: 'reservation',
      targetId: before.id,
      result: 'success',
      before: { start_at: before.start_at, end_at: before.end_at },
      after: { start_at: after.start_at, end_at: after.end_at },
      ipAddress,
      userAgent,
    })

    return { startAt: after.start_at, endAt: after.end_at }
  },
)
