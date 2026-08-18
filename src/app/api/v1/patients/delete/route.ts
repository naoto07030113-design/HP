/**
 * 患者の削除。論理削除であり、行もカルテも残る。
 * 以前は物理削除で、外部キーの CASCADE によりカルテまで消えていた。
 */
import { defineHandler } from '@/server/http/handler'
import { patientService } from '@/server/services/PatientService'
import { patientIdSchema } from '@/server/validators/patient'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'patients.delete', schema: patientIdSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const removed = await patientService.remove(actor, body.id)
    await writeAuditLog({
      requestId, action: 'patient.delete',
      actorId: actor.id, actorRole: actor.role, clinicId: removed.clinicId,
      targetType: 'patient', targetId: removed.id, result: 'success',
      before: removed, ipAddress, userAgent,
    })
    return { id: removed.id }
  },
)
