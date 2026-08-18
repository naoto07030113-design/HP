/**
 * 空き時間の照会（患者向け・未認証）。
 *
 * 返すのは空いている時刻の一覧だけで、予約の中身は一切返さない。
 */

import { z } from 'zod'
import { defineHandler } from '@/server/http/handler'
import { enforceRateLimit } from '@/server/http/rateLimit'
import { availabilityService } from '@/server/services/AvailabilityService'
import { uuidSchema } from '@/server/validators/appointment'

export const dynamic = 'force-dynamic'

const schema = z.object({
  clinicId: uuidSchema,
  menuId: uuidSchema,
  staffId: uuidSchema.nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付の形式が正しくありません'),
  excludeReservationId: uuidSchema.nullable().optional(),
})

export const POST = defineHandler(
  { auth: 'public', schema },
  async ({ body, ipAddress, log }) => {
    enforceRateLimit({ scope: 'appointments.availability', windowMs: 60_000, max: 60 }, ipAddress)

    const slots = await availabilityService.listOpenSlots({
      clinicId: body.clinicId,
      menuId: body.menuId,
      staffId: body.staffId ?? null,
      date: body.date,
      excludeReservationId: body.excludeReservationId ?? null,
    })

    log.debug('空き枠を算出', { date: body.date, slotCount: slots.length })
    return { slots }
  },
)
