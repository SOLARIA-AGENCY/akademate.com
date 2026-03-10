'use client'

/**
 * Campus Login Page
 *
 * Student authentication for the Campus Virtual.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '../providers/SessionProvider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Alert, AlertDescription } from '@payload-config/components/ui/alert'
import { GraduationCap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

export default function CampusLoginPage() {
  const router = useRouter()
  const { login, isLoading: _isLoading, error: sessionError } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const success = await login(email, password)

      if (success) {
        router.push('/campus')
      } else {
        setError(sessionError || 'Credenciales invalidas. Por favor, intenta de nuevo.')
      }
    } catch {
      setError('Error al iniciar sesion. Por favor, intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4"
      data-oid="vwlhnxq"
    >
      <Card className="w-full max-w-md" data-oid="ww.wvw:">
        <CardHeader className="text-center" data-oid="u:-8iyw">
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
            data-oid="__zmihz"
          >
            <GraduationCap className="h-8 w-8 text-primary" data-oid="nomh013" />
          </div>
          <CardTitle className="text-2xl" data-oid="ip3nvzo">
            Campus Virtual
          </CardTitle>
          <CardDescription data-oid=".x9c5oc">
            Inicia sesion para acceder a tus cursos
          </CardDescription>
        </CardHeader>

        <CardContent data-oid="31xkkjw">
          <form onSubmit={handleSubmit} className="space-y-4" data-oid="gr.ta81">
            {(error || sessionError) && (
              <Alert variant="destructive" data-oid="76ca73d">
                <AlertCircle className="h-4 w-4" data-oid="pkq.yt1" />
                <AlertDescription data-oid="iso91m:">{error || sessionError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2" data-oid="14toyzk">
              <Label htmlFor="email" data-oid="j8v3pb:">
                Correo Electronico
              </Label>
              <div className="relative" data-oid="nbv.zf4">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  data-oid="fzf.7.q"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                  data-oid="ox6wmx."
                />
              </div>
            </div>

            <div className="space-y-2" data-oid="u83c.7n">
              <div className="flex items-center justify-between" data-oid="50e2b0p">
                <Label htmlFor="password" data-oid="cygyj0x">
                  Contrasena
                </Label>
                <Link
                  href="/campus/recuperar"
                  className="text-xs text-primary hover:underline"
                  data-oid="3t6-2h8"
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>
              <div className="relative" data-oid="corro:w">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  data-oid="pjiyl9w"
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="Tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                  data-oid="1tmxnd2"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting} data-oid="9b0_p3w">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="fzybrnd" />
                  Iniciando...
                </>
              ) : (
                'Iniciar Sesion'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground" data-oid="nbwlvsj">
            <p data-oid="jr5np86">
              No tienes cuenta?{' '}
              <Link
                href="/campus/registro"
                className="text-primary hover:underline"
                data-oid="7og60ia"
              >
                Contacta con tu institucion
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
