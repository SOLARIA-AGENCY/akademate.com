'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, Lock, Shield } from 'lucide-react'
import { AuthError, AuthShell } from '@payload-config/components/akademate/auth/AuthShell'
import { EmptyPanel, InfoGrid, LoadingPanel } from '@payload-config/components/akademate/dashboard'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { useTenantBranding } from '@/app/providers/tenant-branding'

interface InvitationData {
  name: string
  email: string
  role: string
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  marketing: 'Marketing',
  asesor: 'Asesor',
  lectura: 'Lectura',
}

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { branding, loading: brandingLoading } = useTenantBranding()

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido')
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/internal/invitations/verify?token=${token}`)
        if (res.ok) {
          const data = (await res.json()) as InvitationData
          setInvitation(data)
        } else {
          const err = await res.json().catch(() => ({}))
          setError((err as Record<string, string>).error || 'Invitación no válida o expirada')
        }
      } catch {
        setError('Error al verificar invitación')
      } finally {
        setLoading(false)
      }
    }
    void verify()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/internal/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/auth/login'), 3000)
      } else {
        const err = await res.json().catch(() => ({}))
        setError((err as Record<string, string>).error || 'Error al aceptar invitación')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      academyName={branding.academyName}
      logoUrl={branding.logos.principal || branding.logos.favicon}
      loading={brandingLoading}
      title="Aceptar invitación"
      description="Establece tu contraseña para acceder al panel."
    >
      {loading ? (
        <LoadingPanel label="Verificando invitación..." />
      ) : success ? (
        <EmptyPanel
          title="Cuenta creada"
          description="Tu cuenta ha sido creada correctamente. Te redirigiremos al login."
          className="border-solid"
          action={<CheckCircle2 className="size-8 text-emerald-600" />}
        />
      ) : error && !invitation ? (
        <EmptyPanel
          title="Invitación no válida"
          description={error}
          className="border-solid"
          action={
            <Button variant="outline" onClick={() => router.push('/auth/login')}>
              Ir al login
            </Button>
          }
        />
      ) : invitation ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InfoGrid
            items={[
              { label: 'Nombre', value: invitation.name },
              { label: 'Email', value: invitation.email },
              { label: 'Rol', value: roleLabels[invitation.role] || invitation.role },
            ]}
          />
          <AuthError message={error} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Usa al menos 8 caracteres. Recomendado: mayúsculas, minúsculas, números y símbolos.
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" data-icon="inline-start" />
                Creando cuenta...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" data-icon="inline-start" />
                Crear cuenta y acceder
              </>
            )}
          </Button>
        </form>
      ) : null}
    </AuthShell>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
