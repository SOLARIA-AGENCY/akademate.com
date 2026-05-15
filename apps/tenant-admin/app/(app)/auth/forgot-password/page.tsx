'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { AuthShell } from '@payload-config/components/akademate/auth/AuthShell'
import { EmptyPanel } from '@payload-config/components/akademate/dashboard'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { branding, loading: brandingLoading } = useTenantBranding()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
    }, 2000)
  }

  if (isSuccess) {
    return (
      <AuthShell
        academyName={branding.academyName}
        logoUrl={branding.logos.principal || branding.logos.favicon}
        loading={brandingLoading}
        title="Correo enviado"
        description="Hemos enviado las instrucciones de recuperación."
      >
        <EmptyPanel
          title={email}
          description="Revisa tu bandeja de entrada. El enlace expira en 1 hora. Si no lo ves, revisa spam o correo no deseado."
          className="border-solid"
          action={
            <Button asChild>
              <Link href="/auth/login">
                <ArrowLeft data-icon="inline-start" />
                Volver al login
              </Link>
            </Button>
          }
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell
      academyName={branding.academyName}
      logoUrl={branding.logos.principal || branding.logos.favicon}
      loading={brandingLoading}
      title="Recuperar Contraseña"
      description="Restablecer Contraseña"
    >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-oid="275dact">
              <div className="flex flex-col gap-2" data-oid="xn_12k.">
                <Label htmlFor="email" data-oid="bp6lu9y">
                  Correo Electrónico
                </Label>
                <div className="relative" data-oid="zay_.j9">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                    data-oid="rr.eerv"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@tuacademia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-oid="aqzc.hw"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                data-oid="t.ef1io"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" data-icon="inline-start" data-oid="ugdm4e5" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" data-icon="inline-start" data-oid="m4bt2pw" />
                    Enviar Enlace de Recuperación
                  </>
                )}
              </Button>

              <Button asChild variant="outline" className="w-full" size="lg" data-oid=":ibi92w">
                <Link href="/auth/login" data-oid="tvytuk_">
                  <ArrowLeft className="mr-2 h-5 w-5" data-icon="inline-start" data-oid="r2t1vlz" />
                  Volver al Login
                </Link>
              </Button>
            </form>
    </AuthShell>
  )
}
