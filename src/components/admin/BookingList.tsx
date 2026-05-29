'use client'
import { useState, useEffect } from 'react'
import { BookingData, DockData } from '@/lib/types'
import { showToast } from '@/components/Toast'

const STATUS_LABELS: Record<string, string> = {
  GEBUCHT: 'Gebucht',
  EINGETROFFEN: 'Eingetroffen',
  IN_ABFERTIGUNG: 'In Abfertigung',
  ABGESCHLOSSEN: 'Abgeschlossen',
  STORNIERT: 'Storniert',
}

const STATUS_COLORS: Record<string, string> = {
  GEBUCHT: 'bg-blue-100 text-blue-800',
  EINGETROFFEN: 'bg-yellow-100 text-yellow-800',
  IN_ABFERTIGUNG: 'bg-orange-100 text-orange-800',
  ABGESCHLOSSEN: 'bg-gray-200 text-gray-600',
  STORNIERT: 'bg-red-50 text-red-400',
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  GEBUCHT: ['EINGETROFFEN', 'STORNIERT'],
  EINGETROFFEN: ['IN_ABFERTIGUNG', 'STORNIERT'],
  IN_ABFERTIGUNG: ['ABGESCHLOSSEN'],
  ABGESCHLOSSEN: [],
  STORNIERT: [],
}

const TRANSITION_LABELS: Record<string, string> = {
  EINGETROFFEN: 'Eingetroffen',
  IN_ABFERTIGUNG: 'In Abfertigung',
  ABGESCHLOSSEN: 'Abgeschlossen',
  STORNIERT: 'Stornieren',
}

interface BookingListProps {
  docks: DockData[]
}

type BookingWithDock = BookingData & { dock?: { name: string } }

export function BookingList({ docks }: BookingListProps) {
  const [bookings, setBookings] = useState<BookingWithDock[]>([])
  const [loading, setLoading] = useState(true)
  const [changingId, setChangingId] = useState<number | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [dockId, setDockId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (from && to) { params.set('from', from); params.set('to', to) }
    if (dockId) params.set('dockId', dockId)
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    const res = await fetch(`/api/bookings?${params}`)
    if (res.ok) setBookings(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function changeStatus(id: number, newStatus: string) {
    setChangingId(id)
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...updated, dock: b.dock } : b)))
      showToast('Status aktualisiert.', 'success')
    } else {
      const data = await res.json()
      showToast(data.error || 'Fehler.', 'error')
    }
    setChangingId(null)
  }

  async function deleteBooking(id: number) {
    if (!confirm('Buchung wirklich löschen?')) return
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== id))
      showToast('Buchung gelöscht.', 'success')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end bg-gray-50 p-4 rounded border">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Von</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Bis</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Rampe</label>
          <select value={dockId} onChange={(e) => setDockId(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">Alle</option>
            {docks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">Alle</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Spedition</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche..." className="border rounded px-2 py-1.5 text-sm" />
        </div>
        <button onClick={load} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Suchen
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Wird geladen...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-500">Keine Buchungen gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left bg-gray-50">
                <th className="py-2 px-3 font-semibold text-gray-700">Datum</th>
                <th className="py-2 px-3 font-semibold text-gray-700">Zeit</th>
                <th className="py-2 px-3 font-semibold text-gray-700">Rampe</th>
                <th className="py-2 px-3 font-semibold text-gray-700">Spediteur</th>
                <th className="py-2 px-3 font-semibold text-gray-700">Kennzeichen</th>
                <th className="py-2 px-3 font-semibold text-gray-700">Warenart</th>
                <th className="py-2 px-3 font-semibold text-gray-700">Status</th>
                <th className="py-2 px-3 font-semibold text-gray-700">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const transitions = VALID_TRANSITIONS[b.status] || []
                return (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 whitespace-nowrap">{b.date}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{b.slotStart}–{b.slotEnd}</td>
                    <td className="py-2 px-3">{b.dock?.name || `#${b.dockId}`}</td>
                    <td className="py-2 px-3 font-medium">{b.speditionName}</td>
                    <td className="py-2 px-3">{b.kennzeichen}</td>
                    <td className="py-2 px-3">{b.warenart}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[b.status] || ''}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2 flex-wrap">
                        {transitions.map((t) => (
                          <button
                            key={t}
                            onClick={() => changeStatus(b.id, t)}
                            disabled={changingId === b.id}
                            className="text-xs text-blue-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {TRANSITION_LABELS[t] || t}
                          </button>
                        ))}
                        <button
                          onClick={() => deleteBooking(b.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
