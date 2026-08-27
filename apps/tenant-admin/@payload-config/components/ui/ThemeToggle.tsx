'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { cn } from '@payload-config/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const THEME_KEY = 'akademate-theme'
  const LEGACY_THEME_KEY = 'cep-theme'

  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY)
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isCurrentlyDark = stored === 'dark' || (!stored && systemDark)

    setIsDark(isCurrentlyDark)
    document.documentElement.classList.toggle('dark', isCurrentlyDark)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    localStorage.setItem(THEME_KEY, newIsDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newIsDark)
  }

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label="Toggle theme"
        disabled
        className={cn('size-11 rounded-xl p-2.5 shadow-sm', className)}
        data-oid="msmnbx8"
      >
        <Sun className="size-5" data-oid="_9m1.cy" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      className={cn('size-11 rounded-xl p-2.5 shadow-sm', className)}
      data-oid="r-w_w5w"
    >
      {isDark ? (
        <Sun className="size-5" data-oid="tu3-shi" />
      ) : (
        <Moon className="size-5" data-oid="kmvk501" />
      )}
      <span className="sr-only" data-oid="51pnpj4">
        Cambiar tema
      </span>
    </Button>
  )
}
