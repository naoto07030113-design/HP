/**
 * カルテの更新。
 * 上書きする前に、変更前の内容が改訂履歴として保存される。
 */
import { defineHandler } from '@/server/http/handler'
import { medicalRecordService } from '@/server/services/MedicalRecordService'
import { medicalRecordUpdateSchema } from '@/server/validators/medicalRecord'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'medicalRecords.write', schema: medicalRecordUpdateSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const { id, ...values } = body
    const { before, after } = await medicalRecordService.update(actor, id, values, requestId)
    await writeAuditLog({
      requestId, action: 'medical_record.update',
      actorId: actor.id, actorRole: actor.role, clinicId: after.clinicId,
      targetType: 'medical_record', targetId: after.id, result: 'success',
      before, after, ipAddress, userAgent,
    })
    return { record: after }
  },
)
