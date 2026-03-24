'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Input } from '@payload-config/components/ui/input'
import {
  UserPlus, Search, Loader2, Phone, Mail, Calendar,
  MapPin, AlertCircle, CheckCircle2, XCircle, Clock, MessageSquare,
} from 'lucide-react'

interface Lead {
  id: number
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  message?: string
  lead_type?: string
  source_form?: string
  source_page?: string
  status?: string
  priority?: string
  contact_attempts?: number
  last_contact_result?: string
  next_callback_date?: string
  contacted_email?: boolean
  contacted_whatsapp?: boolean
  contacted_phone?: boolean
  campaign_code?: string
  convocatoria_id?: number
  notes?: any
  createdAt?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contactado', color: 'bg-amber-100 text-amber-800' },
  interested: { label: 'Interesado', color: 'bg-green-100 text-green-800' },
  not_interested: { label: 'No interesado', color: 'bg-gray-100 text-gray-800' },
  no_answer: { label: 'No contesta', color: 'bg-orange-100 text-orange-800' },
  wrong_number: { label: 'Numero incorrecto', color: 'bg-red-100 text-red-800' },
  callback: { label: 'Callback', color: 'bg-purple-100 text-purple-800' },
  enrolled: { label: 'Matriculado', color: 'bg-green-100 text-green-800' },
  discarded: { label: 'Descartado', color: 'bg-gray-100 text-gray-600' },
}

export default function InscripcionesPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/leads?where[lead_type][equals]=inscripcion&limit=200&sort=-createdAt&depth=0')
      .then(r => r.ok ? r.json() : { docs: [] })
      .then(d => setLeads(d.docs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = leads.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (l.first_name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q)
  })

  const stats = {
    total: leads.length,
    new: leads.filter(l => !l.status || l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted' || l.status === 'interested').length,
    pending: leads.filter(l => l.status === 'callback' || l.status === 'no_answer').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inscripciones"
        description="Preinscripciones urgentes — personas que han solicitado reservar plaza"
        icon={UserPlus}
        badge={stats.new > 0 ? <Badge variant="destructive">{stats.new} nuevas</Badge> : undefined}
      />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total inscripciones', value: stats.total, icon: UserPlus, color: 'text-primary' },
          { label: 'Sin atender', value: stats.new, icon: AlertCircle, color: 'text-red-500' },
          { label: 'Contactados', value: stats.contacted, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Pendientes callback', value: stats.pending, icon: Clock, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, email o telefono..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay inscripciones {search ? 'que coincidan' : 'registradas'}</p>
          <p className="text-xs mt-1">Las inscripciones llegan desde el formulario "Reserva tu plaza" de las convocatorias</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const status = STATUS_CONFIG[lead.status || 'new'] || STATUS_CONFIG.new
            const timeSince = lead.createdAt ? Math.round((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60)) : 0
            const isUrgent = timeSince < 24 && (!lead.status || lead.status === 'new')
            return (
              <Card key={lead.id} className={`${isUrgent ? 'border-l-4 border-l-red-500' : ''} hover:shadow-md transition-shadow cursor-pointer`} onClick={() => router.push(`/inscripciones/${lead.id}`)}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{lead.first_name || lead.email || 'Sin nombre'}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>{status.label}</span>
                        {isUrgent && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">URGENTE</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                        {lead.createdAt && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(lead.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                        {lead.source_form && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.source_form}</span>}
                      </div>
                      {lead.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{typeof lead.message === 'string' ? lead.message : ''}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Contact attempt indicators */}
                      <div className="flex gap-1">
                        {lead.contacted_phone && <Phone className="h-3.5 w-3.5 text-green-500" />}
                        {lead.contacted_email && <Mail className="h-3.5 w-3.5 text-blue-500" />}
                        {lead.contacted_whatsapp && <MessageSquare className="h-3.5 w-3.5 text-green-600" />}
                      </div>
                      {lead.contact_attempts != null && lead.contact_attempts > 0 && (
                        <Badge variant="outline" className="text-[10px]">{lead.contact_attempts} intentos</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
