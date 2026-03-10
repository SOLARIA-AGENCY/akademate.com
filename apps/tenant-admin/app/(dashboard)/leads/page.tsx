'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import { Badge } from '@payload-config/components/ui/badge'
import { Download, Plus, UserCheck, MoreHorizontal } from 'lucide-react'

interface Lead {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected' | 'spam'
  utm?: {
    source?: string | null
    medium?: string | null
    campaign?: string | null
  }
  createdAt?: string | null
}

const statusVariants: Record<string, 'info' | 'warning' | 'default' | 'success' | 'destructive' | 'neutral'> = {
  new: 'info',
  contacted: 'warning',
  qualified: 'default',
  converted: 'success',
  rejected: 'destructive',
  spam: 'neutral',
}

const statusLabels: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  converted: 'Convertido',
  rejected: 'Rechazado',
  spam: 'Spam',
}

const formatOrigin = (lead: Lead) => {
  const parts = [lead.utm?.source, lead.utm?.medium, lead.utm?.campaign].filter(Boolean)
  if (parts.length === 0) return '—'
  return parts.join(' · ')
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-ES')
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasAnyOrigin = leads.some((l) => formatOrigin(l) !== '—')

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/leads?limit=25&sort=-createdAt')
        if (!response.ok) {
          throw new Error('No se pudieron cargar los leads')
        }

        const payload = await response.json()
        setLeads(Array.isArray(payload?.docs) ? payload.docs : [])
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar leads')
        setLeads([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeads()
  }, [])

  const exportToCsv = () => {
    const header = ['Nombre', 'Email', 'Telefono', 'Estado', 'Origen', 'Fecha registro']
    const rows = leads.map((lead) => [
      [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—',
      lead.email ?? '—',
      lead.phone ?? '—',
      statusLabels[lead.status ?? 'new'] ?? 'Nuevo',
      formatOrigin(lead),
      formatDate(lead.createdAt),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `\"${String(cell).replaceAll('\"', '\"\"')}\"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'leads.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6" data-oid="bge7wx4">
      <PageHeader
        title="Gestión de Leads"
        description="Control y seguimiento de leads capturados desde formularios y campañas"
        icon={UserCheck}
        actions={
          <>
            <Button variant="outline" onClick={exportToCsv} disabled={isLoading} data-oid="th9fcum">
              <Download className="mr-2 h-4 w-4" data-oid="hku1nkp" />
              Exportar CSV
            </Button>
            <Button
              onClick={() =>
                window.open('/admin/collections/leads/create', '_blank', 'noopener,noreferrer')
              }
              disabled={isLoading}
              data-oid="_qt3r71"
            >
              <Plus className="mr-2 h-4 w-4" data-oid="g_2ici6" />
              Añadir lead
            </Button>
          </>
        }
        data-oid="t:6migs"
      />

      {errorMessage && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
          data-oid="k-mwif."
        >
          {errorMessage}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-x-auto" data-oid="krulg2:">
        <Table data-oid="mn8p22s">
          <TableHeader data-oid="32ncxg_">
            <TableRow data-oid="z3pymf4">
              <TableHead data-oid="se04f2g">Nombre</TableHead>
              <TableHead data-oid="x0xv_f7">Email</TableHead>
              <TableHead data-oid="rh6y4mh">Teléfono</TableHead>
              <TableHead data-oid="giftdlx">Estado</TableHead>
              {hasAnyOrigin && <TableHead data-oid="x35s7xy">Origen</TableHead>}
              <TableHead data-oid="jxfyaxq">Fecha registro</TableHead>
              <TableHead className="w-10" data-oid="0ofvjdn"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-oid="d8l8u33">
            {isLoading && (
              <TableRow data-oid=":dez2tn">
                <TableCell
                  colSpan={hasAnyOrigin ? 7 : 6}
                  className="py-8 text-center text-muted-foreground"
                  data-oid="2aj4_b3"
                >
                  Cargando leads...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && leads.length === 0 && (
              <TableRow data-oid="8gcaxz4">
                <TableCell
                  colSpan={hasAnyOrigin ? 7 : 6}
                  className="py-8 text-center text-muted-foreground"
                  data-oid="pmpy9is"
                >
                  No hay leads disponibles.
                </TableCell>
              </TableRow>
            )}

            {leads.map((lead) => {
              const statusKey = lead.status ?? 'new'
              return (
                <TableRow key={lead.id} data-oid="1fcqk8b">
                  <TableCell data-oid="t0h1fs7">
                    {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell data-oid="13ne36f">{lead.email ?? '—'}</TableCell>
                  <TableCell data-oid="lni55sc">{lead.phone ?? '—'}</TableCell>
                  <TableCell data-oid="27al33e">
                    <Badge
                      variant={statusVariants[statusKey] ?? 'neutral'}
                      data-oid="tkdw4gv"
                    >
                      {statusLabels[statusKey] ?? 'Nuevo'}
                    </Badge>
                  </TableCell>
                  {hasAnyOrigin && <TableCell data-oid="vytgx2l">{formatOrigin(lead)}</TableCell>}
                  <TableCell data-oid="j.4sj2g">{formatDate(lead.createdAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} data-oid="wc.hdio">
                    <DropdownMenu data-oid="seu2ecy">
                      <DropdownMenuTrigger asChild data-oid="uo8ady:">
                        <Button variant="ghost" size="icon" data-oid="3q:q8im">
                          <MoreHorizontal className="h-4 w-4" data-oid="hy7nk9:" />
                          <span className="sr-only" data-oid="a0y14jl">
                            Acciones
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" data-oid=".ma8mm3">
                        <DropdownMenuItem data-oid="ss_l:_6">Ver detalle</DropdownMenuItem>
                        <DropdownMenuItem data-oid="0_y0poy">
                          Convertir a matrícula
                        </DropdownMenuItem>
                        <DropdownMenuSeparator data-oid="u9iasqp" />
                        <DropdownMenuItem className="text-destructive" data-oid="8v2yctn">
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          {!isLoading && leads.length > 0 && (
            <tfoot data-oid="ioeyagf">
              <tr data-oid="pa-ccpi">
                <td
                  colSpan={hasAnyOrigin ? 7 : 6}
                  className="py-3 px-4 text-sm text-muted-foreground border-t"
                  data-oid="iads7nf"
                >
                  Mostrando {leads.length} lead{leads.length !== 1 ? 's' : ''}
                </td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  )
}
