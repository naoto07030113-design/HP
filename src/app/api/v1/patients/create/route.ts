/** 患者の新規登録 */
import { defineHandler } from '@/server/http/handler'
import { patientService } from '@/server/services/PatientService'
import { patientCreateSchema } from '@/server/validators/patient'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'patients.write', schema: patientCreateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const patient = await patientService.create(actor, body)
    await writeAuditLog({
      requestId, action: 'patient.create',
      actorId: actor.id, actorRole: actor.role, clinicId: patient.clinicId,
      targetType: 'patient', targetId: patient.id, result: 'success',
      after: patient, ipAddress, userAgent,
    })
    return { patient }
  },
)
