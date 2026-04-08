'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { Lock, Loader2, CheckCircle2, AlertTriangle, Shield } from 'lucide-react'

interface InvitationData {
  name: string
  email: string
  role: string
}

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { branding } = useTenantBranding()

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Token de invitacion no valido')
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/internal/invitations/verify?token=${token}`)
        if (res.ok) {
          const data = await res.json()
          setInvitation(data)
        } else {
          const err = await res.json().catch(() => ({}))
          setError((err as Record<string, string>).error || 'Invitacion no valida o expirada')
        }
      } catch {
        setError('Error al verificar invitacion')
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
      setError('La contrasena debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden')
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
        setError((err as Record<string, string>).error || 'Error al aceptar invitacion')
      }
    } catch {
      setError('Error de conexion')
    } finally {
      setSubmitting(false)
    }
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrador', gestor: 'Gestor', marketing: 'Marketing',
    asesor: 'Asesor', lectura: 'Lectura',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="w-20 h-20 rounded-full bg-white shadow-lg border border-border flex items-center justify-center overflow-hidden">
              <img src={branding.logos.principal || '/logos/akademate-logo-official.png'} alt={branding.academyName} className="w-14 h-14 object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">{branding.academyName}</span>
          </div>
        </div>

        {loading ? (
          <Card className="shadow-2xl">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Verificando invitacion...</p>
            </CardContent>
          </Card>
        ) : success ? (
          <Card className="shadow-2xl border-green-200">
            <CardContent className="p-12 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Cuenta creada</h2>
              <p className="text-sm text-muted-foreground">
                Tu cuenta ha sido creada exitosamente. Redirigiendo al login...
              </p>
            </CardContent>
          </Card>
        ) : error && !invitation ? (
          <Card className="shadow-2xl border-destructive/20">
            <CardContent className="p-12 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">Invitacion no valida</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => router.push('/auth/login')}>
                Ir al login
              </Button>
            </CardContent>
          </Card>
        ) : invitation ? (
          <Card className="shadow-2xl border-2">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Aceptar Invitacion</CardTitle>
              <CardDescription>
                Establece tu contrasena para acceder al panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Invitation info */}
              <div className="bg-muted rounded-lg p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre</span>
                  <span className="font-medium">{invitation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{invitation.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rol</span>
                  <span className="font-medium">{roleLabels[invitation.role] || invitation.role}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar contrasena</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="Repite la contrasena"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Mayuscula, minuscula, numero y caracter especial</p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creando cuenta...</>
                  ) : (
                    <><Shield className="mr-2 h-5 w-5" />Crear cuenta y acceder</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <AcceptInviteContent />
    </Suspense>
  )
}
