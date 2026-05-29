'use client'
import { useState } from 'react'
import { GridCellData } from '@/lib/types'
import { showToast } from '@/components/Toast'

interface BookingFormProps {
  cell: GridCellData
  dockName: string
  onSuccess: () => void
  onCancel: () => void
}

export function BookingForm({ cell, dockName, onSuccess, onCancel }: BookingFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)

    const payload = {
      dockId: cell.dockId,
      date: cell.date,
      slotStart: cell.slotStart,
      slotEnd: cell.slotEnd,
      speditionName: fd.get('speditionName') as string,
      kennzeichen: fd.get('kennzeichen') as string,
      referenz: fd.get('referenz') as string || undefined,
      kontaktName: fd.get('kontaktName') as string,
      kontaktTelefon: fd.get('kontaktTelefon') as string,
      warenart: fd.get('warenart') as string,
      anzahlPaletten: parseInt(fd.get('anzahlPaletten') as string),
      bemerkung: fd.get('bemerkung') as string || undefined,
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Fehler beim Speichern.')
        setLoading(false)
        return
      }
      showToast('Buchung erfolgreich erstellt!', 'success')
      onSuccess()
    } catch {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Spedition / Firmenname *
          </label>
          <input
            name="speditionName"
            type="text"
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. DHL Express GmbH"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kennzeichen *
          </label>
          <input
            name="kennzeichen"
            type="text"
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. B-DH-1234"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referenz / Lieferschein-Nr.
          </label>
          <input
            name="referenz"
            type="text"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kontaktperson *
          </label>
          <input
            name="kontaktName"
            type="text"
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon *
          </label>
          <input
            name="kontaktTelefon"
            type="tel"
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warenart *
          </label>
          <input
            name="warenart"
            type="text"
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Paletten, Pakete"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anzahl Paletten *
          </label>
          <input
            name="anzahlPaletten"
            type="number"
            min="1"
            required
            defaultValue="1"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bemerkung
        </label>
        <textarea
          name="bemerkung"
          rows={2}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="optional"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Wird gespeichert...' : 'Buchung bestätigen'}
        </button>
      </div>

      <p className="text-xs text-gray-400">* Pflichtfelder | Rampe: {dockName} | {cell.slotStart}–{cell.slotEnd} Uhr</p>
    </form>
  )
}
