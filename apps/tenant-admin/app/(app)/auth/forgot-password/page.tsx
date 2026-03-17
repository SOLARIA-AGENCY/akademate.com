'use client'
import { useState } from 'react'
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
import { Mail, ArrowLeft, CheckCircle, Loader2, GraduationCap } from 'lucide-react'

export default function ForgotPasswordPage() {
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
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4"
        data-oid="m_bc2bm"
      >
        <div className="w-full max-w-md relative z-10" data-oid="s14gp35">
          <div className="text-center mb-8" data-oid="mey:kt1">
            <div
              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-success text-white mb-4"
              data-oid="uub81gm"
            >
              <CheckCircle className="h-10 w-10" data-oid="rh5t_se" />
            </div>
            <h1 className="text-3xl font-bold" data-oid="oav-er.">
              ¡Correo Enviado!
            </h1>
          </div>

          <Card className="shadow-2xl border-2" data-oid="dd0nm-h">
            <CardContent className="pt-6 space-y-4" data-oid="2crf-3t">
              <p className="text-center text-muted-foreground" data-oid="c-racr.">
                Hemos enviado un enlace de recuperación a:
              </p>
              <p className="text-center font-medium text-lg" data-oid="ulje-nb">
                {email}
              </p>
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2" data-oid="9my--dr">
                <p className="font-medium" data-oid="a_5lxn8">
                  Instrucciones:
                </p>
                <ul
                  className="list-disc list-inside space-y-1 text-muted-foreground"
                  data-oid="i::5mcz"
                >
                  <li data-oid="-cnql8u">Revisa tu bandeja de entrada</li>
                  <li data-oid="r2bumld">El enlace expira en 1 hora</li>
                  <li data-oid="wwbaaai">Si no lo ves, revisa spam/correo no deseado</li>
                </ul>
              </div>
              <Button asChild className="w-full" size="lg" data-oid="bhkdizy">
                <Link href="/auth/login" data-oid="0r.l:1l">
                  <ArrowLeft className="mr-2 h-5 w-5" data-oid=".88lk12" />
                  Volver al Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4"
      data-oid="79a_r_3"
    >
      <div
        className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"
        data-oid="x6hawom"
      />

      <div className="w-full max-w-md relative z-10" data-oid="ldsp:x.">
        <div className="text-center mb-8" data-oid="et1_d80">
          <div
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground mb-4"
            data-oid="b0nzlo."
          >
            <GraduationCap className="h-10 w-10" data-oid="g8j.pn0" />
          </div>
          <h1 className="text-3xl font-bold" data-oid="mna2wo:">
            Recuperar Contraseña
          </h1>
          <p className="text-muted-foreground mt-2" data-oid="jnz8-fv">
            Te enviaremos un enlace de recuperación
          </p>
        </div>

        <Card className="shadow-2xl border-2" data-oid="m-09kdz">
          <CardHeader className="space-y-1" data-oid="ig2-1hq">
            <CardTitle className="text-2xl" data-oid="1kfunpe">
              Restablecer Contraseña
            </CardTitle>
            <CardDescription data-oid="1-eggva">
              Ingresa tu correo electrónico y te enviaremos las instrucciones
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="8rz5gw_">
            <form onSubmit={handleSubmit} className="space-y-4" data-oid="275dact">
              <div className="space-y-2" data-oid="xn_12k.">
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
                    placeholder="usuario@cepcomunicacion.com"
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
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" data-oid="ugdm4e5" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" data-oid="m4bt2pw" />
                    Enviar Enlace de Recuperación
                  </>
                )}
              </Button>

              <Button asChild variant="outline" className="w-full" size="lg" data-oid=":ibi92w">
                <Link href="/auth/login" data-oid="tvytuk_">
                  <ArrowLeft className="mr-2 h-5 w-5" data-oid="r2t1vlz" />
                  Volver al Login
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
