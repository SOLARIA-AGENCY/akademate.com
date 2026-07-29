import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getRuntimePlatformUrls } from '@/lib/platform-access'
export const metadata: Metadata = {
  title: 'Acceso',
  description: 'Acceso seguro a Akademate para usuarios autorizados.',
  robots: { index: false, follow: false },
}
export default function AccessPage() {
  const tenant = getRuntimePlatformUrls().tenant
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center">
        <section className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold">Acceso a Akademate</h1>
          <p className="mt-4 text-muted-foreground">
            El acceso requiere una cuenta emitida por tu organización. Esta web no ofrece
            credenciales de demostración ni bypass de autenticación.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={tenant}
              className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Ir a la plataforma
            </a>
            <Link href="/contacto" className="rounded-md border px-5 py-3 text-sm font-semibold">
              Necesito ayuda
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
