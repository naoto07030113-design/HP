/** 患者1件。閲覧したこと自体を監査ログに残す */
import { defineHandler } from '@/server/http/handler'
import { patientService } from '@/server/services/PatientService'
import { patientIdSchema } from '@/server/validators/patient'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'patients.read', schema: patientIdSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const patient = await patientService.get(actor, body.id)
    await writeAuditLog({
      requestId, action: 'patient.view',
      actorId: actor.id, actorRole: actor.role, clinicId: patient.clinicId,
      targetType: 'patient', targetId: patient.id, result: 'success',
      ipAddress, userAgent,
    })
    return { patient }
  },
)
