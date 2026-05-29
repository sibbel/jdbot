'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Role } from '@/lib/types'

const RoleContext = createContext<{ role: Role; setRole: (r: Role) => void }>({
  role: 'CARRIER',
  setRole: () => {},
})

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>('CARRIER')

  useEffect(() => {
    const stored = localStorage.getItem('dockslot_role') as Role | null
    if (stored) setRoleState(stored)
  }, [])

  const setRole = (r: Role) => {
    setRoleState(r)
    localStorage.setItem('dockslot_role', r)
  }

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export function useRole() {
  return useContext(RoleContext)
}
