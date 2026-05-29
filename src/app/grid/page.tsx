import { prisma } from '@/lib/prisma'
import { getSlotConfigData } from '@/lib/conflict'
import { BookingGrid } from '@/components/grid/BookingGrid'

export default async function GridPage() {
  const [docks, config] = await Promise.all([
    prisma.dock.findMany({ orderBy: { name: 'asc' } }),
    getSlotConfigData(),
  ])

  const docksData = docks.map((d) => ({ id: d.id, name: d.name, isActive: d.isActive }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Zeitfensterplanung</h1>
      <BookingGrid initialDocks={docksData} initialConfig={config} />
    </div>
  )
}
