import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const docks = await prisma.dock.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(docks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name } = body
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name ist erforderlich.' }, { status: 400 })
  }
  try {
    const dock = await prisma.dock.create({ data: { name: name.trim() } })
    return NextResponse.json(dock, { status: 201 })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002') return NextResponse.json({ error: 'Name bereits vergeben.' }, { status: 409 })
    throw e
  }
}
