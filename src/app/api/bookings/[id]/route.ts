import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_TRANSITIONS: Record<string, string[]> = {
  GEBUCHT: ['EINGETROFFEN', 'STORNIERT'],
  EINGETROFFEN: ['IN_ABFERTIGUNG', 'STORNIERT'],
  IN_ABFERTIGUNG: ['ABGESCHLOSSEN'],
  ABGESCHLOSSEN: [],
  STORNIERT: [],
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  const body = await request.json()
  const { status } = body

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) return NextResponse.json({ error: 'Buchung nicht gefunden.' }, { status: 404 })

  const allowed = VALID_TRANSITIONS[booking.status] || []
  if (!allowed.includes(status)) {
    return NextResponse.json({
      error: `Statuswechsel von ${booking.status} zu ${status} ist nicht erlaubt.`,
    }, { status: 400 })
  }

  const updated = await prisma.booking.update({ where: { id }, data: { status }, include: { dock: true } })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  try {
    await prisma.booking.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Buchung nicht gefunden.' }, { status: 404 })
    throw e
  }
}
