import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Convocatoria no encontrada</h2>
        <p className="text-gray-600 mb-6">
          La convocatoria que buscas no existe, ha sido eliminada o aun no esta publicada.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
