'use client'
import { useState, useEffect, useCallback } from 'react'
import { DockData, SlotConfigData, BookingData, GridCellData } from '@/lib/types'
import { generateTimeSlots, isWorkday, isSlotInPast, getTodayString, getWeekStart, getWeekDates, formatDateShortDE, addDaysToDateString } from '@/lib/grid-utils'
import { GridCell } from './GridCell'
import { DateNavbar } from './DateNavbar'
import { BookingDialog } from '@/components/booking/BookingDialog'

interface BookingGridProps {
  initialDocks: DockData[]
  initialConfig: SlotConfigData
}

export function BookingGrid({ initialDocks, initialConfig }: BookingGridProps) {
  const today = getTodayString()
  const [date, setDate] = useState(today)
  const [view, setView] = useState<'day' | 'week'>('day')
  const [selectedCell, setSelectedCell] = useState<GridCellData | null>(null)
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(false)

  const activeDocks = initialDocks.filter((d) => d.isActive)
  const slots = generateTimeSlots(
    initialConfig.openingTime,
    initialConfig.closingTime,
    initialConfig.slotDuration,
    initialConfig.bufferMinutes
  )

  const fetchBookings = useCallback(async (fetchDate: string, fetchView: 'day' | 'week') => {
    setLoading(true)
    try {
      if (fetchView === 'day') {
        const res = await fetch(`/api/bookings?date=${fetchDate}`)
        if (res.ok) setBookings(await res.json())
      } else {
        const weekStart = getWeekStart(fetchDate)
        const weekDates = getWeekDates(weekStart)
        const results = await Promise.all(
          weekDates.map((d) => fetch(`/api/bookings?date=${d}`).then((r) => r.json()))
        )
        setBookings(results.flat())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings(date, view)
  }, [date, view, fetchBookings])

  const handleBook = (cell: GridCellData) => setSelectedCell(cell)

  const handleSuccess = () => {
    setSelectedCell(null)
    fetchBookings(date, view)
  }

  const buildCell = (dockId: number, dateStr: string, slot: { slotStart: string; slotEnd: string }): GridCellData => {
    const booking = bookings.find(
      (b) => b.dockId === dockId && b.date === dateStr && b.slotStart === slot.slotStart
    ) || null
    return {
      dockId,
      date: dateStr,
      slotStart: slot.slotStart,
      slotEnd: slot.slotEnd,
      booking,
      isPast: isSlotInPast(dateStr, slot.slotStart),
      isNonWorkday: !isWorkday(dateStr, initialConfig.workdays),
    }
  }

  if (view === 'day') {
    return (
      <div>
        <DateNavbar
          date={date}
          view={view}
          onDateChange={setDate}
          onViewToggle={() => setView('week')}
          today={today}
        />
        {loading && <p className="text-sm text-gray-500 mb-2">Wird geladen...</p>}
        <div className="overflow-x-auto">
          <div
            className="grid gap-1 min-w-max"
            style={{ gridTemplateColumns: `80px repeat(${activeDocks.length}, minmax(120px, 1fr))` }}
          >
            {/* Header */}
            <div className="text-xs font-semibold text-gray-500 uppercase py-2 flex items-end">Zeit</div>
            {activeDocks.map((dock) => (
              <div key={dock.id} className="text-xs font-semibold text-gray-700 py-2 px-2 bg-gray-100 rounded text-center truncate">
                {dock.name}
              </div>
            ))}
            {/* Rows */}
            {slots.map((slot) => (
              <>
                <div key={`t-${slot.slotStart}`} className="text-xs text-gray-500 flex items-center py-1">
                  {slot.slotStart}
                </div>
                {activeDocks.map((dock) => (
                  <GridCell
                    key={`${dock.id}-${slot.slotStart}`}
                    cell={buildCell(dock.id, date, slot)}
                    onBook={handleBook}
                  />
                ))}
              </>
            ))}
          </div>
        </div>
        <BookingDialog
          cell={selectedCell}
          docks={initialDocks}
          onClose={() => setSelectedCell(null)}
          onSuccess={handleSuccess}
        />
      </div>
    )
  }

  // Week view
  const weekStart = getWeekStart(date)
  const weekDates = getWeekDates(weekStart)

  return (
    <div>
      <DateNavbar
        date={weekStart}
        view={view}
        onDateChange={(d) => setDate(getWeekStart(d))}
        onViewToggle={() => { setView('day'); setDate(weekStart) }}
        today={today}
      />
      {loading && <p className="text-sm text-gray-500 mb-2">Wird geladen...</p>}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {weekDates.map((dayStr) => {
            const isNonWork = !isWorkday(dayStr, initialConfig.workdays)
            const dayBookings = bookings.filter((b) => b.date === dayStr)
            return (
              <div key={dayStr} className={`w-36 flex-shrink-0 ${isNonWork ? 'opacity-50' : ''}`}>
                <button
                  className={`w-full text-center py-2 text-xs font-semibold rounded mb-1 ${
                    dayStr === today ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => { setView('day'); setDate(dayStr) }}
                >
                  {formatDateShortDE(dayStr)}
                </button>
                {isNonWork ? (
                  <div className="text-center text-xs text-gray-400 py-4">Kein Arbeitstag</div>
                ) : (
                  <div className="space-y-1">
                    {slots.slice(0, 8).map((slot) => {
                      const slotBookings = dayBookings.filter((b) => b.slotStart === slot.slotStart && b.status !== 'STORNIERT')
                      return (
                        <div key={slot.slotStart} className="text-xs flex gap-1 items-center">
                          <span className="text-gray-400 w-10 flex-shrink-0">{slot.slotStart}</span>
                          <span className={`flex-1 rounded px-1 py-0.5 truncate ${slotBookings.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-50 text-green-700'}`}>
                            {slotBookings.length > 0 ? `${slotBookings.length} Buch.` : 'Frei'}
                          </span>
                        </div>
                      )
                    })}
                    {slots.length > 8 && (
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => { setView('day'); setDate(dayStr) }}
                      >
                        Alle anzeigen →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <BookingDialog
        cell={selectedCell}
        docks={initialDocks}
        onClose={() => setSelectedCell(null)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
