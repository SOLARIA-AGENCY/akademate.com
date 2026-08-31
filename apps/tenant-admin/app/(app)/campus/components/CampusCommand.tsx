'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@payload-config/components/ui/command'
import { CAMPUS_NAV } from '../lib/nav'
import type { EnrollmentCard } from '../lib/dashboard'

export function CampusCommand({
  open,
  onOpenChange,
  enrollments,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollments: EnrollmentCard[]
}) {
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Buscar en el campus"
      description="Temarios, clases o recursos"
    >
      <CommandInput placeholder="Buscar temarios, clases o recursos..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Navegación">
          {CAMPUS_NAV.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => {
                onOpenChange(false)
                router.push(item.href)
              }}
            >
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {enrollments.length > 0 ? (
          <CommandGroup heading="Mis cursos">
            {enrollments.map((enrollment) => (
              <CommandItem
                key={enrollment.id}
                value={enrollment.courseTitle}
                onSelect={() => {
                  onOpenChange(false)
                  router.push(`/campus/cursos/${enrollment.id}`)
                }}
              >
                {enrollment.courseTitle}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
