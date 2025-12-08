export default function Page() {
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Campus</p>
          <h1 className="text-2xl font-semibold">Mis cursos</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">progreso</span>
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-secondary">evaluaciones</span>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">certificados</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Curso activo</p>
          <p className="text-3xl font-semibold">Frontend</p>
          <p className="mt-2 text-xs text-muted-foreground">Módulos, materiales y sesiones en vivo.</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Tareas</p>
          <p className="text-3xl font-semibold">0/3</p>
          <p className="mt-2 text-xs text-muted-foreground">Entregas con feedback y notas simples.</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Certificado</p>
          <p className="text-3xl font-semibold">pendiente</p>
          <p className="mt-2 text-xs text-muted-foreground">Emitido por tenant, checksum y descarga segura.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold">Próximo</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Conectar autenticación alumno, matrículas y proveedores de vídeo/storage.
        </p>
      </div>
    </div>
  )
}
