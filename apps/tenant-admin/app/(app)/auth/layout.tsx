'use client'

import { ThemeToggle } from '@payload-config/components/ui/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background" data-oid="nbtty1x">
      {/* Theme Toggle - Top Right Corner */}
      <div className="fixed top-4 right-4 z-50" data-oid="z1l9dhm">
        <ThemeToggle data-oid="c-sfidw" />
      </div>
      {children}
    </div>
  )
}
