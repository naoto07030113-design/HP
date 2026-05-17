export type ReservationStatus = 'booked' | 'visited' | 'cancelled' | 'noshow' | 'block'

export interface Reservation {
  id: string
  patientName: string
  menuName: string
  staffId: string
  startAt: string
  endAt: string
  status: ReservationStatus
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  referredBy?: string
}

export interface Staff {
  id: string
  name: string
}
