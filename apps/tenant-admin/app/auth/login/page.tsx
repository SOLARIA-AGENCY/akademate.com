'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  GraduationCap,
  Shield,
  Loader2
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState('/logos/cep-logo-alpha.png')
  const [academyName, setAcademyName] = useState('CEP Formación')
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    remember: false,
  })

  // DEV MODE: Skip config fetch in development
  const isDev = process.env.NODE_ENV === 'development'

  // Fetch logo and academy config from API (disabled in dev)
  useEffect(() => {
    if (isDev) {
      console.log('[DEV MODE] Skipping config fetch - using defaults')
      return
    }

    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config?section=logos')
        if (response.ok) {
          const { data } = await response.json()
          setLogoUrl(data.claro || '/logos/cep-logo-alpha.png')
        }

        const academyResponse = await fetch('/api/config?section=academia')
        if (academyResponse.ok) {
          const { data } = await academyResponse.json()
          setAcademyName(data.nombre || 'CEP Formación')
        }
      } catch (error) {
        console.error('Error fetching config:', error)
      }
    }
    fetchConfig()
  }, [isDev])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // DEV MODE: Bypass authentication
    if (isDev) {
      console.log('[DEV MODE] Bypassing authentication - direct dashboard access')

      // Create mock user for development
      const mockUser = {
        id: 'dev-user-1',
        email: credentials.email || 'dev@cepcomunicacion.com',
        name: 'Developer',
        role: 'admin',
      }

      localStorage.setItem('cep_user', JSON.stringify(mockUser))

      // Small delay for UX
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 500)
      return
    }

    // PRODUCTION: Normal authentication flow
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

      const data = await response.json()

      if (data.user && data.token) {
        // Store user data in localStorage for client-side access
        localStorage.setItem('cep_user', JSON.stringify(data.user))

        // Redirect to dashboard
        router.push('/')
        router.refresh()
      } else {
        setError(data.message || 'Email o contraseña incorrectos')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Error de conexión. Por favor intenta de nuevo.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative rounded-full border-4 border-[#f2014b] p-6 bg-white shadow-xl shadow-[#f2014b]/30">
              <Image
                src={logoUrl}
                alt={academyName}
                width={280}
                height={112}
                className="h-28 w-auto"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold">{academyName}</h1>
          <p className="text-muted-foreground mt-2">Panel de Administración</p>
        </div>

        <Card className="shadow-2xl border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@cepcomunicacion.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!isDev && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <a
                      href="/auth/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {isDev && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg">
                  <p className="text-sm font-medium">🔧 Modo Desarrollo</p>
                  <p className="text-xs mt-1">Ingresa cualquier email para acceder directamente al dashboard</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={credentials.remember}
                  onChange={(e) => setCredentials({ ...credentials, remember: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="remember" className="cursor-pointer text-sm">
                  Recordar mi sesión
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 CEP FORMACIÓN Y COMUNICACIÓN S.L. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <a href="/legal/privacidad" className="hover:text-foreground transition-colors">
              Política de Privacidad
            </a>
            <span>•</span>
            <a href="/legal/terminos" className="hover:text-foreground transition-colors">
              Términos y Condiciones
            </a>
            <span>•</span>
            <a href="/legal/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
