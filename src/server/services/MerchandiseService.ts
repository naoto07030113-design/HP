/**
 * 物販予約。
 *
 * 予約には患者の氏名と電話番号が入るため、患者データと同じ扱いにする。
 * 以前は患者向けページがブラウザから直接 INSERT し、管理画面は全件を
 * 取得していた。登録も参照もここを通す。
 */

import {
  merchandiseRepository,
  type MerchandiseBookingRow,
} from '../repositories/MerchandiseRepository'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { assertClinicAccess, clinicScope, requireCapability } from '../permissions/policy'
import type { Actor } from '../auth/session'
import type {
  MerchandiseBookingCreateInput, MerchandiseBookingListInput,
} from '../validators/merchandise'

export type MerchandiseBookingDto = {
  id: string
  merchandiseId: string
  merchandiseName: string | null
  clinicId: string
  patientName: string
  patientPhone: string | null
  quantity: number
  status: MerchandiseBookingRow['status']
  notes: string | null
  bookedAt: string
  price: number | null
}

function toDto(r: MerchandiseBookingRow): MerchandiseBookingDto {
  return {
    id: r.id,
    merchandiseId: r.merchandise_id,
    merchandiseName: r.merchandise?.name ?? null,
    clinicId: r.clinic_id,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    quantity: r.quantity,
    status: r.status,
    notes: r.notes,
    bookedAt: r.booked_at,
    price: r.merchandise?.price ?? null,
  }
}

export const merchandiseService = {
  async listBookings(actor: Actor, input: MerchandiseBookingListInput) {
    requireCapability(actor, 'merchandise.read')
    const scope = clinicScope(actor)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)

    const { rows, total } = await merchandiseRepository.listBookings({
      clinicScope: scope,
      clinicFilter: input.clinicId ?? null,
      status: input.status ?? null,
      page: input.page,
      perPage: input.perPage,
    })

    return {
      bookings: rows.map(toDto),
      page: input.page,
      perPage: input.perPage,
      total,
      hasNext: input.page * input.perPage < total,
    }
  },

  /** 患者向け（未認証）。状態は必ず pending で作る */
  async createBooking(input: MerchandiseBookingCreateInput): Promise<{ bookingId: string }> {
    const item = await merchandiseRepository.findItem(input.merchandiseId)
    if (!item || !item.is_active || item.clinic_id !== input.clinicId) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '商品が見つかりませんでした。',
        detail: `merchandiseId=${input.merchandiseId} clinicId=${input.clinicId}`,
      })
    }

    const bookingId = await merchandiseRepository.insertBooking({
      merchandise_id: input.merchandiseId,
      clinic_id: input.clinicId,
      patient_id: null,
      patient_name: input.patientName,
      patient_phone: input.patientPhone,
      quantity: input.quantity,
      status: 'pending',
      notes: input.notes,
    })

    return { bookingId }
  },

  async changeStatus(actor: Actor, id: string, status: MerchandiseBookingRow['status']) {
    requireCapability(actor, 'merchandise.manage')

    const current = await merchandiseRepository.findBooking(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '物販予約が見つかりませんでした。', detail: `bookingId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)

    await merchandiseRepository.updateBookingStatus(id, status)
    return { before: toDto(current), after: { ...toDto(current), status } }
  },

  async removeBooking(actor: Actor, id: string): Promise<MerchandiseBookingDto> {
    requireCapability(actor, 'merchandise.manage')

    const current = await merchandiseRepository.findBooking(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '物販予約が見つかりませんでした。', detail: `bookingId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)

    await merchandiseRepository.deleteBooking(id)
    return toDto(current)
  },
}
