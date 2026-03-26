'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
import { Lock, Mail, Eye, EyeOff, AlertTriangle, UserPlus, Loader2, User } from 'lucide-react'

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
  const { branding } = useTenantBranding()
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
        // Persistir sesión en cookie httpOnly
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
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      data-oid="dcl29ph"
    >
      <div className="w-full max-w-md relative z-10" data-oid="39t7y9z">
        {/* Logo/Brand */}
        <div className="text-center mb-8" data-oid="qbks9br">
          <div className="inline-flex items-center justify-center mb-6" data-oid="_fr9ilb">
            <div
              className="relative rounded-full border-4 border-primary bg-white overflow-hidden flex items-center justify-center w-36 h-36"
              style={{
                boxShadow:
                  '0 20px 40px -5px hsl(var(--primary) / 0.4), 0 8px 16px -4px hsl(var(--primary) / 0.25)',
              }}
              data-oid=".x3088y"
            >
              <Image
                src={branding.logos.favicon}
                alt={branding.academyName}
                width={120}
                height={120}
                className="object-contain w-[100px] h-[100px]"
                priority
                data-oid="y-2-860"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold" data-oid="9lk-c2f">
            {branding.academyName}
          </h1>
          <p className="text-muted-foreground mt-2" data-oid="b_v.el_">
            Panel de Administración
          </p>
        </div>

        <Card className="shadow-2xl border-2" data-oid="so5w45z">
          <CardHeader className="space-y-1" data-oid="uhumm-e">
            <CardTitle className="text-2xl" data-oid="h1olyq.">
              Crear Cuenta
            </CardTitle>
            <CardDescription data-oid=".8ii3f_">
              Regístrate para acceder al panel de administración
            </CardDescription>
          </CardHeader>
          <CardContent data-oid=".6e5_ne">
            <form onSubmit={handleSubmit} className="space-y-4" data-oid="wsj_yid">
              {error && (
                <div
                  className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-2"
                  data-oid="ubiswo4"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" data-oid="gwe63nb" />
                  <p className="text-sm" data-oid="rjagwmg">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2" data-oid="nfmles7">
                <Label htmlFor="name" data-oid="0ku71oj">
                  Nombre Completo
                </Label>
                <div className="relative" data-oid="yg:_ayu">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    data-oid="kvfglok"
                  />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    ref={nameRef}
                    className="pl-10"
                    required
                    data-oid="kdf4tgy"
                  />
                </div>
              </div>

              <div className="space-y-2" data-oid="qa3e3ee">
                <Label htmlFor="email" data-oid="yswa:bx">
                  Correo Electrónico
                </Label>
                <div className="relative" data-oid="gwpj_wb">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    data-oid="bfha7by"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder={`usuario@${branding.academyName.toLowerCase().replace(/\s+/g, '')}.com`}
                    value={form.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    ref={emailRef}
                    className="pl-10"
                    required
                    data-oid="ffx2_4r"
                  />
                </div>
              </div>

              <div className="space-y-2" data-oid=".i6j5ee">
                <Label htmlFor="password" data-oid=":x8dw51">
                  Contraseña
                </Label>
                <div className="relative" data-oid="4xvfzf-">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    data-oid="-.abxtr"
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    ref={passwordRef}
                    className="pl-10 pr-10"
                    required
                    data-oid="n2oetky"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-oid="91yy.pq"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" data-oid="ziwlwkk" />
                    ) : (
                      <Eye className="h-5 w-5" data-oid=":.1e5o0" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2" data-oid="ylm051-">
                <Label htmlFor="confirm" data-oid=":z0qvfy">
                  Confirmar Contraseña
                </Label>
                <div className="relative" data-oid="m6.2gbb">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    data-oid="1v_qb87"
                  />
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    value={form.confirm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, confirm: e.target.value })
                    }
                    ref={confirmRef}
                    className="pl-10 pr-10"
                    required
                    data-oid="dzfl7:-"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-oid="0g3ok3b"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-5 w-5" data-oid="4mtde0a" />
                    ) : (
                      <Eye className="h-5 w-5" data-oid="3j_9moi" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                data-oid="6gobrtq"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" data-oid="5kgph67" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" data-oid="wwyxpm_" />
                    Crear Cuenta
                  </>
                )}
              </Button>
            </form>

            {/* Divisor */}
            <div className="relative my-5" data-oid="cr22w1d">
              <div className="absolute inset-0 flex items-center" data-oid=".zyb5co">
                <span className="w-full border-t" data-oid="37_uhhl" />
              </div>
              <div className="relative flex justify-center text-xs uppercase" data-oid="z8fjchi">
                <span className="bg-card px-2 text-muted-foreground" data-oid="q479:9:">
                  O regístrate con
                </span>
              </div>
            </div>

            {/* Google OAuth — disabled */}
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-3 rounded-md border border-input bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60"
              title="Google SSO estara disponible proximamente"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" data-oid="21hswd.">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                  data-oid="615p8ym"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                  data-oid="kf8ub8z"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                  data-oid="__78pvk"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                  data-oid="kt:y3q5"
                />
              </svg>
              Continuar con Google
              <span className="text-[10px] ml-1">(Proximamente)</span>
            </button>

            {/* Login link */}
            <p className="mt-5 text-center text-sm text-muted-foreground" data-oid="a6s5.9_">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline"
                data-oid="fwoa4nm"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground" data-oid="egr_0ey">
          <p data-oid="zazlvc8">
            © {new Date().getFullYear()} {branding.academyName}. Todos los derechos reservados.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2" data-oid="4xjk86_">
            <a
              href="/legal/privacidad"
              className="hover:text-foreground transition-colors"
              data-oid="3z4e7un"
            >
              Política de Privacidad
            </a>
            <span data-oid=":epcihn">•</span>
            <a
              href="/legal/terminos"
              className="hover:text-foreground transition-colors"
              data-oid="i-mlgrn"
            >
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
