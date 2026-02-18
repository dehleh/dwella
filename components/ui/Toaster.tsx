'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastQueue: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

export function toast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).substr(2, 9)
  const newToast = { id, message, type }
  toastQueue = [...toastQueue, newToast]
  listeners.forEach(listener => listener(toastQueue))

  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id)
    listeners.forEach(listener => listener(toastQueue))
  }, 5000)
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      listeners = listeners.filter(l => l !== setToasts)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            flex items-center justify-between gap-3 p-4 rounded-lg shadow-lg
            ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
            ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
            animate-slide-in
          `}
        >
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => {
              toastQueue = toastQueue.filter(t => t.id !== toast.id)
              setToasts(toastQueue)
            }}
            className="hover:opacity-80"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
