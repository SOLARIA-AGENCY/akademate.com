'use client'

import { useState, useEffect } from 'react'
import { Headphones, Clock, AlertTriangle, Zap, ChevronRight, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '@/components/ui/kpi-card'

interface Ticket {
  id: string
  tenantName: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'technical' | 'billing' | 'feature_request' | 'general'
  createdAt: string
  assignedTo: string | null
  messages: number
}

const statusConfig = {
  open: { label: 'Abierto', className: 'bg-warning/10 text-warning' },
  in_progress: { label: 'En Progreso', className: 'bg-primary/10 text-primary' },
  waiting: { label: 'Esperando', className: 'bg-accent/10 text-accent-foreground' },
  resolved: { label: 'Resuelto', className: 'bg-success/10 text-success' },
  closed: { label: 'Cerrado', className: 'bg-muted text-muted-foreground' },
}

const priorityConfig = {
  low: { label: 'Baja', className: 'text-muted-foreground' },
  medium: { label: 'Media', className: 'text-primary' },
  high: { label: 'Alta', className: 'text-warning' },
  urgent: { label: 'Urgente', className: 'text-destructive' },
}

const categoryLabels = {
  technical: 'Técnico',
  billing: 'Facturación',
  feature_request: 'Sugerencia',
  general: 'General',
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  if (diffHours < 1) return 'Hace unos minutos'
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export default function SoportePage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => {
    fetch('/api/ops/support-tickets')
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
  }, [])

  const filteredTickets = tickets.filter(
    (t) => statusFilter === 'all' || t.status === statusFilter
  )

  const openCount = tickets.filter((t) => t.status === 'open').length
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length
  const urgentCount = tickets.filter(
    (t) => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved'
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soporte"
        description="Gestiona tickets de soporte de los tenants"
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Tickets Abiertos"
          value={openCount}
          icon={<Headphones className="h-5 w-5 text-warning" />}
          variant="warning"
        />
        <KPICard
          label="En Progreso"
          value={inProgressCount}
          icon={<Clock className="h-5 w-5 text-primary" />}
        />
        <KPICard
          label="Urgentes"
          value={urgentCount}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          variant="danger"
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <CardTitle className="text-base">Tickets de Soporte</CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-muted/50 border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">Todos los estados</option>
              <option value="open">Abiertos</option>
              <option value="in_progress">En Progreso</option>
              <option value="waiting">Esperando</option>
              <option value="resolved">Resueltos</option>
              <option value="closed">Cerrados</option>
            </select>
          </div>
        </CardHeader>
        <div className="divide-y divide-border">
          {tickets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No hay tickets de soporte registrados.</p>
              <p className="text-xs mt-1">Los tickets aparecerán aquí cuando los tenants reporten incidencias.</p>
            </div>
          )}
          {tickets.length > 0 && filteredTickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No hay tickets con ese filtro</p>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{ticket.id}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig[ticket.status].className}`}>
                        {statusConfig[ticket.status].label}
                      </span>
                      <span className={`text-xs font-medium ${priorityConfig[ticket.priority].className}`}>
                        {priorityConfig[ticket.priority].label}
                      </span>
                      <span className="px-2 py-0.5 bg-muted rounded-md text-xs text-muted-foreground">
                        {categoryLabels[ticket.category]}
                      </span>
                    </div>
                    <p className="text-foreground font-medium truncate">{ticket.subject}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{ticket.tenantName}</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                      <span>{ticket.messages} mensajes</span>
                      {ticket.assignedTo && <span className="text-primary">{ticket.assignedTo}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{selectedTicket.id}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig[selectedTicket.status].className}`}>
                      {statusConfig[selectedTicket.status].label}
                    </span>
                  </div>
                  <CardTitle>{selectedTicket.subject}</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedTicket.tenantName} · {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground">
                {selectedTicket.description}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Estado</label>
                  <select className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-foreground text-sm">
                    <option>Abierto</option>
                    <option>En Progreso</option>
                    <option>Esperando</option>
                    <option>Resuelto</option>
                    <option>Cerrado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Asignar a</label>
                  <select className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-foreground text-sm">
                    <option value="">Sin asignar</option>
                    <option>Carlos Ruiz</option>
                    <option>Ana García</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Responder</label>
                <textarea
                  rows={4}
                  placeholder="Escribe una respuesta..."
                  className="w-full px-4 py-2 bg-muted/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/70 text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm transition-colors flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  Enviar Respuesta
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
