/** 患者情報の更新。変更前後を監査ログに残す */
import { defineHandler } from '@/server/http/handler'
import { patientService } from '@/server/services/PatientService'
import { patientUpdateSchema } from '@/server/validators/patient'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'patients.write', schema: patientUpdateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const { id, ...values } = body
    const { before, after } = await patientService.update(actor, id, values)
    await writeAuditLog({
      requestId, action: 'patient.update',
      actorId: actor.id, actorRole: actor.role, clinicId: after.clinicId,
      targetType: 'patient', targetId: after.id, result: 'success',
      before, after, ipAddress, userAgent,
    })
    return { patient: after }
  },
)
