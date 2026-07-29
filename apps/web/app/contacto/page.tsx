import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Mail } from 'lucide-react'
import { ContactForm } from '@/components/forms/contact-form'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = { title: 'Contacto', description: 'Consulta comercial, soporte o privacidad de Akademate.', alternates: { canonical: '/contacto' } }

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="contenido" className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.2fr]">
          <section>
            <p className="text-sm font-semibold text-primary">Contacto</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Cuéntanos qué necesitas validar</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">Describe procesos, sedes, integraciones y usuarios. La respuesta debe separar capacidad existente, configuración y trabajo pendiente.</p>
            <div className="mt-8 rounded-2xl border bg-muted/30 p-6">
              <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 font-semibold">Canal general verificable</h2>
              <a href="mailto:hola@akademate.com" className="mt-2 inline-block text-sm text-primary hover:underline">hola@akademate.com</a>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">No publicamos teléfono, domicilio operativo, horario ni SLA de respuesta hasta validarlos.</p>
            </div>
          </section>
          <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold">Enviar una solicitud</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Los campos se usan para tramitar la consulta. El marketing permanece desactivado.</p>
            <Suspense fallback={<p className="mt-8 text-sm text-muted-foreground">Cargando formulario…</p>}><ContactForm /></Suspense>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
