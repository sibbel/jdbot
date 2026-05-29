'use client'
import { GridCellData } from '@/lib/types'

const STATUS_STYLES: Record<string, string> = {
  GEBUCHT: 'bg-blue-100 border-blue-300 text-blue-900',
  EINGETROFFEN: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  IN_ABFERTIGUNG: 'bg-orange-100 border-orange-300 text-orange-900',
  ABGESCHLOSSEN: 'bg-gray-200 border-gray-300 text-gray-600',
  STORNIERT: 'bg-red-50 border-red-200 text-red-400 line-through',
}

const STATUS_LABELS: Record<string, string> = {
  GEBUCHT: 'Gebucht',
  EINGETROFFEN: 'Eingetroffen',
  IN_ABFERTIGUNG: 'In Abfertigung',
  ABGESCHLOSSEN: 'Abgeschlossen',
  STORNIERT: 'Storniert',
}

interface GridCellProps {
  cell: GridCellData
  onBook: (cell: GridCellData) => void
}

export function GridCell({ cell, onBook }: GridCellProps) {
  if (cell.isNonWorkday) {
    return (
      <div className="h-14 border border-gray-100 rounded text-xs p-1 flex items-center justify-center text-gray-400 bg-slate-50">
        –
      </div>
    )
  }

  if (!cell.booking && cell.isPast) {
    return (
      <div className="h-14 border border-gray-100 rounded text-xs p-1 flex items-center justify-center text-gray-400 bg-gray-100 opacity-60">
        vergangen
      </div>
    )
  }

  if (cell.booking) {
    const style = STATUS_STYLES[cell.booking.status] || ''
    return (
      <div className={`h-14 border rounded text-xs p-1.5 overflow-hidden cursor-default ${style}`}>
        <div className="font-semibold truncate">{cell.booking.speditionName}</div>
        <div className="truncate text-xs opacity-75">{cell.booking.kennzeichen}</div>
        <div className="text-xs opacity-60">{STATUS_LABELS[cell.booking.status]}</div>
      </div>
    )
  }

  return (
    <div
      className="h-14 border border-green-200 rounded bg-green-50 hover:bg-green-100 cursor-pointer flex items-center justify-center text-green-700 text-xs font-medium transition-colors"
      onClick={() => onBook(cell)}
    >
      + Buchen
    </div>
  )
}
