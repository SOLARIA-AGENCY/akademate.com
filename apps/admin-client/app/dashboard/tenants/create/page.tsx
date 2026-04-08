'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TenantCreatePage() {
  const router = useRouter()
  const [domain, setDomain] = useState('')
  const [name, setName] = useState('')
  const [plan, setPlan] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const domainPattern = /^[a-z0-9-]+$/
  const domainError =
    domain.length > 0 && !domainPattern.test(domain)
      ? 'domain: formato inválido'
      : null

  const planLimits = {
    starter: { limitsMaxUsers: 5, limitsMaxCourses: 20, limitsMaxLeadsPerMonth: 2000, limitsStorageQuotaMB: 10240 },
    professional: { limitsMaxUsers: 20, limitsMaxCourses: 100, limitsMaxLeadsPerMonth: 7500, limitsStorageQuotaMB: 51200 },
    enterprise: { limitsMaxUsers: 100, limitsMaxCourses: 500, limitsMaxLeadsPerMonth: 50000, limitsStorageQuotaMB: 204800 },
  } as const

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: string[] = []
    if (!domain) nextErrors.push('Dominio requerido')
    if (!name) nextErrors.push('Nombre requerido')
    if (!plan) nextErrors.push('Plan requerido')
    if (domain && !domainPattern.test(domain)) nextErrors.push('domain: formato inválido')

    setErrors(nextErrors)
    if (nextErrors.length > 0) return

    setSaving(true)
    try {
      const response = await fetch('/api/ops/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          slug: domain,
          domain: `${domain}.akademate.com`,
          ...planLimits[plan as keyof typeof planLimits],
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'No se pudo crear el tenant')
      }

      const payload = await response.json()
      router.push(`/dashboard/tenants/${payload.doc.id}`)
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'No se pudo crear el tenant'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Create Tenant</h1>
      <p className="text-sm text-muted-foreground mt-1">Define los datos basicos del tenant.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {errors.length > 0 && (
          <div className="error-message rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.join(', ')}
          </div>
        )}
        {domainError && (
          <div className="error rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {domainError}
          </div>
        )}

        <div>
          <label htmlFor="domain" className="block text-sm font-medium">
            Dominio
          </label>
          <input
            id="domain"
            name="domain"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="academia-ejemplo"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Academia Ejemplo"
          />
        </div>

        <div>
          <label htmlFor="plan" className="block text-sm font-medium">
            Plan
          </label>
          <select
            id="plan"
            name="plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Selecciona un plan</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          className="ml-2 rounded-md border px-4 py-2 text-sm font-medium"
          onClick={() => { router.push('/dashboard/tenants') }}
        >
          Cancelar
        </button>
      </form>
    </div>
  )
}
