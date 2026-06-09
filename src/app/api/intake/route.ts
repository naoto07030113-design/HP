import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { format } from 'date-fns'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patient, reservation } = body as {
      patient?: {
        name: string
        name_kana?: string
        gender?: string
        birth_date?: string
        phone?: string
        email?: string
        postal_code?: string
        address?: string
        chief_complaint?: string
        medical_history?: string
        current_medications?: string
        allergies?: string
        referral_source?: string
      }
      reservation: {
        clinic_id: string
        staff_id: string | null
        menu_id: string | null
        patient_name: string
        patient_phone: string | null
        start_at: string
        end_at: string
        memo: string | null
      }
    }

    const supabase = createServiceClient()
    let patientId: string | null = null

    if (patient?.name) {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert({
          clinic_id: reservation.clinic_id,
          name: patient.name,
          name_kana: patient.name_kana ?? '',
          gender: patient.gender ?? 'unknown',
          birth_date: patient.birth_date || null,
          phone: patient.phone || null,
          email: patient.email || null,
          postal_code: patient.postal_code || null,
          address: patient.address || null,
          first_visit_date: format(new Date(), 'yyyy-MM-dd'),
          chief_complaint: patient.chief_complaint || null,
          medical_history: patient.medical_history || null,
          current_medications: patient.current_medications || null,
          allergies: patient.allergies || null,
          referral_source: patient.referral_source || null,
        })
        .select('id')
        .single()

      if (patientError) throw patientError
      patientId = patientData.id
    }

    const { error: resError } = await supabase.from('reservations').insert({
      clinic_id: reservation.clinic_id,
      staff_id: reservation.staff_id,
      menu_id: reservation.menu_id,
      patient_id: patientId,
      patient_name: reservation.patient_name,
      patient_phone: reservation.patient_phone,
      referral_name: null,
      start_at: reservation.start_at,
      end_at: reservation.end_at,
      status: 'confirmed',
      memo: reservation.memo,
    })

    if (resError) throw resError

    return NextResponse.json({ ok: true, patient_id: patientId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
