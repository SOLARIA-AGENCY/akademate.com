'use client';

/**
 * Campus Login Page
 *
 * Student authentication for the Campus Virtual.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '../providers/SessionProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card';
import { Button } from '@payload-config/components/ui/button';
import { Input } from '@payload-config/components/ui/input';
import { Label } from '@payload-config/components/ui/label';
import { Alert, AlertDescription } from '@payload-config/components/ui/alert';
import { GraduationCap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function CampusLoginPage() {
  const router = useRouter();
  const { login, isLoading: _isLoading, error: sessionError } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const success = await login(email, password);

      if (success) {
        router.push('/campus');
      } else {
        setError(sessionError || 'Credenciales invalidas. Por favor, intenta de nuevo.');
      }
    } catch {
      setError('Error al iniciar sesion. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Campus Virtual</CardTitle>
          <CardDescription>
            Inicia sesion para acceder a tus cursos
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || sessionError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || sessionError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electronico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contrasena</Label>
                <Link
                  href="/campus/recuperar"
                  className="text-xs text-primary hover:underline"
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                'Iniciar Sesion'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              No tienes cuenta?{' '}
              <Link href="/campus/registro" className="text-primary hover:underline">
                Contacta con tu institucion
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
