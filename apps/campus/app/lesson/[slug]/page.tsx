import Link from 'next/link'

export const metadata = {
  title: 'Lección - Campus',
}

export default function LessonPage() {
  return (
    <main className="space-y-6">
      <header className="rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-3xl font-semibold" data-testid="lesson-title">Lección: Fundamentos</h1>
        <p className="mt-2 text-sm text-muted-foreground" data-testid="lesson-duration">Duración estimada: 25 min</p>
      </header>

      <section className="rounded-2xl border border-border bg-card/60 p-6" data-testid="lesson-content">
        <p className="text-sm text-muted-foreground">
          Contenido de la lección con recursos descargables, vídeos y material de apoyo.
        </p>
        <div className="materials-list mt-4 space-y-2 text-xs text-muted-foreground" data-testid="materials-list">
          <div>Guía PDF</div>
          <div>Plantilla descargable</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vídeo</div>
        <video
          className="mt-3 h-48 w-full rounded-xl border border-border/40 bg-background/40"
          data-testid="video-player"
          controls
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/lesson/prev" className="rounded-full border border-border/60 px-4 py-2 text-sm">Anterior</Link>
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Completado</button>
        <Link href="/lesson/next" className="rounded-full border border-border/60 px-4 py-2 text-sm">Siguiente</Link>
      </div>
    </main>
  )
}
