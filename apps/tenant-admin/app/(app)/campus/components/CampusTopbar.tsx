'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useSession } from '../providers/SessionProvider'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Switch } from '@payload-config/components/ui/switch'
import { SidebarTrigger } from '@payload-config/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'

export function CampusTopbar({
  roleLabel,
  onSearchFocus,
}: {
  roleLabel?: string | null
  onSearchFocus?: () => void
}) {
  const { student, logout } = useSession()
  const [isDark, setIsDark] = useState(false)
  const THEME_KEY = 'akademate-theme'

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(stored === 'dark' || (!stored && systemDark))
  }, [])

  const initials = `${student?.firstName?.[0] ?? ''}${student?.lastName?.[0] ?? ''}`.toUpperCase()

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked)
    localStorage.setItem(THEME_KEY, checked ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', checked)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <button
        type="button"
        className="relative min-w-0 flex-1"
        onClick={onSearchFocus}
        aria-label="Abrir buscador"
      >
        <Input
          readOnly
          placeholder="Buscar temarios, clases o recursos... ⌘K"
          className="pointer-events-none h-9 cursor-pointer bg-background"
        />
      </button>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Switch
            checked={isDark}
            onCheckedChange={toggleTheme}
            aria-label="Cambiar tema"
          />
        </div>
        {student ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto gap-2 px-2 py-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={student.avatar} alt={student.fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-left md:block">
                  <span className="block text-sm font-medium leading-tight">{student.fullName}</span>
                  <span className="block text-xs text-muted-foreground">{roleLabel ?? 'Alumno'}</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{student.fullName}</p>
                <p className="text-xs text-muted-foreground">{student.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void logout()}>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}
