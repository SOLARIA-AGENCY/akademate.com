import { toast as sonnerToast } from 'sonner'

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
  const toast = (options: ToastOptions) => {
    const id =
      options.variant === 'destructive'
        ? sonnerToast.error(options.title, { description: options.description })
        : sonnerToast(options.title, { description: options.description })

    return {
      id: String(id),
      dismiss: () => sonnerToast.dismiss(id),
    }
  }

  return { toast, toasts: [] }
}
