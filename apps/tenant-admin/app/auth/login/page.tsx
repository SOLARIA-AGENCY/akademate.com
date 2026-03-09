'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { Lock, Mail, Eye, EyeOff, AlertTriangle, Shield, Loader2 } from 'lucide-react'

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
  const { branding } = useTenantBranding()
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
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      data-oid="qp-da09"
    >
      <div className="w-full max-w-md relative z-10" data-oid="2gm3fiy">
        {/* Logo/Brand */}
        <div className="text-center mb-8" data-oid="1vf7s_f">
          <div className="flex flex-col items-center gap-2 mb-2" data-oid="ou4cocr">
            <img
              src="/logos/akademate-icon-180.png"
              alt="Akademate"
              className="w-16 h-16 object-contain"
            />
            <span className="text-2xl font-bold tracking-tight text-foreground">
              AKADEMATE
            </span>
          </div>
          <p className="text-muted-foreground text-sm" data-oid="_0xxfde">
            Panel de Administración
          </p>
        </div>

        <Card className="shadow-2xl border-2" data-oid="eohhita">
          <CardHeader className="space-y-1 text-center" data-oid="4t.knld">
            <CardTitle className="text-2xl" data-oid="0kha606">
              Iniciar Sesión
            </CardTitle>
            <CardDescription data-oid="ij6r3f-">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="d1v.eyn">
            <form onSubmit={handleLogin} className="space-y-4" data-oid="-gbykj4">
              {error && (
                <div
                  className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-2"
                  data-oid="j6r8fxg"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" data-oid="gjhfun4" />
                  <p className="text-sm" data-oid="eq8iluh">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2" data-oid="m2g:gwu">
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

              <div className="space-y-2" data-oid="0b:e2ud">
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

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-oid="i84gx:1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" data-oid="6ch1-fq" />
                    ) : (
                      <Eye className="h-5 w-5" data-oid="b81r2vg" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2" data-oid="daw.r_j">
                <input
                  type="checkbox"
                  id="remember"
                  checked={credentials.remember}
                  onChange={(e) => setCredentials({ ...credentials, remember: e.target.checked })}
                  className="rounded"
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
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" data-oid=".b-7yf3" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" data-oid="zw.slo_" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            {/* Divisor */}
            <div className="relative my-5" data-oid="6eh1a7t">
              <div className="absolute inset-0 flex items-center" data-oid="t.t-uds">
                <span className="w-full border-t" data-oid="z-.kw69" />
              </div>
              <div className="relative flex justify-center text-xs uppercase" data-oid="f8klqxs">
                <span className="bg-card px-2 text-muted-foreground" data-oid="vioid0d">
                  O continúa con
                </span>
              </div>
            </div>

            {/* Google OAuth */}
            <a
              href={`${process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3006'}/api/auth/signin/google?callbackURL=${encodeURIComponent((process.env.NEXT_PUBLIC_TENANT_URL ?? 'http://localhost:3009') + '/dashboard')}`}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              data-oid="30v5rwa"
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
            </a>

            {/* Signup link */}
            <p className="mt-5 text-center text-sm text-muted-foreground" data-oid="sqpl6o:">
              ¿No tienes cuenta?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-primary hover:underline"
                data-oid="rnucokc"
              >
                Regístrate aquí
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground" data-oid="scsub3k">
          <p data-oid="4f2bl55">
            © {new Date().getFullYear()} {branding.academyName}. Todos los derechos reservados.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2" data-oid="f3ayrgb">
            <a
              href="/legal/privacidad"
              className="hover:text-foreground transition-colors"
              data-oid="8xdptus"
            >
              Política de Privacidad
            </a>
            <span data-oid="9c4tw03">•</span>
            <a
              href="/legal/terminos"
              className="hover:text-foreground transition-colors"
              data-oid=":9i5:6l"
            >
              Términos y Condiciones
            </a>
            <span data-oid="7b.1qfl">•</span>
            <a
              href="/legal/cookies"
              className="hover:text-foreground transition-colors"
              data-oid="vk:_fed"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
