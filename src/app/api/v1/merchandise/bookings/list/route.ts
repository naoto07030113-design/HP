/** 物販予約の一覧。所属院の外は返さない（患者の氏名と電話番号を含むため） */
import { defineHandler } from '@/server/http/handler'
import { merchandiseService } from '@/server/services/MerchandiseService'
import { merchandiseBookingListSchema } from '@/server/validators/merchandise'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'merchandise.read', schema: merchandiseBookingListSchema },
  async ({ actor, body }) => merchandiseService.listBookings(actor, body),
)
