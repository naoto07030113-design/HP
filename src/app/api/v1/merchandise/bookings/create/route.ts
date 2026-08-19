/** 物販予約の登録（患者向け・未認証）。状態は必ず pending で作る */
import { defineHandler } from '@/server/http/handler'
import { enforceRateLimit } from '@/server/http/rateLimit'
import { merchandiseService } from '@/server/services/MerchandiseService'
import { merchandiseBookingCreateSchema } from '@/server/validators/merchandise'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'public', schema: merchandiseBookingCreateSchema },
  async ({ body, requestId, ipAddress, userAgent }) => {
    enforceRateLimit({ scope: 'merchandise-booking', windowMs: 60 * 60 * 1000, max: 10 }, ipAddress)

    const result = await merchandiseService.createBooking(body)

    await writeAuditLog({
      requestId, action: 'merchandise_booking.create',
      actorId: null, actorRole: 'public', clinicId: body.clinicId,
      targetType: 'merchandise_booking', targetId: result.bookingId, result: 'success',
      after: { quantity: body.quantity },
      ipAddress, userAgent,
    })

    return result
  },
)
