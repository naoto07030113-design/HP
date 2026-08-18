/** カルテの改訂履歴。診療内容を含むため管理者のみ */
import { defineHandler } from '@/server/http/handler'
import { medicalRecordService } from '@/server/services/MedicalRecordService'
import { medicalRecordIdSchema } from '@/server/validators/medicalRecord'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'auditLogs.read', schema: medicalRecordIdSchema },
  async ({ actor, body }) => medicalRecordService.revisions(actor, body.id),
)
