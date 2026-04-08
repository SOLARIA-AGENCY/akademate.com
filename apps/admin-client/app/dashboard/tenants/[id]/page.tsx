'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/use-ops-data'

interface TenantFormState {
  name: string
  slug: string
  domain: string
  contactEmail: string
  contactPhone: string
  notes: string
  active: boolean
  limitsMaxUsers: number
  limitsMaxCourses: number
  limitsMaxLeadsPerMonth: number
  limitsStorageQuotaMB: number
}

function emptyForm(): TenantFormState {
  return {
    name: '',
    slug: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    active: true,
    limitsMaxUsers: 50,
    limitsMaxCourses: 100,
    limitsMaxLeadsPerMonth: 5000,
    limitsStorageQuotaMB: 10240,
  }
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [tenantId, setTenantId] = useState('')
  const [form, setForm] = useState<TenantFormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { data, isLoading } = useTenant(tenantId)

  useEffect(() => {
    params.then(({ id }) => setTenantId(id)).catch(() => setError('No se pudo resolver el tenant'))
  }, [params])

  useEffect(() => {
    if (!data) return
    setForm({
      name: data.name,
      slug: data.slug,
      domain: data.domain ?? '',
      contactEmail: data.contactEmail ?? '',
      contactPhone: data.contactPhone ?? '',
      notes: data.notes ?? '',
      active: data.active,
      limitsMaxUsers: data.limits?.maxUsers ?? 50,
      limitsMaxCourses: data.limits?.maxCourses ?? 100,
      limitsMaxLeadsPerMonth: data.limits?.maxLeadsPerMonth ?? 5000,
      limitsStorageQuotaMB: data.limits?.storageQuotaMB ?? 10240,
    })
  }, [data])

  const updateField = <K extends keyof TenantFormState>(key: K, value: TenantFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/ops/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'No se pudo actualizar el tenant')
      }

      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo actualizar el tenant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Tenant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona dominio, límites, contacto e estado del tenant.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">Cargando tenant...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Nombre</span>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="w-full rounded-md border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Slug</span>
              <input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className="w-full rounded-md border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Dominio</span>
              <input value={form.domain} onChange={(e) => updateField('domain', e.target.value)} className="w-full rounded-md border px-3 py-2" placeholder="cliente.akademate.com" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Email de contacto</span>
              <input value={form.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} className="w-full rounded-md border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Teléfono</span>
              <input value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} className="w-full rounded-md border px-3 py-2" />
            </label>
            <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => updateField('active', e.target.checked)} />
              <span>Tenant activo</span>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Notas operativas</span>
            <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={4} className="w-full rounded-md border px-3 py-2" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Usuarios máximos</span>
              <input type="number" value={form.limitsMaxUsers} onChange={(e) => updateField('limitsMaxUsers', Number(e.target.value))} className="w-full rounded-md border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Cursos máximos</span>
              <input type="number" value={form.limitsMaxCourses} onChange={(e) => updateField('limitsMaxCourses', Number(e.target.value))} className="w-full rounded-md border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Leads por mes</span>
              <input type="number" value={form.limitsMaxLeadsPerMonth} onChange={(e) => updateField('limitsMaxLeadsPerMonth', Number(e.target.value))} className="w-full rounded-md border px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Cuota de almacenamiento (MB)</span>
              <input type="number" value={form.limitsStorageQuotaMB} onChange={(e) => updateField('limitsStorageQuotaMB', Number(e.target.value))} className="w-full rounded-md border px-3 py-2" />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" className="rounded-md border px-4 py-2 text-sm font-medium" onClick={() => router.push('/dashboard/tenants')}>
              Volver
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
