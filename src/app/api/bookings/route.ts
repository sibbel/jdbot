import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkConflict, getSlotConfigData } from '@/lib/conflict'
import { z } from 'zod'

const CreateBookingSchema = z.object({
  dockId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotStart: z.string().regex(/^\d{2}:\d{2}$/),
  slotEnd: z.string().regex(/^\d{2}:\d{2}$/),
  speditionName: z.string().min(1),
  kennzeichen: z.string().min(1),
  referenz: z.string().optional(),
  kontaktName: z.string().min(1),
  kontaktTelefon: z.string().min(1),
  warenart: z.string().min(1),
  anzahlPaletten: z.number().int().min(1),
  bemerkung: z.string().optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const dockId = searchParams.get('dockId')
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}
  if (date) where.date = date
  if (dockId) where.dockId = parseInt(dockId)
  if (status) where.status = status
  if (from && to) where.date = { gte: from, lte: to }
  if (search) where.speditionName = { contains: search }

  const bookings = await prisma.booking.findMany({
    where,
    include: { dock: true },
    orderBy: [{ date: 'asc' }, { slotStart: 'asc' }],
  })

  return NextResponse.json(bookings)
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const config = await getSlotConfigData()

  const conflict = await checkConflict(data.dockId, data.date, data.slotStart, data.slotEnd, config)
  if (!conflict.ok) {
    return NextResponse.json({ error: conflict.reason }, { status: 409 })
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        dockId: data.dockId,
        date: data.date,
        slotStart: data.slotStart,
        slotEnd: data.slotEnd,
        speditionName: data.speditionName,
        kennzeichen: data.kennzeichen,
        referenz: data.referenz,
        kontaktName: data.kontaktName,
        kontaktTelefon: data.kontaktTelefon,
        warenart: data.warenart,
        anzahlPaletten: data.anzahlPaletten,
        bemerkung: data.bemerkung,
      },
      include: { dock: true },
    })
    return NextResponse.json(booking, { status: 201 })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Dieser Slot wurde soeben belegt. Bitte wählen Sie einen anderen.' }, { status: 409 })
    }
    throw e
  }
}
