/** カルテの新規作成 */
import { defineHandler } from '@/server/http/handler'
import { medicalRecordService } from '@/server/services/MedicalRecordService'
import { medicalRecordCreateSchema } from '@/server/validators/medicalRecord'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'medicalRecords.write', schema: medicalRecordCreateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const record = await medicalRecordService.create(actor, body)
    await writeAuditLog({
      requestId, action: 'medical_record.create',
      actorId: actor.id, actorRole: actor.role, clinicId: record.clinicId,
      targetType: 'medical_record', targetId: record.id, result: 'success',
      after: record, ipAddress, userAgent,
    })
    return { record }
  },
)
