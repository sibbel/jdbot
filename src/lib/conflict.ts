import { prisma } from './prisma'
import { SlotConfigData } from './types'
import { isSlotInPast, isWorkday } from './grid-utils'

export type ConflictResult =
  | { ok: true }
  | { ok: false; reason: string }

export async function checkConflict(
  dockId: number,
  date: string,
  slotStart: string,
  slotEnd: string,
  config: SlotConfigData
): Promise<ConflictResult> {
  if (!isWorkday(date, config.workdays)) {
    return { ok: false, reason: 'Dieser Tag ist kein Arbeitstag.' }
  }

  if (isSlotInPast(date, slotStart)) {
    return { ok: false, reason: 'Vergangene Zeitfenster können nicht gebucht werden.' }
  }

  if (slotStart < config.openingTime || slotEnd > config.closingTime) {
    return { ok: false, reason: 'Zeitfenster liegt außerhalb der Öffnungszeiten.' }
  }

  const existing = await prisma.booking.findFirst({
    where: {
      dockId,
      date,
      slotStart,
      status: { not: 'STORNIERT' },
    },
  })

  if (existing) {
    return { ok: false, reason: 'Dieser Slot ist bereits belegt.' }
  }

  return { ok: true }
}

export async function getSlotConfigData(): Promise<SlotConfigData> {
  let config = await prisma.slotConfig.findFirst()
  if (!config) {
    config = await prisma.slotConfig.create({
      data: {
        openingTime: '06:00',
        closingTime: '18:00',
        slotDuration: 30,
        bufferMinutes: 0,
        workdays: '[1,2,3,4,5]',
      },
    })
  }
  return {
    ...config,
    workdays: JSON.parse(config.workdays) as number[],
  }
}
