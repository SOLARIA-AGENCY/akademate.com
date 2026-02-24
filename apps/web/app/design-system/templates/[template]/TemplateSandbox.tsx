'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type TemplateSandboxProps = {
  template: string
  modules: string[]
  components: string[]
}

export function TemplateSandbox({ template, modules, components }: TemplateSandboxProps) {
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable')
  const [query, setQuery] = useState('')
  const [activeModules, setActiveModules] = useState<string[]>(modules)
  const [activeComponents, setActiveComponents] = useState<string[]>(components.slice(0, 8))

  const filteredComponents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return components
    return components.filter((component) => component.toLowerCase().includes(q))
  }, [components, query])

  function toggleModule(module: string) {
    setActiveModules((prev) => (prev.includes(module) ? prev.filter((item) => item !== module) : [...prev, module]))
  }

  function toggleComponent(component: string) {
    setActiveComponents((prev) =>
      prev.includes(component) ? prev.filter((item) => item !== component) : [...prev, component]
    )
  }

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sandbox local</p>
          <h3 className="text-lg font-semibold text-foreground">{template}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={density === 'comfortable' ? 'default' : 'outline'} onClick={() => setDensity('comfortable')}>
            Comfortable
          </Button>
          <Button size="sm" variant={density === 'compact' ? 'default' : 'outline'} onClick={() => setDensity('compact')}>
            Compact
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Módulos activos</p>
          <div className="flex flex-wrap gap-2">
            {modules.map((module) => (
              <button
                key={module}
                type="button"
                onClick={() => toggleModule(module)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeModules.includes(module)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {module}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Componentes del template</p>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar componente..."
            className="h-8"
          />
          <div className="flex max-h-28 flex-wrap gap-2 overflow-auto rounded-md border p-2">
            {filteredComponents.map((component) => (
              <button
                key={component}
                type="button"
                onClick={() => toggleComponent(component)}
                className={`rounded border px-2 py-1 text-[11px] transition-colors ${
                  activeComponents.includes(component)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {component}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${density === 'compact' ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {activeModules.map((module) => (
          <article key={module} className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{module}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Área de trabajo simulada para revisar jerarquía visual y densidad.
            </p>
            <div className="mt-2 space-y-1">
              {activeComponents.slice(0, density === 'compact' ? 3 : 5).map((component) => (
                <div key={`${module}-${component}`} className="rounded border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                  {component}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
