'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, Search, ChevronLeft, ChevronRight, ExternalLink, Settings } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui/data-table'
import { DataTableEmpty } from '@/components/ui/data-table'
import { useTenants, type OpsTenant } from '@/hooks/use-ops-data'

function derivePlan(limits?: OpsTenant['limits']): string {
  const max = limits?.maxUsers ?? 0
  if (max >= 100) return 'Enterprise'
  if (max >= 20) return 'Professional'
  return 'Starter'
}

const planStyles: Record<string, string> = {
  Enterprise: 'bg-accent text-accent-foreground',
  Professional: 'bg-primary/10 text-primary',
  Starter: 'bg-muted text-muted-foreground',
}

export default function TenantsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useTenants()

  const tenants = (data?.docs ?? []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6" data-testid="tenants-page">
      <PageHeader
        title="Tenants"
        description="Gestiona academias y organizaciones registradas en la plataforma"
      >
        <Link
          href="/dashboard/tenants/create"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo tenant
        </Link>
      </PageHeader>

      <Card className="overflow-hidden">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="search"
            placeholder="Buscar por nombre o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {data && (
            <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
              {tenants.length} de {data.totalDocs} tenants
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Tenant</DataTableHead>
                <DataTableHead>Dominio</DataTableHead>
                <DataTableHead>Plan</DataTableHead>
                <DataTableHead>Estado</DataTableHead>
                <DataTableHead align="right">Usuarios máx.</DataTableHead>
                <DataTableHead align="right">Cursos máx.</DataTableHead>
                <DataTableHead align="right">Acciones</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {tenants.length === 0 ? (
                <DataTableEmpty
                  colSpan={7}
                  title={search ? 'Sin resultados' : 'Sin tenants'}
                  description={
                    search
                      ? 'No se encontraron tenants con ese criterio de búsqueda'
                      : 'Crea el primer tenant para comenzar'
                  }
                />
              ) : (
                tenants.map((tenant) => {
                  const plan = derivePlan(tenant.limits)
                  return (
                    <DataTableRow key={tenant.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                            {tenant.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground font-medium truncate">{tenant.name}</p>
                            <p className="text-muted-foreground text-xs truncate">{tenant.slug}</p>
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-xs text-muted-foreground">
                          {tenant.domain ?? `${tenant.slug}.akademate.com`}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${planStyles[plan]}`}
                        >
                          {plan}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${
                            tenant.active
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {tenant.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </DataTableCell>
                      <DataTableCell align="right" numeric>
                        {tenant.limits?.maxUsers ?? '∞'}
                      </DataTableCell>
                      <DataTableCell align="right" numeric>
                        {tenant.limits?.maxCourses ?? '∞'}
                      </DataTableCell>
                      <DataTableCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`https://${tenant.slug}.akademate.com`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                            title="Abrir tenant"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <Link
                            href={`/dashboard/tenants/${tenant.id}`}
                            className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                            title="Configurar"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  )
                })
              )}
            </DataTableBody>
          </DataTable>
        )}

        {/* Pagination footer */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
            <span>
              Página {data.page} de {data.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={data.page <= 1}
                className="p-1.5 rounded-md border disabled:opacity-40 hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={data.page >= data.totalPages}
                className="p-1.5 rounded-md border disabled:opacity-40 hover:bg-muted/50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
