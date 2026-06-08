import type { Clinic, Staff, Menu, Shift, Reservation } from '@/types/clinic'
import { addDays, format, startOfWeek } from 'date-fns'

const NOW = new Date().toISOString()
const TODAY = format(new Date(), 'yyyy-MM-dd')
const WEEK_START = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

export const DEMO_CLINICS: Clinic[] = [
  {
    id: 'clinic-1',
    name: '葵鍼灸整骨院 本院',
    address: '東京都渋谷区神宮前3-1-1 グリーンビル2F',
    phone: '03-1234-5678',
    open_time: '09:00',
    close_time: '20:00',
    is_active: true,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'clinic-2',
    name: '葵鍼灸整骨院 新宿院',
    address: '東京都新宿区西新宿2-8-1',
    phone: '03-9876-5432',
    open_time: '10:00',
    close_time: '21:00',
    is_active: true,
    sort_order: 1,
    created_at: NOW,
    updated_at: NOW,
  },
]

export const DEMO_STAFF: Staff[] = [
  {
    id: 'staff-1',
    clinic_id: 'clinic-1',
    name: '田中 誠',
    role: '柔道整復師',
    is_bookable: true,
    is_active: true,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'staff-2',
    clinic_id: 'clinic-1',
    name: '佐藤 美咲',
    role: '鍼灸師',
    is_bookable: true,
    is_active: true,
    sort_order: 1,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'staff-3',
    clinic_id: 'clinic-1',
    name: '鈴木 健太',
    role: 'あん摩マッサージ指圧師',
    is_bookable: true,
    is_active: true,
    sort_order: 2,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'staff-4',
    clinic_id: 'clinic-2',
    name: '山田 花子',
    role: '鍼灸師',
    is_bookable: true,
    is_active: true,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
  },
]

export const DEMO_MENUS: Menu[] = [
  {
    id: 'menu-1',
    clinic_id: 'clinic-1',
    name: '整体・骨格矯正',
    duration_min: 60,
    price: 7700,
    visit_type: 'both',
    is_active: true,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'menu-2',
    clinic_id: 'clinic-1',
    name: '鍼灸治療',
    duration_min: 60,
    price: 8800,
    visit_type: 'both',
    is_active: true,
    sort_order: 1,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'menu-3',
    clinic_id: 'clinic-1',
    name: '初診カウンセリング',
    duration_min: 90,
    price: 5500,
    visit_type: 'first',
    is_active: true,
    sort_order: 2,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'menu-4',
    clinic_id: 'clinic-1',
    name: 'マッサージ30分',
    duration_min: 30,
    price: 3300,
    visit_type: 'return',
    is_active: true,
    sort_order: 3,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'menu-5',
    clinic_id: 'clinic-1',
    name: 'スポーツケア',
    duration_min: 90,
    price: 11000,
    visit_type: 'both',
    is_active: true,
    sort_order: 4,
    created_at: NOW,
    updated_at: NOW,
  },
]

function makeReservation(
  id: string,
  date: string,
  startHour: number,
  startMin: number,
  durationMin: number,
  staffId: string,
  menuId: string,
  patientName: string,
  status: Reservation['status'] = 'confirmed',
  phone?: string,
  memo?: string,
): Reservation {
  const start = new Date(`${date}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`)
  const end = new Date(start.getTime() + durationMin * 60 * 1000)
  return {
    id,
    clinic_id: 'clinic-1',
    staff_id: staffId,
    menu_id: menuId,
    patient_id: null,
    patient_name: patientName,
    patient_phone: phone ?? null,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    status,
    memo: memo ?? null,
    created_at: NOW,
    updated_at: NOW,
  }
}

export const DEMO_RESERVATIONS: Reservation[] = [
  makeReservation('res-1', TODAY, 9, 0, 60, 'staff-1', 'menu-1', '山本 太郎', 'confirmed', '090-1111-2222'),
  makeReservation('res-2', TODAY, 10, 0, 60, 'staff-1', 'menu-2', '小林 由美', 'confirmed', '090-3333-4444'),
  makeReservation('res-3', TODAY, 11, 30, 90, 'staff-1', 'menu-3', '新患 一郎', 'confirmed', '080-5555-6666', '腰痛で初めての来院'),
  makeReservation('res-4', TODAY, 9, 30, 60, 'staff-2', 'menu-2', '松本 花子', 'confirmed', '090-7777-8888'),
  makeReservation('res-5', TODAY, 11, 0, 60, 'staff-2', 'menu-1', '渡辺 健', 'visited'),
  makeReservation('res-6', TODAY, 13, 0, 30, 'staff-2', 'menu-4', '伊藤 恵', 'confirmed'),
  makeReservation('res-7', TODAY, 9, 0, 90, 'staff-3', 'menu-5', '中村 勇', 'confirmed', '080-1234-5678', 'マラソン選手'),
  makeReservation('res-8', TODAY, 11, 0, 30, 'staff-3', 'menu-4', '加藤 幸', 'cancelled'),
  makeReservation('res-9', TODAY, 14, 0, 60, 'staff-3', 'menu-1', '橋本 隆', 'confirmed'),
  // 翌日
  makeReservation('res-10', format(addDays(new Date(), 1), 'yyyy-MM-dd'), 10, 0, 60, 'staff-1', 'menu-1', '木村 優', 'confirmed'),
  makeReservation('res-11', format(addDays(new Date(), 1), 'yyyy-MM-dd'), 14, 0, 60, 'staff-2', 'menu-2', '林 浩二', 'confirmed'),
  // 昨日
  makeReservation('res-12', format(addDays(new Date(), -1), 'yyyy-MM-dd'), 10, 0, 60, 'staff-1', 'menu-1', '野村 敏', 'visited'),
  makeReservation('res-13', format(addDays(new Date(), -1), 'yyyy-MM-dd'), 15, 0, 90, 'staff-2', 'menu-3', '池田 初子', 'no_show'),
]

export const DEMO_SHIFTS: Shift[] = []

// 今週のシフト生成
const weekDays = [0, 1, 2, 3, 4, 5, 6]
weekDays.forEach((offset) => {
  const date = format(addDays(new Date(WEEK_START), offset), 'yyyy-MM-dd')
  const dayOfWeek = (new Date(date).getDay() + 6) % 7 // 0=月...6=日
  if (dayOfWeek < 5) { // 月〜金
    DEMO_SHIFTS.push({
      id: `shift-1-${date}`,
      staff_id: 'staff-1',
      clinic_id: 'clinic-1',
      work_date: date,
      start_time: '09:00',
      end_time: '18:00',
      break_start: '12:00',
      break_end: '13:00',
      created_at: NOW,
      updated_at: NOW,
    })
    DEMO_SHIFTS.push({
      id: `shift-2-${date}`,
      staff_id: 'staff-2',
      clinic_id: 'clinic-1',
      work_date: date,
      start_time: '10:00',
      end_time: '19:00',
      break_start: '13:00',
      break_end: '14:00',
      created_at: NOW,
      updated_at: NOW,
    })
  }
  if (dayOfWeek < 6) { // 月〜土
    DEMO_SHIFTS.push({
      id: `shift-3-${date}`,
      staff_id: 'staff-3',
      clinic_id: 'clinic-1',
      work_date: date,
      start_time: '09:00',
      end_time: '17:00',
      break_start: '12:30',
      break_end: '13:30',
      created_at: NOW,
      updated_at: NOW,
    })
  }
})
