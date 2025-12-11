'use client'

import { ThemeToggle } from '@payload-config/components/ui/ThemeToggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen bg-background">
          {/* Theme Toggle - Top Right Corner */}
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </body>
    </html>
  )
}
