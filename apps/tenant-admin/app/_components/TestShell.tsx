'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface TestShellProps {
  title?: string
  children: React.ReactNode
}

export function TestShell({ title, children }: TestShellProps) {
  useEffect(() => {
    document.querySelectorAll('nextjs-portal').forEach((node) => node.remove())
  }, [])

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r bg-card p-4" data-testid="sidebar">
        <div className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Admin
        </div>
        <div className="space-y-2">
          <Link href="/dashboard" className="block rounded px-2 py-1 hover:bg-muted">
            Dashboard
          </Link>
          <Link href="/users" className="block rounded px-2 py-1 hover:bg-muted">
            Users
          </Link>
          <Link href="/courses" className="block rounded px-2 py-1 hover:bg-muted">
            Courses
          </Link>
        </div>
      </aside>
      <main className="flex-1 space-y-6 p-6">
        {title ? <h1 className="text-2xl font-semibold">{title}</h1> : null}
        {children}
      </main>
    </div>
  )
}
