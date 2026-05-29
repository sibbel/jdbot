import type { Metadata } from 'next'
import './globals.css'
import { RoleProvider } from '@/components/RoleProvider'
import { Navbar } from '@/components/Navbar'
import { ToastContainer } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'DockSlot – Zeitfenstermanagement',
  description: 'Buchungssystem für Wareneingang und -ausgang',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-50 min-h-screen">
        <RoleProvider>
          <Navbar />
          <main className="p-6">{children}</main>
          <ToastContainer />
        </RoleProvider>
      </body>
    </html>
  )
}
