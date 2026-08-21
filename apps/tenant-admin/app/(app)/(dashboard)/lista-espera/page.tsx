'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
import {
  DashboardListingLayout,
  DashboardToolbar,
  ListingActions,
  ListingColumnBoard,
  ListingColumnCard,
  WAITLIST_LIST_COLUMNS,
} from '@payload-config/components/akademate/dashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@payload-config/components/ui/dropdown-menu'
import { downloadCsv, type ExportColumn } from '@/app/lib/dashboard-export'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import {
  Plus,
  ListTodo,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Download,
  ArrowUp,
  ArrowDown,
  Bell,
  Send,
  GraduationCap,
  AlertCircle,
  CalendarClock,
} from 'lucide-react'

interface LeadRow {
  id: string | number
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  lead_type?: string | null
  source_form?: string | null
  source_page?: string | null
  status?: string | null
  priority?: string | null
  campaign_code?: string | null
  assigned_to_id?: string | number | null
  last_contacted_at?: string | null
  created_at?: string | null
  createdAt?: string | null
}

type WaitlistPriority = 'alta' | 'media' | 'baja'
type WaitlistStatus = 'en_lista' | 'notificado' | 'aceptado' | 'rechazado'

interface WaitlistRow {
  id: string
  posicion: number
  alumno: { nombre: string; email: string; telefono: string }
  origen: string
  curso: string
  tipo: string
  convocatoria: string
  sede: string
  prioridad: WaitlistPriority
  estado: WaitlistStatus
  fechaEntrada: string
  plazasDelante: number
  interesadosActuales: number
  umbralApertura: number
  asesor: string
  ultimoContacto: string | null
}

const prioridadConfig: Record<WaitlistPriority, { label: string; color: string; bgColor: string }> = {
  alta: {
    label: 'Alta',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950',
  },
  media: {
    label: 'Media',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
  },
  baja: {
    label: 'Baja',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
}

const estadoConfig: Record<
  WaitlistStatus,
  {
    label: string
    color: string
    bgColor: string
    icon: ComponentType<{ className?: string }>
  }
> = {
  en_lista: {
    label: 'En Lista',
    color: 'text-primary dark:text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/15',
    icon: Clock,
  },
  notificado: {
    label: 'Notificado',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
    icon: Bell,
  },
  aceptado: {
    label: 'Aceptado',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-950',
    icon: CheckCircle2,
  },
  rechazado: {
    label: 'Rechazado',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: AlertCircle,
  },
}

function normalizePriority(priority?: string | null): WaitlistPriority {
  if (priority === 'high' || priority === 'urgent') return 'alta'
  if (priority === 'low') return 'baja'
  return 'media'
}

function normalizeWaitlistStatus(status?: string | null): WaitlistStatus {
  if (status === 'contacted' || status === 'following_up') return 'notificado'
  if (status === 'interested' || status === 'enrolling' || status === 'enrolled') return 'aceptado'
  if (status === 'discarded' || status === 'not_interested' || status === 'unreachable') return 'rechazado'
  return 'en_lista'
}

function shouldIncludeLeadInWaitlist(lead: LeadRow): boolean {
  if (lead.lead_type === 'waiting_list') return true
  if (lead.status === 'on_hold') return true
  if ((lead.source_form ?? '').toLowerCase().includes('lista')) return true
  return false
}

function mapLeadToWaitlistRow(lead: LeadRow, index: number): WaitlistRow {
  const nombre = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || lead.email || `Lead #${lead.id}`
  const fechaEntrada = lead.created_at ?? lead.createdAt ?? new Date().toISOString()
  const prioridad = normalizePriority(lead.priority)
  const estado = normalizeWaitlistStatus(lead.status)

  return {
    id: String(lead.id),
    posicion: index + 1,
    alumno: {
      nombre,
      email: lead.email ?? 'Sin email',
      telefono: lead.phone ?? 'Sin telefono',
    },
    origen: lead.source_form || lead.lead_type || 'web_waitlist',
    curso: lead.source_form || lead.campaign_code || 'Curso sin especificar',
    tipo: lead.lead_type === 'inscripcion' ? 'Ciclo Superior' : 'Curso',
    convocatoria: lead.campaign_code || 'Sin convocatoria',
    sede: lead.source_page || 'Campus principal',
    prioridad,
    estado,
    fechaEntrada,
    plazasDelante: Math.max(index, 0),
    interesadosActuales: 1,
    umbralApertura: 8,
    asesor: lead.assigned_to_id ? `Asesor #${lead.assigned_to_id}` : 'Sin asignar',
    ultimoContacto: lead.last_contacted_at ?? null,
  }
}

async function fetchAllLeadsForWaitlist(limitPerPage = 200): Promise<LeadRow[]> {
  const allLeads: LeadRow[] = []
  let page = 1
  let hasNextPage = true
  let guard = 0

  while (hasNextPage && guard < 50) {
    const res = await fetch(`/api/leads?limit=${limitPerPage}&page=${page}`, { cache: 'no-store' })
    if (res.status === 401) {
      throw new Error('AUTH_REQUIRED')
    }
    if (!res.ok) {
      throw new Error('No se pudo cargar la lista de espera')
    }

    const payload = await res.json()
    const docs = Array.isArray(payload?.docs) ? payload.docs : []
    allLeads.push(...docs)

    hasNextPage = Boolean(payload?.hasNextPage)
    page += 1
    guard += 1
  }

  return allLeads
}

export default function ListaEsperaPage() {
  const router = useRouter()
  const [listaEsperaData, setListaEsperaData] = useState<WaitlistRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [prioridadFilter, setPrioridadFilter] = useState('todas')
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ first_name: '', last_name: '', email: '', phone: '' })

  useEffect(() => {
    let cancelled = false

    const loadWaitlist = async () => {
      try {
        setLoadError(null)
        const docs = await fetchAllLeadsForWaitlist(200)
        const waitlistLeads = docs.filter(shouldIncludeLeadInWaitlist)
        const mapped = waitlistLeads.map((lead: LeadRow, index: number) => mapLeadToWaitlistRow(lead, index))

        if (!cancelled) setListaEsperaData(mapped)
      } catch (error) {
        if (!cancelled) {
          if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
            router.push('/auth/login?redirect=/dashboard/lista-espera')
            return
          }
          setListaEsperaData([])
          setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la lista de espera')
        }
      }
    }

    void loadWaitlist()
    return () => {
      cancelled = true
    }
  }, [reloadToken, router])

  const availableSedes = useMemo(
    () => Array.from(new Set(listaEsperaData.map((row) => row.sede))).sort(),
    [listaEsperaData],
  )

  const filteredLista = listaEsperaData.filter((item) => {
    const matchesSearch =
      item.alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alumno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.curso.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = estadoFilter === 'todos' || item.estado === estadoFilter
    const matchesPrioridad = prioridadFilter === 'todas' || item.prioridad === prioridadFilter
    const matchesSede = sedeFilter === 'todas' || item.sede === sedeFilter
    return matchesSearch && matchesEstado && matchesPrioridad && matchesSede
  })

  const stats = {
    total: listaEsperaData.length,
    enLista: listaEsperaData.filter((i) => i.estado === 'en_lista').length,
    notificados: listaEsperaData.filter((i) => i.estado === 'notificado').length,
    aceptados: listaEsperaData.filter((i) => i.estado === 'aceptado').length,
    altaPrioridad: listaEsperaData.filter((i) => i.prioridad === 'alta' && i.estado === 'en_lista').length,
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const pendingActions = {
    respuestasPendientes: listaEsperaData.filter((i) => i.estado === 'notificado').length,
    altaPrioridad: stats.altaPrioridad,
    sinContactar: listaEsperaData.filter((i) => {
      if (i.ultimoContacto) return false
      return new Date(i.fechaEntrada).getTime() < sevenDaysAgo
    }).length,
  }

  return (
    <DashboardListingLayout
      title="Lista de espera"
      icon={ListTodo}
      actions={
        <ListingActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const columns: ExportColumn<(typeof filteredLista)[number]>[] = [
                { header: 'Alumno', getValue: (row) => row.alumno.nombre },
                { header: 'Email', getValue: (row) => row.alumno.email },
                { header: 'Curso', getValue: (row) => row.curso },
                { header: 'Sede', getValue: (row) => row.sede },
                { header: 'Estado', getValue: (row) => row.estado },
              ]
              downloadCsv(`lista-espera-${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredLista)
            }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Añadir</span>
          </Button>
        </ListingActions>
      }
      toolbar={
      <DashboardToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, email o curso..."
        filters={
          <>
            <Select value={estadoFilter} onValueChange={setEstadoFilter} data-oid="7dgx4rv">
              <SelectTrigger className="w-full min-w-0" data-oid="yu3j8f.">
                <SelectValue placeholder="Estado" data-oid="93sn777" />
              </SelectTrigger>
              <SelectContent data-oid="uk41dlm">
                <SelectItem value="todos" data-oid="1z3wl.h">Todos</SelectItem>
                <SelectItem value="en_lista" data-oid="1bbxr.w">En Lista</SelectItem>
                <SelectItem value="notificado" data-oid="znz2144">Notificado</SelectItem>
                <SelectItem value="aceptado" data-oid="_xpvgfl">Aceptado</SelectItem>
                <SelectItem value="rechazado" data-oid="dy2.e:c">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioridadFilter} onValueChange={setPrioridadFilter} data-oid="s1r.oqf">
              <SelectTrigger className="w-full min-w-0" data-oid=".fs52rt">
                <SelectValue placeholder="Prioridad" data-oid="p1zkq3g" />
              </SelectTrigger>
              <SelectContent data-oid="j5qs2rf">
                <SelectItem value="todas" data-oid="tueztim">Todas</SelectItem>
                <SelectItem value="alta" data-oid="euf7x6n">Alta</SelectItem>
                <SelectItem value="media" data-oid="6oc_pni">Media</SelectItem>
                <SelectItem value="baja" data-oid="iitzv:a">Baja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sedeFilter} onValueChange={setSedeFilter} data-oid="4o6lea0">
              <SelectTrigger className="w-full min-w-0" data-oid="xh4o4t2">
                <SelectValue placeholder="Sede" data-oid="e2qqst:" />
              </SelectTrigger>
              <SelectContent data-oid=".0v:swn">
                <SelectItem value="todas" data-oid="zh40-t-">Todas</SelectItem>
                {availableSedes.map((sede) => (
                  <SelectItem key={sede} value={sede}>
                    {sede}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
      }
    >
      {loadError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <ListingColumnBoard columns={WAITLIST_LIST_COLUMNS}>
        {filteredLista.length === 0 ? (
          <Card className="px-3 py-10 text-center text-sm text-muted-foreground">
            No hay registros en lista de espera.
          </Card>
        ) : (
          filteredLista.map((item) => {
            const prioridadInfo = prioridadConfig[item.prioridad]
            const estadoInfo = estadoConfig[item.estado]
            const StatusIcon = estadoInfo.icon
            return (
              <ListingColumnCard
                key={item.id}
                columns={WAITLIST_LIST_COLUMNS}
                onClick={() => router.push(`/inscripciones/${item.id}`)}
                cells={[
                  <div
                    key="posicion"
                    className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold"
                  >
                    {item.posicion}
                  </div>,
                  <div key="alumno" className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.alumno.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.alumno.email}</p>
                  </div>,
                  <div key="origen" className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.curso}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.origen}</p>
                  </div>,
                  <div key="convocatoria" className="min-w-0">
                    <p className="truncate text-sm">{item.convocatoria}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.sede}</p>
                  </div>,
                  <Badge key="prioridad" variant="static" className={`${prioridadInfo.bgColor} ${prioridadInfo.color}`}>
                    {item.prioridad === 'alta' ? <ArrowUp className="mr-1 h-3 w-3" /> : null}
                    {item.prioridad === 'baja' ? <ArrowDown className="mr-1 h-3 w-3" /> : null}
                    {prioridadInfo.label}
                  </Badge>,
                  <span key="interesados" className="text-sm">
                    {item.interesadosActuales}
                    <span className="ml-1 text-xs text-muted-foreground">/ {item.umbralApertura}</span>
                  </span>,
                  <Badge
                    key="estado"
                    variant="static"
                    className={`${estadoInfo.bgColor} ${estadoInfo.color} flex w-fit items-center gap-1`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {estadoInfo.label}
                  </Badge>,
                  <div key="acciones" className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/inscripciones/${item.id}`)}
                    >
                      Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/inscripciones/${item.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver ficha
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Proponer apertura
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/leads/${item.id}`)}>
                          <ArrowUp className="mr-2 h-4 w-4" />
                          Convertir a lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/inscripciones/${item.id}`)}>
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Iniciar matriculación
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>,
                ]}
              />
            )
          })
        )}
      </ListingColumnBoard>

      <div className="grid gap-4 md:grid-cols-2" data-oid="-fsza4.">
        <Card data-oid="wsxsr4v">
          <CardHeader data-oid="7k9vrk4">
            <CardTitle className="text-base" data-oid="04kaony">Cursos con Mayor Demanda</CardTitle>
            <CardDescription data-oid="he_rmkp">Cursos con más personas en lista de espera</CardDescription>
          </CardHeader>
          <CardContent data-oid="88ao7d1">
            <div className="space-y-3" data-oid="4pkb-bt">
              {Object.entries(
                filteredLista.reduce<Record<string, number>>((acc, item) => {
                  acc[item.curso] = (acc[item.curso] ?? 0) + 1
                  return acc
                }, {}),
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([curso, espera]) => (
                  <div key={curso} className="flex items-center justify-between p-2 rounded-lg bg-muted/50" data-oid="ofe0fqq">
                    <span className="font-medium text-sm" data-oid="hc713:3">{curso}</span>
                    <Badge variant="outline" data-oid="lxpus-9">{espera} en espera</Badge>
                  </div>
                ))}
              {filteredLista.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin demanda registrada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="3i59pzg">
          <CardHeader data-oid=".f.9.5n">
            <CardTitle className="text-base" data-oid="u06gd2d">Acciones Pendientes</CardTitle>
            <CardDescription data-oid="0.3op8h">Tareas que requieren atención</CardDescription>
          </CardHeader>
          <CardContent data-oid="a:zz0g.">
            <div className="space-y-3" data-oid="dykd4q3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50" data-oid="u:935j9">
                <Bell className="h-5 w-5 text-amber-600 mt-0.5" data-oid="92gy5ub" />
                <div data-oid="qprq1wr">
                  <p className="font-medium text-amber-900" data-oid="pbggvth">
                    {pendingActions.respuestasPendientes} respuesta{pendingActions.respuestasPendientes === 1 ? '' : 's'} pendiente{pendingActions.respuestasPendientes === 1 ? '' : 's'}
                  </p>
                  <p className="text-sm text-amber-800" data-oid="f9ua:tu">
                    Leads notificados pendientes de confirmación.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50" data-oid="y8rijo5">
                <ArrowUp className="h-5 w-5 text-red-600 mt-0.5" data-oid="hz21yhu" />
                <div data-oid="dll2ptc">
                  <p className="font-medium text-red-900" data-oid="9.ujz6l">
                    {pendingActions.altaPrioridad} alta prioridad
                  </p>
                  <p className="text-sm text-red-800" data-oid="h31d47o">
                    Registros en lista con prioridad crítica.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/10" data-oid="_o1gwur">
                <CalendarClock className="h-5 w-5 text-primary mt-0.5" data-oid="xh2hdb2" />
                <div data-oid="4s8:adp">
                  <p className="font-medium text-primary" data-oid="v0gg-g1">
                    {pendingActions.sinContactar} sin contactar
                  </p>
                  <p className="text-sm text-primary" data-oid="jwe_d15">
                    Sin contacto en más de 7 días desde su entrada.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir a lista de espera</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nombre"
              value={createForm.first_name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, first_name: event.target.value }))}
            />
            <Input
              placeholder="Apellidos"
              value={createForm.last_name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, last_name: event.target.value }))}
            />
            <Input
              placeholder="Email"
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <Input
              placeholder="Teléfono"
              value={createForm.phone}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              disabled={creating}
              onClick={() => {
                void (async () => {
                  setCreating(true)
                  try {
                    const response = await fetch('/api/leads', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...createForm,
                        lead_type: 'waiting_list',
                        source_form: 'web_waitlist',
                      }),
                    })
                    if (!response.ok) throw new Error('No se pudo añadir')
                    setCreateOpen(false)
                    setCreateForm({ first_name: '', last_name: '', email: '', phone: '' })
                    setReloadToken((current) => current + 1)
                  } catch (error) {
                    setLoadError(error instanceof Error ? error.message : 'No se pudo añadir')
                  } finally {
                    setCreating(false)
                  }
                })()
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardListingLayout>
  )
}
