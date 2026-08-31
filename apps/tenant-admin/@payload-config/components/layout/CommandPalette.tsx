'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'

const COMMANDS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Programacion', href: '/programacion' },
  { label: 'Planner Visual', href: '/planner' },
  { label: 'Cursos', href: '/dashboard/cursos' },
  { label: 'Ciclos', href: '/dashboard/ciclos' },
  { label: 'Sedes', href: '/dashboard/sedes' },
  { label: 'Alumnos', href: '/dashboard/alumnos' },
  { label: 'Profesores', href: '/dashboard/profesores' },
  { label: 'Administrativos', href: '/dashboard/personal/administrativos' },
  { label: 'Matriculas', href: '/matriculas' },
  { label: 'Nueva matrícula', href: '/matriculas/nueva' },
  { label: 'Planes y tarifas', href: '/matriculas/planes' },
  { label: 'Tarifas de acceso', href: '/matriculas/tarifas-acceso' },
  { label: 'Recepción', href: '/accesos/recepcion' },
  { label: 'Pases', href: '/accesos/pases' },
  { label: 'Histórico', href: '/accesos/historico' },
  { label: 'Campus Virtual', href: '/campus-virtual' },
  { label: 'Leads', href: '/leads' },
  { label: 'Campanas', href: '/campanas' },
  { label: 'Calendario citas', href: '/calendario-citas' },
  { label: 'Analíticas de marketing', href: '/marketing/analiticas' },
  { label: 'Analíticas web', href: '/web/analiticas' },
  { label: 'Administracion', href: '/administracion' },
  { label: 'Configuracion', href: '/configuracion' },
] as const

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Ir a una seccion..." />
      <CommandList>
        <CommandEmpty>Sin resultados</CommandEmpty>
        <CommandGroup heading="Navegacion">
          {COMMANDS.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => {
                setOpen(false)
                router.push(item.href)
              }}
            >
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
