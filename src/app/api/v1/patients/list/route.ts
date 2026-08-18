/** 患者一覧。所属院の外は返さない。件数が増えても壊れないよう必ずページングする */
import { defineHandler } from '@/server/http/handler'
import { patientService } from '@/server/services/PatientService'
import { patientListSchema } from '@/server/validators/patient'

export const dynamic = 'force-dynamic'

export const POST = defineHandler(
  { auth: 'required', capability: 'patients.read', schema: patientListSchema },
  async ({ actor, body, log }) => {
    const result = await patientService.list(actor, body)
    log.debug('患者一覧', { total: result.total, page: result.page })
    return result
  },
)
