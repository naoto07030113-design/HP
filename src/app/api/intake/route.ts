/**
 * Web予約の受け付け（患者向け・未認証）。
 *
 * 未認証で誰でも叩けるため、レート制限と入力検証を必ず通し、
 * 枠が空いているかもサーバーで確認する。
 */
import { defineHandler } from '@/server/http/handler'
import { enforceRateLimit } from '@/server/http/rateLimit'
import { intakeService } from '@/server/services/IntakeService'
import { intakeSchema } from '@/server/validators/intake'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'public', schema: intakeSchema },
  async ({ body, requestId, ipAddress, userAgent }) => {
    enforceRateLimit({ scope: 'intake', windowMs: 60 * 60 * 1000, max: 10 }, ipAddress)

    const result = await intakeService.create(body, requestId)

    await writeAuditLog({
      requestId, action: 'appointment.create',
      actorId: null, actorRole: 'public', clinicId: body.reservation.clinic_id,
      targetType: 'reservation', targetId: result.reservationId, result: 'success',
      after: { startAt: body.reservation.start_at, firstVisit: !!body.patient },
      ipAddress, userAgent,
    })

    return { ok: true, reservationId: result.reservationId, patientId: result.patientId }
  },
)
