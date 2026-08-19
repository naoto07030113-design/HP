/** 管理画面の予約一覧・カレンダー用。所属院の外は返さない */
import { defineHandler } from '@/server/http/handler'
import { adminAppointmentService } from '@/server/services/AdminAppointmentService'
import { adminReservationListSchema } from '@/server/validators/appointment'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'appointments.read', schema: adminReservationListSchema },
  async ({ actor, body, log }) => {
    const result = await adminAppointmentService.list(actor, body)
    log.debug('予約一覧', { total: result.total, page: result.page })
    return result
  },
)
