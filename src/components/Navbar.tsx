'use client'
import Link from 'next/link'
import { useRole } from './RoleProvider'

export function Navbar() {
  const { role, setRole } = useRole()
  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-blue-400">DockSlot</Link>
        <Link href="/grid" className="text-sm hover:text-blue-300">Zeitplan</Link>
        {role === 'ADMIN' && (
          <>
            <Link href="/admin/docks" className="text-sm hover:text-blue-300">Rampen</Link>
            <Link href="/admin/config" className="text-sm hover:text-blue-300">Konfiguration</Link>
            <Link href="/admin/bookings" className="text-sm hover:text-blue-300">Buchungen</Link>
          </>
        )}
      </div>
      <button
        onClick={() => setRole(role === 'ADMIN' ? 'CARRIER' : 'ADMIN')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          role === 'ADMIN'
            ? 'bg-orange-600 hover:bg-orange-700'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {role === 'ADMIN' ? '🔧 Admin-Modus' : '🚛 Spediteur-Modus'}
      </button>
    </nav>
  )
}
