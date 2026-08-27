'use client'

import { ThemeToggle } from '@payload-config/components/ui/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-background" data-oid="nbtty1x">
      <div
        data-slot="auth-theme-toggle"
        className="pointer-events-none fixed z-50 top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] p-2"
        data-oid="z1l9dhm"
      >
        <div className="pointer-events-auto">
          <ThemeToggle className="bg-card" data-oid="c-sfidw" />
        </div>
      </div>
      {children}
    </div>
  )
}
