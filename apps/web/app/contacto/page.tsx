import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

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

                <form className="mt-8 space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+34 612 345 678"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium">
                      Asunto *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecciona un asunto</option>
                      <option value="demo">Solicitar demo</option>
                      <option value="pricing">Información de precios</option>
                      <option value="support">Soporte técnico</option>
                      <option value="partnership">Colaboraciones</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium">
                      Mensaje *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="¿En qué podemos ayudarte?"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="gdpr"
                      name="gdpr"
                      required
                      className="mt-1 rounded border-gray-300"
                    />
                    <label htmlFor="gdpr" className="text-sm text-muted-foreground">
                      Acepto la{' '}
                      <a href="/privacidad" className="text-primary hover:underline">
                        política de privacidad
                      </a>{' '}
                      y el tratamiento de mis datos para gestionar mi consulta. *
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Enviar mensaje
                  </button>
                </form>
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
