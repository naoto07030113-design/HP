/**
 * 予約の照会（患者向け・未認証）。
 *
 * 以前はブラウザが「今後の全予約」を取得して電話番号で絞り込んでいたため、
 * 画面を開くだけで他の患者の氏名と電話番号が通信に流れていた。
 * 照会をサーバー側に閉じ、一致した予約だけを返すようにしている。
 */

import { defineHandler } from '@/server/http/handler'
import { enforceRateLimit } from '@/server/http/rateLimit'
import { appointmentService } from '@/server/services/AppointmentService'
import { lookupAppointmentsSchema } from '@/server/validators/appointment'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'public', schema: lookupAppointmentsSchema },
  async ({ body, ipAddress, userAgent, requestId, log }) => {
    // 電話番号の総当たりを抑える
    enforceRateLimit({ scope: 'appointments.lookup', windowMs: 60_000, max: 10 }, ipAddress)

    const appointments = await appointmentService.lookupByPhone(body.phone)
    log.info('予約照会', { hitCount: appointments.length })

    await writeAuditLog({
      requestId,
      action: 'appointment.lookup',
      actorId: null,
      actorRole: 'patient',
      clinicId: appointments[0]?.clinicId ?? null,
      targetType: 'reservation',
      targetId: null,
      result: 'success',
      after: { hitCount: appointments.length },
      ipAddress,
      userAgent,
    })

    return { appointments }
  },
)
