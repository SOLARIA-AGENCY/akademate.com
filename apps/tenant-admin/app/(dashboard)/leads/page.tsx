'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@payload-config/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Download, Plus } from 'lucide-react'

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

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-green-100 text-green-800',
  qualified: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  spam: 'bg-slate-100 text-slate-800',
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
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Leads</h1>
          <p className="text-muted-foreground">
            Control y seguimiento de leads capturados desde formularios y campañas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCsv} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => window.open('/admin/collections/leads/create', '_blank', 'noopener,noreferrer')} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir lead
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Fecha registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Cargando leads...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No hay leads disponibles.
                </TableCell>
              </TableRow>
            )}

            {leads.map((lead) => {
              const statusKey = lead.status ?? 'new'
              return (
                <TableRow key={lead.id}>
                  <TableCell>
                    {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell>{lead.email ?? '—'}</TableCell>
                  <TableCell>{lead.phone ?? '—'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[statusKey] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {statusLabels[statusKey] ?? 'Nuevo'}
                    </span>
                  </TableCell>
                  <TableCell>{formatOrigin(lead)}</TableCell>
                  <TableCell>{formatDate(lead.createdAt)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
