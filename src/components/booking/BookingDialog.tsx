'use client'
import { GridCellData, DockData } from '@/lib/types'
import { BookingForm } from './BookingForm'
import { formatDateDE } from '@/lib/grid-utils'

interface BookingDialogProps {
  cell: GridCellData | null
  docks: DockData[]
  onClose: () => void
  onSuccess: () => void
}

export function BookingDialog({ cell, docks, onClose, onSuccess }: BookingDialogProps) {
  if (!cell) return null

  const dock = docks.find((d) => d.id === cell.dockId)
  const dockName = dock?.name ?? `Rampe #${cell.dockId}`

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Zeitfenster buchen</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {dockName} · {formatDateDE(cell.date)} · {cell.slotStart}–{cell.slotEnd} Uhr
          </p>
        </div>
        <div className="px-6 py-4">
          <BookingForm
            cell={cell}
            dockName={dockName}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
