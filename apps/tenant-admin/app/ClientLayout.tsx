'use client'

import { ThemeProvider } from '@payload-config/components/providers/ThemeProvider'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
