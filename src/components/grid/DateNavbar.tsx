'use client'
import { addDaysToDateString, formatDateDE } from '@/lib/grid-utils'

interface DateNavbarProps {
  date: string
  view: 'day' | 'week'
  onDateChange: (date: string) => void
  onViewToggle: () => void
  today: string
}

export function DateNavbar({ date, view, onDateChange, onViewToggle, today }: DateNavbarProps) {
  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <button
        onClick={() => onDateChange(addDaysToDateString(date, view === 'week' ? -7 : -1))}
        className="px-3 py-1.5 bg-white border rounded hover:bg-gray-50 text-sm"
      >
        ← Zurück
      </button>
      <button
        onClick={() => onDateChange(today)}
        className="px-3 py-1.5 bg-white border rounded hover:bg-gray-50 text-sm font-medium"
      >
        Heute
      </button>
      <button
        onClick={() => onDateChange(addDaysToDateString(date, view === 'week' ? 7 : 1))}
        className="px-3 py-1.5 bg-white border rounded hover:bg-gray-50 text-sm"
      >
        Weiter →
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="px-2 py-1.5 border rounded text-sm"
      />
      <span className="text-gray-700 font-medium text-sm flex-1">
        {view === 'day' ? formatDateDE(date) : `Woche ab ${formatDateDE(date)}`}
      </span>
      <button
        onClick={onViewToggle}
        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        {view === 'day' ? 'Wochenansicht' : 'Tagesansicht'}
      </button>
    </div>
  )
}
