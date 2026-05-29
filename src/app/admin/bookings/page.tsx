import { prisma } from '@/lib/prisma'
import { BookingList } from '@/components/admin/BookingList'

export default async function BookingsPage() {
  const docks = await prisma.dock.findMany({ orderBy: { name: 'asc' } })
  const docksData = docks.map((d) => ({ id: d.id, name: d.name, isActive: d.isActive }))
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buchungsübersicht</h1>
      <BookingList docks={docksData} />
    </div>
  )
}
