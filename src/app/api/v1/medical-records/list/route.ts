/** カルテ一覧。所属院の外は返さない。件数が増えても壊れないようページングする */
import { defineHandler } from '@/server/http/handler'
import { medicalRecordService } from '@/server/services/MedicalRecordService'
import { medicalRecordListSchema } from '@/server/validators/medicalRecord'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'medicalRecords.read', schema: medicalRecordListSchema },
  async ({ actor, body, log }) => {
    const result = await medicalRecordService.list(actor, body)
    log.debug('カルテ一覧', { total: result.total, page: result.page })
    return result
  },
)
