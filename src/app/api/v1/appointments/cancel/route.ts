/**
 * 予約のキャンセル（患者向け・未認証）。
 *
 * 以前は anon が任意の予約を UPDATE できたため、第三者が他人の予約を
 * 書き換え・キャンセルできた。予約IDと電話番号の一致を本人確認とし、
 * キャンセル期限もサーバー側で判定する。
 */

import { defineHandler } from '@/server/http/handler'
import { enforceRateLimit } from '@/server/http/rateLimit'
import { appointmentService } from '@/server/services/AppointmentService'
import { cancelAppointmentSchema } from '@/server/validators/appointment'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'public', schema: cancelAppointmentSchema },
  async ({ body, ipAddress, userAgent, requestId }) => {
    enforceRateLimit({ scope: 'appointments.cancel', windowMs: 60_000, max: 5 }, ipAddress)

    const { before, after } = await appointmentService.cancel(body.reservationId, body.phone)

    await writeAuditLog({
      requestId,
      action: 'appointment.cancel',
      actorId: null,
      actorRole: 'patient',
      clinicId: before.clinic_id,
      targetType: 'reservation',
      targetId: before.id,
      result: 'success',
      before: { status: before.status, start_at: before.start_at },
      after: { status: after.status },
      ipAddress,
      userAgent,
    })

    return { status: after.status }
  },
)
