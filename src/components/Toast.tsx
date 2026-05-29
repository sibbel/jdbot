'use client'
import { useEffect, useState } from 'react'

export type ToastMessage = {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

let toastId = 0
const listeners: ((toast: ToastMessage) => void)[] = []

export function showToast(message: string, type: ToastMessage['type'] = 'info') {
  const toast: ToastMessage = { id: ++toastId, message, type }
  listeners.forEach((fn) => fn(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 4000)
    }
    listeners.push(handler)
    return () => {
      const idx = listeners.indexOf(handler)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded shadow-lg text-white text-sm max-w-sm ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-700'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
