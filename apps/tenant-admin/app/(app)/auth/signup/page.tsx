'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, Mail, User, UserPlus } from 'lucide-react'
import {
  AuthDivider,
  AuthError,
  AuthLegalFooter,
  AuthShell,
} from '@payload-config/components/akademate/auth/AuthShell'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { useTenantBranding } from '@/app/providers/tenant-branding'

interface RegisterResponse {
  user?: {
    id: string
    email: string
    name?: string
    role?: string
  }
  token?: string
  error?: string
}

export default function SignupPage() {
  const router = useRouter()
  const { branding, loading: brandingLoading } = useTenantBranding()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const confirmRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Ingresa tu nombre completo.')
      nameRef.current?.focus()
      return
    }
    if (!form.email.trim()) {
      setError('Ingresa tu correo electrónico.')
      emailRef.current?.focus()
      return
    }
    if (!form.password.trim()) {
      setError('Ingresa una contraseña.')
      passwordRef.current?.focus()
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      confirmRef.current?.focus()
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })

      const data = (await response.json()) as RegisterResponse

      if (data.user) {
        await fetch('/api/auth/session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name ?? '',
              role: data.user.role ?? 'lectura',
            },
            token: data.token ?? '',
          }),
        })

        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error ?? 'Error al crear la cuenta.')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Register error:', err)
      setError('Error de conexión. Por favor intenta de nuevo.')
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      academyName={branding.academyName}
      logoUrl={branding.logos.principal || branding.logos.favicon}
      loading={brandingLoading}
      title="Crear cuenta"
      description="Regístrate para acceder al panel de administración."
      footer={<AuthLegalFooter academyName={branding.academyName} />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthError message={error} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              ref={nameRef}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder={`usuario@${branding.academyName.toLowerCase().replace(/\s+/g, '')}.com`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              ref={emailRef}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              ref={passwordRef}
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              ref={confirmRef}
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" data-icon="inline-start" />
              Creando cuenta...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" data-icon="inline-start" />
              Crear cuenta
            </>
          )}
        </Button>

        <AuthDivider label="O regístrate con" />

        <Button type="button" variant="outline" disabled className="w-full justify-center gap-3">
          <span className="font-semibold text-muted-foreground">Google</span>
          <span className="text-[10px] text-muted-foreground">(Próximamente)</span>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
