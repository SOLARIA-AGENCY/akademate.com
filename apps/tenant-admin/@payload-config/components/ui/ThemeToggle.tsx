'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const THEME_KEY = 'akademate-theme'
  const LEGACY_THEME_KEY = 'cep-theme'

  React.useEffect(() => {
    setMounted(true)
    // Check initial theme from localStorage or system preference
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

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Toggle theme"
        disabled
        data-oid="msmnbx8"
      >
        <Sun className="h-5 w-5" data-oid="_9m1.cy" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
      title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      data-oid="r-w_w5w"
    >
      {isDark ? (
        <Sun className="h-5 w-5" data-oid="tu3-shi" />
      ) : (
        <Moon className="h-5 w-5" data-oid="kmvk501" />
      )}
      <span className="sr-only" data-oid="51pnpj4">
        Cambiar tema
      </span>
    </button>
  )
}
