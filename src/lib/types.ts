export type Role = 'ADMIN' | 'CARRIER'

export type SlotConfigData = {
  id: number
  openingTime: string
  closingTime: string
  slotDuration: number
  bufferMinutes: number
  workdays: number[]
}

export type DockData = {
  id: number
  name: string
  isActive: boolean
}

export type BookingData = {
  id: number
  dockId: number
  date: string
  slotStart: string
  slotEnd: string
  status: 'GEBUCHT' | 'EINGETROFFEN' | 'IN_ABFERTIGUNG' | 'ABGESCHLOSSEN' | 'STORNIERT'
  speditionName: string
  kennzeichen: string
  referenz: string | null
  kontaktName: string
  kontaktTelefon: string
  warenart: string
  anzahlPaletten: number
  bemerkung: string | null
  createdAt: string
}

export type GridCellData = {
  dockId: number
  date: string
  slotStart: string
  slotEnd: string
  booking: BookingData | null
  isPast: boolean
  isNonWorkday: boolean
}
