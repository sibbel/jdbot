'use client'
import { useRole } from '@/components/RoleProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = useRole()
  if (role !== 'ADMIN') {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">Kein Zugriff</h1>
        <p className="text-gray-600 mt-2">Dieser Bereich ist nur für Administratoren zugänglich.</p>
        <p className="text-sm text-gray-500 mt-1">Wechseln Sie oben rechts in den Admin-Modus.</p>
      </div>
    )
  }
  return <>{children}</>
}
