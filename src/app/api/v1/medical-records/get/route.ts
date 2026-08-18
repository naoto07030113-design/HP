/** カルテ1件。診療録の閲覧そのものを監査ログに残す */
import { defineHandler } from '@/server/http/handler'
import { medicalRecordService } from '@/server/services/MedicalRecordService'
import { medicalRecordIdSchema } from '@/server/validators/medicalRecord'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'medicalRecords.read', schema: medicalRecordIdSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const record = await medicalRecordService.get(actor, body.id)
    await writeAuditLog({
      requestId, action: 'medical_record.view',
      actorId: actor.id, actorRole: actor.role, clinicId: record.clinicId,
      targetType: 'medical_record', targetId: record.id, result: 'success',
      ipAddress, userAgent,
    })
    return { record }
  },
)
