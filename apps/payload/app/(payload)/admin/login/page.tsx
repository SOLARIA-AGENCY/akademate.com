'use client'

import { FormEvent, useState } from 'react'

export default function PayloadCustomLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof payload?.errors?.[0]?.message === 'string'
          ? payload.errors[0].message
          : 'Invalid credentials. Please try again.'
        setError(message)
        return
      }

      window.location.assign('/admin')
    } catch {
      setError('Unable to connect to authentication service.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="ak-login-page">
      <div className="ak-login-glow ak-login-glow-a" />
      <div className="ak-login-glow ak-login-glow-b" />

      <section className="ak-login-card" data-testid="payload-login-card">
        <div className="ak-login-brand">
          <div className="ak-login-logo">A</div>
          <h1>Akademate CMS</h1>
          <p>Sign in to your tenant dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="ak-login-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value) }}
            autoComplete="email"
            placeholder="admin@cepformacion.es"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value) }}
            autoComplete="current-password"
            placeholder="••••••••"
          />

          {error ? <p className="ak-login-error">{error}</p> : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
