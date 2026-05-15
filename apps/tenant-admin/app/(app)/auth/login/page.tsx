'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@payload-config/components/ui/button'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import {
  AuthDivider,
  AuthError,
  AuthLegalFooter,
  AuthShell,
} from '@payload-config/components/akademate/auth/AuthShell'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { Lock, Mail, Eye, EyeOff, Shield, Loader2 } from 'lucide-react'

interface LoginUser {
  id: string
  email: string
  name?: string
  role?: string
}

interface LoginResponse {
  user?: LoginUser
  token?: string
  message?: string
}

export default function LoginPage() {
  const router = useRouter()
  const { branding, loading: brandingLoading } = useTenantBranding()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    remember: false,
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!credentials.email.trim()) {
      setError('Ingresa tu correo electrónico.')
      emailRef.current?.focus()
      return
    }

    if (!credentials.password.trim()) {
      setError('Ingresa tu contraseña.')
      passwordRef.current?.focus()
      return
    }

    setIsLoading(true)

    // FIX-16: Dev auth bypass removed. All environments use real Payload authentication.
    // For local dev convenience, use /dev/auto-login endpoint instead.
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Required for cookies to be set
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      })

      const data = (await response.json()) as LoginResponse

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
              role: data.user.role ?? 'admin',
            },
            token: data.token ?? '',
          }),
        })

        // Redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.message ?? 'Email o contraseña incorrectos')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Error de conexión. Por favor intenta de nuevo.')
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      academyName={branding.academyName}
      logoUrl={branding.logos.principal || branding.logos.favicon}
      loading={brandingLoading}
      title="Iniciar sesión"
      description="Ingresa tus credenciales para acceder al sistema"
      footer={<AuthLegalFooter academyName={branding.academyName} />}
    >
            <form onSubmit={handleLogin} className="flex flex-col gap-4" data-oid="-gbykj4">
              <AuthError message={error} />

              <div className="flex flex-col gap-2" data-oid="m2g:gwu">
                <Label htmlFor="email" data-oid="170hxjt">
                  Correo Electrónico
                </Label>
                <div className="relative" data-oid="t0a2owq">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    data-oid="lh:tteo"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={`usuario@${branding.academyName.toLowerCase().replace(/\s+/g, '')}.com`}
                    value={credentials.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    ref={emailRef}
                    className="pl-10"
                    required
                    data-oid="d-eaws2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2" data-oid="0b:e2ud">
                <div className="flex items-center justify-between" data-oid="-dre3if">
                  <Label htmlFor="password" data-oid="-ckjl-b">
                    Contraseña
                  </Label>
                  <a
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                    data-oid="o6q.v_7"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative" data-oid="kel3-el">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    data-oid="v:-ugmg"
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                    ref={passwordRef}
                    className="pl-10 pr-10"
                    required
                    data-oid="y_s_ukl"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-oid="i84gx:1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" data-oid="6ch1-fq" />
                    ) : (
                      <Eye className="h-5 w-5" data-oid="b81r2vg" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2" data-oid="daw.r_j">
                <Checkbox
                  id="remember"
                  checked={credentials.remember}
                  onCheckedChange={(checked) =>
                    setCredentials({ ...credentials, remember: checked === true })
                  }
                  data-oid="1:m6f5w"
                />

                <Label htmlFor="remember" className="cursor-pointer text-sm" data-oid="tpo6kn0">
                  Recordar mi sesión
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                data-oid="t8h9y5k"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" data-icon="inline-start" data-oid=".b-7yf3" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" data-icon="inline-start" data-oid="zw.slo_" />
                    Iniciar Sesión
                  </>
                )}
              </Button>

              <AuthDivider />

            {/* Google OAuth — disabled until SSO flow is fully integrated */}
            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full justify-center gap-3"
              title="Google SSO estara disponible proximamente"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" data-oid="no8qira">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                  data-oid="vfnvszg"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                  data-oid="knj1zc8"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                  data-oid="tgi1avg"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                  data-oid="eey571a"
                />
              </svg>
              Continuar con Google
              <span className="text-[10px] text-muted-foreground ml-1">(Proximamente)</span>
            </Button>

            {/* Signup link */}
            <p className="text-center text-sm text-muted-foreground" data-oid="sqpl6o:">
              ¿No tienes cuenta?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-primary hover:underline"
                data-oid="rnucokc"
              >
                Regístrate aquí
              </Link>
            </p>
            </form>
    </AuthShell>
  )
}
