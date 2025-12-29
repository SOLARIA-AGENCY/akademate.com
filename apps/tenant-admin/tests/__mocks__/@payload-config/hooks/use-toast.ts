import { vi } from 'vitest'

export const useToast = vi.fn(() => ({
  toast: vi.fn(),
  dismiss: vi.fn(),
  toasts: [],
}))
