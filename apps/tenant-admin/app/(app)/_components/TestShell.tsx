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
    <div className="min-h-screen flex bg-background text-foreground" data-oid="bcxqw34">
      <aside className="w-64 border-r bg-card p-4" data-testid="sidebar" data-oid="ii4eiuv">
        <div
          className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          data-oid="j13azjc"
        >
          Admin
        </div>
        <div className="space-y-2" data-oid="_o06ha9">
          <Link
            href="/dashboard"
            className="block rounded px-2 py-1 hover:bg-muted"
            data-oid="j:g4y-a"
          >
            Dashboard
          </Link>
          <Link href="/users" className="block rounded px-2 py-1 hover:bg-muted" data-oid="5-nkmjy">
            Users
          </Link>
          <Link
            href="/courses"
            className="block rounded px-2 py-1 hover:bg-muted"
            data-oid="kkpucg5"
          >
            Courses
          </Link>
        </div>
      </aside>
      <main className="flex-1 space-y-6 p-6" data-oid="ch5pbow">
        {title ? (
          <h1 className="text-2xl font-semibold" data-oid="m_y2zdi">
            {title}
          </h1>
        ) : null}
        {children}
      </main>
    </div>
  )
}
