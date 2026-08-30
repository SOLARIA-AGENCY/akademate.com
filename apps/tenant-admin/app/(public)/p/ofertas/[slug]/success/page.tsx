import Link from 'next/link'

export default function OfferSuccessPage() {
  return (
    <main className="public-site mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold">Pago confirmado</h1>
      <p className="mt-3 text-neutral-600">
        Tu plaza queda reservada. Recibiras un correo de Stripe y el equipo de la academia se pondra en contacto si hace falta.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium underline">
        Volver al inicio
      </Link>
    </main>
  )
}
