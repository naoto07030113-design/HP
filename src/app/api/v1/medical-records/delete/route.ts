/**
 * カルテの削除。論理削除であり、行は残る。
 * 削除前の内容は改訂履歴にも保存される。
 */
import { defineHandler } from '@/server/http/handler'
import { medicalRecordService } from '@/server/services/MedicalRecordService'
import { medicalRecordIdSchema } from '@/server/validators/medicalRecord'
import { writeAuditLog } from '@/server/logging/auditLog'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'medicalRecords.delete', schema: medicalRecordIdSchema },
  async ({ actor, body, requestId, ipAddress, userAgent }) => {
    const removed = await medicalRecordService.remove(actor, body.id, requestId)
    await writeAuditLog({
      requestId, action: 'medical_record.delete',
      actorId: actor.id, actorRole: actor.role, clinicId: removed.clinicId,
      targetType: 'medical_record', targetId: removed.id, result: 'success',
      before: removed, ipAddress, userAgent,
    })
    return { id: removed.id }
  },
)
