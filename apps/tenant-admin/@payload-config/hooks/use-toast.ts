import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export interface UseToastReturn {
  toast: (options: ToastOptions) => { id: string; dismiss: () => void }
  toasts: Toast[]
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = {
      id,
      ...options,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)

    // Simple console log for now (can be replaced with actual toast UI)
    console.log(`[Toast] ${options.variant === 'destructive' ? 'ERROR' : 'INFO'}: ${options.title}${options.description ? ` - ${options.description}` : ''}`)

    return { id, dismiss: () => setToasts((prev) => prev.filter((t) => t.id !== id)) }
  }, [])

  return { toast, toasts }
}
