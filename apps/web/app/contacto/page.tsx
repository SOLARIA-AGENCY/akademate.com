import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { ContactForm } from '@/components/forms/contact-form'
import { Suspense } from 'react'
import { getPublicLegalIdentity } from '@/lib/public-site'
import { PendingValue } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Consulta el encaje, alcance y disponibilidad de Akademate para tu centro.',
  alternates: { canonical: '/contacto' },
}

export default function ContactPage() {
  const identity = getPublicLegalIdentity()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Contacta con nosotros
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                ¿Tienes preguntas sobre Akademate? Estamos aquí para ayudarte.
              </p>
            </div>
          </div>
        </section>

        {/* Contact section */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* Contact form */}
              <div className="rounded-2xl border bg-background p-8 shadow-sm">
                <h2 className="text-xl font-semibold">Envíanos un mensaje</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Rellena el formulario y revisaremos contigo el alcance disponible.
                </p>

                <Suspense fallback={<p className="mt-8 text-sm text-muted-foreground">Cargando formulario…</p>}>
                  <ContactForm />
                </Suspense>
              </div>

              {/* Contact info */}
              <div className="contact-info space-y-8">
                <div>
                  <h2 className="text-xl font-semibold">Información de contacto</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Los datos definitivos permanecen como placeholders hasta su confirmación documental.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <PendingValue value={identity.legalEmail} />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Teléfono</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <PendingValue value="Pendiente de confirmación documental antes de publicación contractual" />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Oficina</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <PendingValue value={identity.registeredAddress} />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Entidad operadora</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {identity.legalName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scope note */}
                <div className="rounded-lg border bg-muted/30 p-6">
                  <h3 className="font-medium">Antes de enviar</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No incluyas datos sensibles, credenciales ni información personal de alumnado.
                  </p>
                  <a
                    href="/legal/privacidad"
                    className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Revisar privacidad →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
