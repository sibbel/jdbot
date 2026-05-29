import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSlotConfigData } from '@/lib/conflict'

export async function GET() {
  const config = await getSlotConfigData()
  return NextResponse.json(config)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { openingTime, closingTime, slotDuration, bufferMinutes, workdays } = body

  if (openingTime >= closingTime) {
    return NextResponse.json({ error: 'Öffnungszeit muss vor Schließzeit liegen.' }, { status: 400 })
  }

  const existing = await prisma.slotConfig.findFirst()
  const updated = existing
    ? await prisma.slotConfig.update({
        where: { id: existing.id },
        data: { openingTime, closingTime, slotDuration, bufferMinutes, workdays: JSON.stringify(workdays) },
      })
    : await prisma.slotConfig.create({
        data: { openingTime, closingTime, slotDuration, bufferMinutes, workdays: JSON.stringify(workdays) },
      })

  return NextResponse.json({ ...updated, workdays: JSON.parse(updated.workdays) })
}
