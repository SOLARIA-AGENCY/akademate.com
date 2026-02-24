import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Pill } from '@akademate/ui'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TemplateGallery } from './TemplateGallery'
import {
  designFoundations,
  designSystemSource,
  templateNames,
  uiComponentNames,
} from '@/lib/design-system-catalog'
import { allDetectedTemplateComponents, templateComponentMatrix } from '@/lib/template-component-matrix'

export const metadata: Metadata = {
  title: 'Akademate Design System',
  description: 'Catalogo operativo del sistema de diseno de AKADEMATE.',
}

function foundationPreview(name: string): ReactNode {
  switch (name) {
    case 'Color Tokens':
      return (
        <div className="grid grid-cols-5 gap-2">
          <div className="h-7 rounded bg-primary" />
          <div className="h-7 rounded bg-secondary" />
          <div className="h-7 rounded bg-accent" />
          <div className="h-7 rounded bg-muted" />
          <div className="h-7 rounded border border-border bg-background" />
        </div>
      )
    case 'Typography':
      return (
        <div className="space-y-1">
          <p className="text-base font-semibold">Heading Semibold</p>
          <p className="text-sm text-muted-foreground">Body text regular for content blocks.</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Label / Caption</p>
        </div>
      )
    case 'Spacing & Layout':
      return (
        <div className="grid grid-cols-4 gap-2">
          <div className="h-6 rounded bg-primary/15" />
          <div className="h-6 rounded bg-primary/30" />
          <div className="h-6 rounded bg-primary/45" />
          <div className="h-6 rounded bg-primary/60" />
        </div>
      )
    case 'Radii & Elevation':
      return (
        <div className="flex items-end gap-2">
          <div className="h-10 w-10 rounded-sm border bg-background shadow-sm" />
          <div className="h-10 w-10 rounded-md border bg-background shadow" />
          <div className="h-10 w-10 rounded-xl border bg-background shadow-md" />
        </div>
      )
    case 'Motion':
      return (
        <div className="relative h-8 overflow-hidden rounded bg-muted">
          <div className="absolute left-2 top-1.5 h-5 w-10 rounded bg-primary/70 transition-all duration-500" />
        </div>
      )
    case 'Theming':
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border bg-white p-2 text-xs text-black">Light</div>
          <div className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white">Dark</div>
        </div>
      )
    default:
      return <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">Foundation preview</div>
  }
}

function componentPreview(name: string): ReactNode {
  switch (name) {
    case 'button':
      return (
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
        </div>
      )
    case 'input':
      return <Input placeholder="Escribe aqui..." />
    case 'card':
      return (
        <div className="rounded-lg border bg-background p-3">
          <p className="text-sm font-semibold">Card Title</p>
          <p className="text-xs text-muted-foreground">Preview de layout y contenido.</p>
        </div>
      )
    case 'badge':
      return (
        <div className="flex gap-2">
          <Pill label="Default" />
          <Pill label="Success" tone="accent" />
          <Pill label="Muted" tone="muted" />
        </div>
      )
    case 'table':
      return (
        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-3 bg-muted/50 px-2 py-1 text-xs font-semibold">
            <span>Alumno</span>
            <span>Curso</span>
            <span>Estado</span>
          </div>
          <div className="grid grid-cols-3 px-2 py-1 text-xs">
            <span>Ana</span>
            <span>React</span>
            <span>Activo</span>
          </div>
        </div>
      )
    case 'progress':
      return (
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 w-2/3 rounded-full bg-primary" />
          </div>
          <p className="text-xs text-muted-foreground">67%</p>
        </div>
      )
    case 'avatar':
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            CP
          </div>
          <span className="text-sm">Carlos Perez</span>
        </div>
      )
    case 'checkbox':
      return (
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-input" defaultChecked />
          Recordarme
        </label>
      )
    case 'switch':
      return (
        <div className="inline-flex items-center gap-2">
          <span className="relative h-6 w-11 rounded-full bg-primary/30 p-1">
            <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-primary" />
          </span>
          <span className="text-sm">Activo</span>
        </div>
      )
    case 'textarea':
      return (
        <textarea
          className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Mensaje de ejemplo..."
          readOnly
        />
      )
    case 'select':
    case 'combobox':
    case 'dropdown-menu':
      return (
        <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
          <span>Seleccionar opcion</span>
          <span className="text-muted-foreground">⌄</span>
        </div>
      )
    case 'dialog':
      return (
        <div className="rounded-md border bg-background p-2">
          <p className="text-xs font-semibold">Dialog title</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Confirmacion modal de accion.</p>
        </div>
      )
    case 'sheet':
      return (
        <div className="grid grid-cols-[1fr_80px] gap-2">
          <div className="rounded border bg-background p-2 text-xs">Content</div>
          <div className="rounded border bg-muted/60 p-2 text-xs">Sheet</div>
        </div>
      )
    case 'drawer':
      return (
        <div className="space-y-1 rounded border bg-background p-2">
          <div className="mx-auto h-1 w-8 rounded-full bg-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Drawer bottom content</p>
        </div>
      )
    case 'alert-dialog':
      return <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs">Confirmar eliminacion irreversible</div>
    case 'popover':
      return <div className="inline-block rounded border bg-background px-2 py-1 text-xs shadow-sm">Popover content</div>
    case 'tooltip':
      return <div className="inline-block rounded bg-foreground px-2 py-1 text-xs text-background">Tooltip</div>
    case 'calendar':
      return (
        <div className="grid grid-cols-7 gap-1 text-[10px]">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
            <span key={day} className="text-center text-muted-foreground">
              {day}
            </span>
          ))}
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={`cal-${index}`}
              className={`rounded py-1 text-center ${index === 9 ? 'bg-primary text-primary-foreground' : 'bg-muted/40'}`}
            >
              {index + 1}
            </span>
          ))}
        </div>
      )
    case 'carousel':
      return (
        <div className="space-y-2">
          <div className="h-10 rounded bg-muted" />
          <div className="flex justify-center gap-1">
            <span className="h-1.5 w-4 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          </div>
        </div>
      )
    case 'collapsible':
      return (
        <div className="rounded border">
          <div className="flex items-center justify-between px-2 py-1 text-xs font-medium">
            <span>Section title</span>
            <span>⌃</span>
          </div>
          <div className="border-t px-2 py-1 text-xs text-muted-foreground">Contenido desplegado</div>
        </div>
      )
    case 'field':
      return (
        <div className="space-y-1">
          <label className="text-xs font-medium">Email</label>
          <Input placeholder="admin@akademate.com" />
        </div>
      )
    case 'grid-pattern':
      return (
        <div
          className="h-12 rounded border"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
          }}
        />
      )
    case 'input-group':
      return (
        <div className="flex overflow-hidden rounded-md border border-input">
          <span className="bg-muted px-2 py-2 text-xs text-muted-foreground">https://</span>
          <input className="w-full bg-background px-2 py-2 text-xs" value="akademate.com" readOnly />
        </div>
      )
    case 'kbd':
      return (
        <div className="flex gap-1 text-xs">
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">⌘</kbd>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">K</kbd>
        </div>
      )
    case 'label':
      return <label className="text-xs font-semibold uppercase tracking-wide">Label Preview</label>
    case 'logo':
      return (
        <div className="inline-flex items-center gap-2 rounded border px-2 py-1">
          <span className="h-5 w-5 rounded bg-primary" />
          <span className="text-xs font-semibold">Akademate</span>
        </div>
      )
    case 'scroll-area':
      return (
        <div className="h-12 overflow-y-auto rounded border p-1 text-xs">
          <p>Item 1</p>
          <p>Item 2</p>
          <p>Item 3</p>
          <p>Item 4</p>
        </div>
      )
    case 'slider':
      return (
        <div className="relative h-6">
          <div className="absolute top-2 h-1 w-full rounded bg-muted" />
          <div className="absolute top-2 h-1 w-2/3 rounded bg-primary" />
          <div className="absolute left-[66%] top-0.5 h-4 w-4 -translate-x-1/2 rounded-full border bg-background" />
        </div>
      )
    case 'verified-icon':
      return (
        <div className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">✓</span>
          Verified
        </div>
      )
    case 'sidebar':
      return (
        <div className="grid grid-cols-[80px_1fr] overflow-hidden rounded-md border">
          <div className="bg-muted/60 p-2 text-xs">Nav</div>
          <div className="p-2 text-xs">Content</div>
        </div>
      )
    case 'skeleton':
      return (
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted/70" />
          <div className="h-3 w-1/2 rounded bg-muted/50" />
        </div>
      )
    case 'separator':
      return (
        <div className="space-y-2">
          <p className="text-xs">Bloque A</p>
          <hr className="border-border" />
          <p className="text-xs">Bloque B</p>
        </div>
      )
    case 'chart':
      return (
        <div className="flex h-14 items-end gap-1">
          <div className="h-4 w-3 rounded bg-primary/40" />
          <div className="h-8 w-3 rounded bg-primary/60" />
          <div className="h-12 w-3 rounded bg-primary/80" />
          <div className="h-9 w-3 rounded bg-primary/50" />
        </div>
      )
    default:
      return <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">Componente visual</div>
  }
}

export default function DesignSystemPage() {
  const componentCoverage = allDetectedTemplateComponents
    .map((component) => {
      const usedBy = Object.entries(templateComponentMatrix)
        .filter(([, coverage]) => coverage.components.includes(component))
        .map(([template]) => template)
      return { component, usedBy, count: usedBy.length }
    })
    .sort((a, b) => b.count - a.count || a.component.localeCompare(b.component))

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-primary/5 to-background">
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Akademate UI</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">AKADEMATE DESIGN SYSTEM</h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Desglose completo de foundations, componentes y plantillas a usar en la plataforma.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Fuente local</CardTitle>
                <CardDescription>Repositorio base integrado en este monorepo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs">{designSystemSource.localPath}</p>
                <a href={designSystemSource.upstreamRepository} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">
                    Abrir repositorio upstream
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storybook</CardTitle>
                <CardDescription>Vista viva de componentes en entorno de diseño.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs">{designSystemSource.storybookUrl}</p>
                <a href={designSystemSource.storybookUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">
                    Abrir Storybook
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventario</CardTitle>
                <CardDescription>Estado actual del catalogo importado de akademate-ui.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Templates: {templateNames.length}</p>
                <p>Componentes UI: {uiComponentNames.length}</p>
                <p>Foundations: {designFoundations.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Foundations</CardTitle>
                <CardDescription>Base visual y de interaccion comun para todas las apps.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {designFoundations.map((item) => (
                  <div key={item.name} className="rounded-lg border bg-background px-4 py-3">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Componentes UI</CardTitle>
                <CardDescription>Galeria visual de los componentes base detectados en el kit.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {uiComponentNames.map((component) => (
                    <span
                      key={component}
                      className="rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground"
                    >
                      {component}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Visualización de Foundations</CardTitle>
              <CardDescription>Cada foundation con representacion visual aplicada.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {designFoundations.map((item) => (
                  <div key={`foundation-${item.name}`} className="rounded-lg border bg-background p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.name}</p>
                    {foundationPreview(item.name)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Visualización de Componentes</CardTitle>
              <CardDescription>Cada elemento del catalogo se muestra con un preview funcional.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {uiComponentNames.map((component) => (
                  <div key={component} className="rounded-lg border bg-background p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{component}</p>
                    {componentPreview(component)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Templates disponibles</CardTitle>
              <CardDescription>
                Plantillas listas en `vendor/academate-ui/templates` y `templates-baseui`.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {templateNames.map((template) => (
                  <span
                    key={template}
                    className="rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground"
                  >
                    {template}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Matriz de cobertura template ↔ componentes</CardTitle>
              <CardDescription>
                Cobertura real detectada automáticamente desde `vendor/academate-ui` para cada template.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {templateNames.map((template) => {
                  const coverage = templateComponentMatrix[template]
                  if (!coverage) return null
                  return (
                    <div key={`coverage-${template}`} className="rounded-lg border bg-background p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{template}</p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {coverage.componentCount} componentes
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Variantes: {coverage.variants.join(' + ') || 'N/A'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {coverage.components.slice(0, 10).map((component) => (
                          <span
                            key={`${template}-${component}`}
                            className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {component}
                          </span>
                        ))}
                        {coverage.components.length > 10 ? (
                          <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            +{coverage.components.length - 10} más
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-lg border bg-background p-3">
                <p className="text-sm font-semibold text-foreground">Ranking de componentes más reutilizados</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {componentCoverage.slice(0, 18).map((item) => (
                    <div key={`component-rank-${item.component}`} className="rounded border bg-muted/20 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{item.component}</span>
                        <span className="text-xs text-muted-foreground">{item.count} templates</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{item.usedBy.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Visualización de Templates</CardTitle>
              <CardDescription>
                Visualizacion completa de cada template con captura real de su demo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateGallery />
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  )
}
