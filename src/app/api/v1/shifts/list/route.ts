/** シフト表の取得。表示中の期間・所属院の分だけ返す */
import { defineHandler } from '@/server/http/handler'
import { shiftService } from '@/server/services/ShiftService'
import { shiftListSchema } from '@/server/validators/shift'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'shifts.read', schema: shiftListSchema },
  async ({ actor, body, log }) => {
    const result = await shiftService.list(actor, body)
    log.debug('シフト取得', { count: result.shifts.length, from: result.from, to: result.to })
    return result
  },
)
