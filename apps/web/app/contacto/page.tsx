import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { ContactForm } from '@/components/forms/contact-form'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con nosotros para más información sobre Akademate',
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
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
                  Rellena el formulario y te responderemos en menos de 24 horas.
                </p>

                <ContactForm />
              </div>

              {/* Contact info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold">Información de contacto</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    También puedes contactarnos directamente a través de estos canales.
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
                        info@akademate.com
                      </p>
                      <p className="text-sm text-muted-foreground">
                        soporte@akademate.com
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
                        +34 912 345 678
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
                        Calle Principal 123<br />
                        28001 Madrid, España
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Horario de atención</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Lunes a Viernes: 9:00 - 18:00<br />
                        Sábado y Domingo: Cerrado
                      </p>
                    </div>
                  </div>
                </div>

                {/* FAQ link */}
                <div className="rounded-lg border bg-muted/30 p-6">
                  <h3 className="font-medium">¿Preguntas frecuentes?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Consulta nuestra sección de FAQ donde encontrarás respuestas
                    a las preguntas más comunes.
                  </p>
                  <a
                    href="/faq"
                    className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Ver FAQ →
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
