'use client'
import { useState } from 'react'
import { DockData } from '@/lib/types'
import { showToast } from '@/components/Toast'

interface DockManagerProps {
  initialDocks: DockData[]
}

export function DockManager({ initialDocks }: DockManagerProps) {
  const [docks, setDocks] = useState(initialDocks)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addDock(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/docks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setDocks((prev) => [...prev, data])
    setNewName('')
    showToast('Rampe hinzugefügt.', 'success')
  }

  async function toggleActive(dock: DockData) {
    const res = await fetch(`/api/docks/${dock.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: dock.name, isActive: !dock.isActive }),
    })
    if (res.ok) {
      const updated = await res.json()
      setDocks((prev) => prev.map((d) => (d.id === dock.id ? updated : d)))
      showToast(`Rampe ${updated.isActive ? 'aktiviert' : 'deaktiviert'}.`, 'info')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addDock} className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name der neuen Rampe"
          required
          className="border rounded px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          + Rampe hinzufügen
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4 font-semibold text-gray-700">Name</th>
            <th className="py-2 pr-4 font-semibold text-gray-700">Status</th>
            <th className="py-2 font-semibold text-gray-700">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {docks.length === 0 && (
            <tr><td colSpan={3} className="py-4 text-gray-500">Keine Rampen vorhanden.</td></tr>
          )}
          {docks.map((dock) => (
            <tr key={dock.id} className="border-b hover:bg-gray-50">
              <td className="py-2 pr-4">{dock.name}</td>
              <td className="py-2 pr-4">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${dock.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {dock.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td className="py-2">
                <button
                  onClick={() => toggleActive(dock)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {dock.isActive ? 'Deaktivieren' : 'Aktivieren'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
