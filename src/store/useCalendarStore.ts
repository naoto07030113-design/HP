import { create } from 'zustand'

type CalendarView = 'day' | 'week' | 'month' | 'list'

interface CalendarState {
  view: CalendarView
  selectedDate: string
  setView: (view: CalendarView) => void
  setDate: (date: string) => void
}

export const useCalendarStore = create<CalendarState>((set) => ({
  view: 'week',
  selectedDate: new Date().toISOString().slice(0, 10),
  setView: (view) => set({ view }),
  setDate: (selectedDate) => set({ selectedDate }),
}))
