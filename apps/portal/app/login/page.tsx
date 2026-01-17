export const metadata = {
  title: 'Login - Portal Akademate',
}

export default function PortalLoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <h1 className="text-3xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-slate-400">
          Selecciona tu academia desde el portal principal para continuar.
        </p>
      </section>
    </main>
  )
}
