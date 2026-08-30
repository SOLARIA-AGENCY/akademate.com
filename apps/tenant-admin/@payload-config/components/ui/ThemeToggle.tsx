'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { cn } from '@payload-config/lib/utils'

const TOGGLE_CLASS =
  'relative text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white'

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const THEME_KEY = 'akademate-theme'
  const LEGACY_THEME_KEY = 'cep-theme'

  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY)
    const isCurrentlyDark = stored === 'dark'

    setIsDark(isCurrentlyDark)
    document.documentElement.classList.toggle('dark', isCurrentlyDark)
    document.documentElement.classList.toggle('light', !isCurrentlyDark)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    localStorage.setItem(THEME_KEY, newIsDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newIsDark)
    document.documentElement.classList.toggle('light', !newIsDark)
  }

  const icon = isDark ? (
    <Sun className="size-5 text-current" data-oid="tu3-shi" />
  ) : (
    <Moon className="size-5 text-current" data-oid="kmvk501" />
  )

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        disabled
        data-slot="theme-toggle"
        className={cn(TOGGLE_CLASS, className)}
        data-oid="msmnbx8"
      >
        <Moon className="size-5 text-current" data-oid="_9m1.cy" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      data-slot="theme-toggle"
      className={cn(TOGGLE_CLASS, className)}
      data-oid="r-w_w5w"
    >
      {icon}
      <span className="sr-only" data-oid="51pnpj4">
        Cambiar tema
      </span>
    </Button>
  )
}
