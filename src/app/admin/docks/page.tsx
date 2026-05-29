import { prisma } from '@/lib/prisma'
import { DockManager } from '@/components/admin/DockManager'

export default async function DocksPage() {
  const docks = await prisma.dock.findMany({ orderBy: { name: 'asc' } })
  const docksData = docks.map((d) => ({ id: d.id, name: d.name, isActive: d.isActive }))
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rampen verwalten</h1>
      <DockManager initialDocks={docksData} />
    </div>
  )
}
