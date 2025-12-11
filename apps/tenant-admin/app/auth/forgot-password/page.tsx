'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@payload-config/components/ui/card'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-success text-white mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold">¡Correo Enviado!</h1>
          </div>

          <Card className="shadow-2xl border-2">
            <CardContent className="pt-6 space-y-4">
              <p className="text-center text-muted-foreground">
                Hemos enviado un enlace de recuperación a:
              </p>
              <p className="text-center font-medium text-lg">{email}</p>
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-medium">Instrucciones:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Revisa tu bandeja de entrada</li>
                  <li>El enlace expira en 1 hora</li>
                  <li>Si no lo ves, revisa spam/correo no deseado</li>
                </ul>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-5 w-5" />
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">Recuperar Contraseña</h1>
          <p className="text-muted-foreground mt-2">Te enviaremos un enlace de recuperación</p>
        </div>

        <Card className="shadow-2xl border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico y te enviaremos las instrucciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@cepcomunicacion.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
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
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" />
                    Enviar Enlace de Recuperación
                  </>
                )}
              </Button>

              <Button 
                asChild
                variant="outline" 
                className="w-full" 
                size="lg"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-5 w-5" />
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
