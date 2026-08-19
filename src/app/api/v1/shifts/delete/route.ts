/** シフトの削除。シフトは業務記録ではなく予定なので物理削除のまま扱う */
import { defineHandler } from '@/server/http/handler'
import { shiftService } from '@/server/services/ShiftService'
import { shiftDeleteSchema } from '@/server/validators/shift'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'shifts.manage', schema: shiftDeleteSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const removed = await shiftService.remove(actor, body.staffId, body.workDate)

    if (removed) {
      await writeAuditLog({
        requestId, action: 'shift.delete',
        actorId: actor.id, actorRole: actor.role, clinicId: removed.clinicId,
        targetType: 'shift', targetId: removed.id, result: 'success',
        before: { workDate: removed.workDate, shiftType: removed.shiftType },
        ipAddress, userAgent,
      })
    }

    return { removed }
  },
)
