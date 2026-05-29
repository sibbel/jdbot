import { format, parseISO, isBefore } from 'date-fns'

export function generateTimeSlots(
  openingTime: string,
  closingTime: string,
  slotDuration: number,
  bufferMinutes: number
): { slotStart: string; slotEnd: string }[] {
  const slots: { slotStart: string; slotEnd: string }[] = []
  const [openH, openM] = openingTime.split(':').map(Number)
  const [closeH, closeM] = closingTime.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  let current = openMinutes
  while (current + slotDuration <= closeMinutes) {
    const start = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    const endMin = current + slotDuration
    const end = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
    slots.push({ slotStart: start, slotEnd: end })
    current += slotDuration + bufferMinutes
  }
  return slots
}

export function isWorkday(dateStr: string, workdays: number[]): boolean {
  const date = parseISO(dateStr)
  return workdays.includes(date.getDay())
}

export function isSlotInPast(dateStr: string, slotStart: string): boolean {
  const now = new Date()
  const slotDate = parseISO(dateStr)
  const [h, m] = slotStart.split(':').map(Number)
  slotDate.setHours(h, m, 0, 0)
  return isBefore(slotDate, now)
}

export function formatDateDE(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parseISO(dateStr))
}

export function formatDateShortDE(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(parseISO(dateStr))
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const d = parseISO(dateStr)
  d.setDate(d.getDate() + days)
  return format(d, 'yyyy-MM-dd')
}

export function getWeekDates(startDateStr: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysToDateString(startDateStr, i))
}

export function getWeekStart(dateStr: string): string {
  const d = parseISO(dateStr)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return format(d, 'yyyy-MM-dd')
}
