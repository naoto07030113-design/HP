/**
 * シフトの登録・更新。1件でも一括（前週コピー・一括入力）でも同じ経路を通す。
 * 対象スタッフが本当にその院に所属しているかはサーバーで確認する。
 */
import { defineHandler } from '@/server/http/handler'
import { shiftService } from '@/server/services/ShiftService'
import { shiftBulkUpsertSchema } from '@/server/validators/shift'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'shifts.manage', schema: shiftBulkUpsertSchema },
  async ({ actor, body, requestId, ipAddress, userAgent, log }) => {
    const shifts = await shiftService.upsertMany(actor, body.shifts)

    await writeAuditLog({
      requestId, action: 'shift.upsert',
      actorId: actor.id, actorRole: actor.role,
      clinicId: body.shifts[0]?.clinicId ?? null,
      targetType: 'shift',
      targetId: shifts.length === 1 ? shifts[0].id : null,
      result: 'success',
      after: {
        count: shifts.length,
        from: body.shifts[0]?.workDate ?? null,
        to: body.shifts[body.shifts.length - 1]?.workDate ?? null,
      },
      ipAddress, userAgent,
    })

    log.debug('シフト保存', { count: shifts.length })
    return { shifts }
  },
)
