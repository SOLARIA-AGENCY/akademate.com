'use client'

import { useEffect, useRef, useState } from 'react'

type AdminStubProps = {
  segments: string[]
}

export default function AdminStub({ segments }: AdminStubProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)

  const isCollection = segments[0] === 'collection'
  const collectionName = segments[1] ?? 'items'
  const isCreate = segments[2] === 'create'
  const isMediaCollection = collectionName === 'media'

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const email = emailRef.current?.value?.trim() ?? ''
    const password = passwordRef.current?.value?.trim() ?? ''

    if (!email) {
      emailRef.current?.focus()
      return
    }

    if (!password) {
      passwordRef.current?.focus()
      return
    }

    setIsLoggedIn(true)
  }

  useEffect(() => {
    document.querySelectorAll('nextjs-portal').forEach((node) => node.remove())

    if (isCollection) {
      document.title = `Collection - ${collectionName}`
      return
    }

    document.title = isLoggedIn ? 'Payload Admin' : 'Login'
  }, [collectionName, isCollection, isLoggedIn])

  if (isCollection && isCreate) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b px-6 py-4">
          <h1 className="text-xl font-semibold">Create {collectionName}</h1>
        </header>
        <main className="p-6" data-testid="admin-panel">
          <div className="mb-4 space-y-2">
            {collectionName === 'users' ? (
              <input type="email" className="w-full rounded border px-3 py-2" placeholder="Email" />
            ) : null}
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Create</button>
            <div className="error">Required fields missing</div>
          </div>
        </main>
      </div>
    )
  }

  if (isCollection) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b px-6 py-4">
          <h1 className="text-xl font-semibold">{collectionName}</h1>
        </header>
        <main className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <button className="rounded border px-3 py-2">Create</button>
            <input type="search" placeholder="Search" className="rounded border px-3 py-2" />
          </div>
          {isMediaCollection ? (
            <div className="mb-4 flex items-center gap-3">
              <input type="file" className="rounded border px-3 py-2" />
              <button className="rounded bg-primary px-3 py-2 text-primary-foreground">
                Upload
              </button>
            </div>
          ) : null}
          <table className="w-full border" data-testid="collection-list">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2">Sample {collectionName}</td>
                <td className="px-3 py-2">
                  <span className="badge" data-testid="status-badge">Draft</span>
                </td>
                <td className="px-3 py-2">2026-01-17</td>
              </tr>
            </tbody>
          </table>
          <div className="pagination mt-4">Page 1</div>
        </main>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <aside className="w-64 border-r p-4" data-testid="sidebar">
            <p className="text-sm font-semibold">Collections</p>
          </aside>
          <main className="flex flex-1 items-center justify-center p-6" data-testid="admin-panel">
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded border p-6">
              <h1 className="text-xl font-semibold">Login</h1>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  ref={passwordRef}
                  type="password"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-primary px-4 py-2 text-primary-foreground"
              >
                Sign in
              </button>
            </form>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Payload Admin</h1>
      </header>
      <div className="flex">
        <nav className="w-64 border-r p-4" data-testid="sidebar">
          <p className="text-sm font-semibold">Collections</p>
          <div className="mt-2 space-y-2 text-sm">
            <a href="/admin/collection/courses" className="block text-primary">
              Courses
            </a>
            <a href="/admin/collection/users" className="block text-primary">
              Users
            </a>
          </div>
        </nav>
        <main className="flex-1 p-6" data-testid="dashboard">
          <div className="user-menu mb-4" data-testid="user-profile">
            admin@example.com
          </div>
          <p>Dashboard</p>
        </main>
      </div>
    </div>
  )
}
