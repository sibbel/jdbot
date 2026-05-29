'use client'
import { useState } from 'react'
import { SlotConfigData } from '@/lib/types'
import { showToast } from '@/components/Toast'

const WEEKDAYS = [
  { value: 1, label: 'Mo' },
  { value: 2, label: 'Di' },
  { value: 3, label: 'Mi' },
  { value: 4, label: 'Do' },
  { value: 5, label: 'Fr' },
  { value: 6, label: 'Sa' },
  { value: 0, label: 'So' },
]

interface SlotConfigFormProps {
  initialConfig: SlotConfigData
}

export function SlotConfigForm({ initialConfig }: SlotConfigFormProps) {
  const [config, setConfig] = useState(initialConfig)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setConfig(data)
    showToast('Konfiguration gespeichert.', 'success')
  }

  function toggleWorkday(day: number) {
    setConfig((prev) => ({
      ...prev,
      workdays: prev.workdays.includes(day)
        ? prev.workdays.filter((d) => d !== day)
        : [...prev.workdays, day].sort(),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Öffnungszeit</label>
          <input
            type="time"
            value={config.openingTime}
            onChange={(e) => setConfig((c) => ({ ...c, openingTime: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Schließzeit</label>
          <input
            type="time"
            value={config.closingTime}
            onChange={(e) => setConfig((c) => ({ ...c, closingTime: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slot-Dauer (Minuten)</label>
          <select
            value={config.slotDuration}
            onChange={(e) => setConfig((c) => ({ ...c, slotDuration: parseInt(e.target.value) }))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {[15, 30, 45, 60].map((v) => <option key={v} value={v}>{v} min</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pufferzeit (Minuten)</label>
          <select
            value={config.bufferMinutes}
            onChange={(e) => setConfig((c) => ({ ...c, bufferMinutes: parseInt(e.target.value) }))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {[0, 5, 10, 15, 30].map((v) => <option key={v} value={v}>{v} min</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Arbeitstage</label>
        <div className="flex gap-2">
          {WEEKDAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleWorkday(day.value)}
              className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                config.workdays.includes(day.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Wird gespeichert...' : 'Konfiguration speichern'}
      </button>
    </form>
  )
}
