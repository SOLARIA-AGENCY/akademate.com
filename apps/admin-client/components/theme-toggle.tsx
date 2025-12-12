'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-accent relative group"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-500 transition-transform group-hover:rotate-45 duration-300" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:-rotate-12 duration-300" />
          )}
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-xs font-medium">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</p>
      </TooltipContent>
    </Tooltip>
  )
}
