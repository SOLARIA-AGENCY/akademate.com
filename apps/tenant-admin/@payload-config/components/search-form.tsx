"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { Label } from "@payload-config/components/ui/label"
import { SidebarInput } from "@payload-config/components/ui/sidebar"

const shortcuts = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Programación", href: "/programacion" },
  { label: "Planner Visual", href: "/planner" },
  { label: "Cursos", href: "/dashboard/cursos" },
  { label: "Ciclos", href: "/dashboard/ciclos" },
  { label: "Sedes", href: "/dashboard/sedes" },
  { label: "Personal", href: "/personal" },
  { label: "Campus Virtual", href: "/campus-virtual" },
  { label: "Leads", href: "/leads" },
  { label: "Calendario citas", href: "/calendario-citas" },
  { label: "Analíticas", href: "/analiticas" },
  { label: "Administración", href: "/administracion" },
  { label: "Configuración", href: "/configuracion" },
]

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchOpen, setSearchOpen] = React.useState(false)

  const filteredShortcuts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return shortcuts.slice(0, 6)
    return shortcuts.filter(
      (item) => item.label.toLowerCase().includes(query) || item.href.includes(query)
    )
  }, [searchQuery])

  const goToShortcut = (href: string) => {
    setSearchOpen(false)
    setSearchQuery("")
    router.push(href)
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (filteredShortcuts.length === 0) return
    goToShortcut(filteredShortcuts[0].href)
  }

  return (
    <form
      {...props}
      onSubmit={(event) => {
        handleSearchSubmit(event)
        props.onSubmit?.(event)
      }}
    >
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          id="search"
          placeholder="Buscar sección..."
          className="h-8 pl-7"
          value={searchQuery}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => {
            setTimeout(() => setSearchOpen(false), 120)
          }}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
        {searchOpen ? (
          <div className="absolute left-0 right-0 top-10 z-50 rounded-md border bg-popover p-1 shadow-md">
            {filteredShortcuts.length > 0 ? (
              filteredShortcuts.slice(0, 6).map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onMouseDown={() => goToShortcut(item.href)}
                  className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.href}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
            )}
          </div>
        ) : null}
      </div>
    </form>
  )
}
