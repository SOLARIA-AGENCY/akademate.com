import type React from 'react'

/*
 * Minimal root layout — route groups (app) and (payload) define their own
 * <html>/<body> wrappers to avoid nested HTML documents.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
