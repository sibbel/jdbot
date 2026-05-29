import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  const body = await request.json()
  const { name, isActive } = body
  try {
    const dock = await prisma.dock.update({ where: { id }, data: { name, isActive } })
    return NextResponse.json(dock)
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002') return NextResponse.json({ error: 'Name bereits vergeben.' }, { status: 409 })
    throw e
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  const dock = await prisma.dock.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json(dock)
}
