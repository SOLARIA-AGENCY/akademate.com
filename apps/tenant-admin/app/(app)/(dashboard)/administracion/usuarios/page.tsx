'use client'

import { useEffect, useMemo, useState } from 'react'
import { Send, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@payload-config/components/ui/empty'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { ListingKpiStrip } from '@payload-config/components/ui/listing-kpi'
import { StatusDotBadge } from '@payload-config/components/ui/listing-pills'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  ListingSearch,
  PremiumDirectoryShell,
} from '@payload-config/components/directory/PremiumDirectoryShell'
import { PRESENCE_LABEL, presenceFromTimestamps } from '@/src/domain/dashboard-presence'

interface UsuarioData {
  id: string
  nombre: string
  email: string
  rol: string
  cargo: string
  activo: boolean
  verificado: boolean
  ultimoAcceso: string | null
  lastSeenAt: string | null
  avatarUrl: string | null
  fechaCreacion: string
}

const ROLE_MAP: Record<string, string> = {
  superadmin: 'Admin',
  admin: 'Admin',
  gestor: 'Gestor',
  marketing: 'Marketing',
  asesor: 'Asesor',
  lectura: 'Lectura',
}

function presenceOf(usuario: UsuarioData) {
  if (!usuario.verificado) return 'pending' as const
  return presenceFromTimestamps(usuario.lastSeenAt, usuario.ultimoAcceso)
}

function presenceTone(presence: ReturnType<typeof presenceOf>): 'success' | 'warning' | 'info' | 'neutral' {
  if (presence === 'online') return 'success'
  if (presence === 'idle') return 'warning'
  if (presence === 'pending') return 'info'
  return 'neutral'
}

function initialsOf(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '—'
  )
}

function downloadTeamCsv(rows: UsuarioData[]) {
  const header = ['Nombre', 'Email', 'Cargo', 'Permiso', 'Presencia', 'Alta']
  const body = rows.map((user) => [
    user.nombre,
    user.email,
    user.cargo,
    user.rol,
    PRESENCE_LABEL[presenceOf(user)],
    user.fechaCreacion,
  ])
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `equipo-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [rolFilter, setRolFilter] = useState('todos')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [usuariosData, setUsuariosData] = useState<UsuarioData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState('lectura')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const fetchAll = async () => {
    setListError('')
    try {
      const res = await fetch('/api/internal/users', { cache: 'no-cache' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setListError(typeof data.error === 'string' ? data.error : 'No se pudieron cargar los usuarios')
        setUsuariosData([])
        return
      }
      const users = (data.users || []).map((u: Record<string, unknown>) => ({
        id: String(u.id),
        nombre: (u.name as string) || 'Sin nombre',
        email: (u.email as string) || '',
        rol: ROLE_MAP[(u.role as string) || 'lectura'] || 'Lectura',
        cargo: ROLE_MAP[(u.role as string) || 'lectura'] || 'Lectura',
        activo: (u.is_active as boolean) !== false,
        verificado: true,
        ultimoAcceso: (u.last_login_at as string) || null,
        lastSeenAt: (u.last_seen_at as string) || null,
        avatarUrl: (u.avatar_url as string) || null,
        fechaCreacion: (u.createdAt as string) || '',
      }))
      const invitations = (data.invitations || []).map((inv: Record<string, unknown>) => ({
        id: String(inv.id),
        nombre: (inv.name as string) || 'Sin nombre',
        email: (inv.email as string) || '',
        rol: ROLE_MAP[(inv.role as string) || 'lectura'] || 'Lectura',
        cargo: ROLE_MAP[(inv.role as string) || 'lectura'] || 'Lectura',
        activo: false,
        verificado: false,
        ultimoAcceso: null,
        lastSeenAt: null,
        avatarUrl: null,
        fechaCreacion: (inv.createdAt as string) || '',
      }))
      setUsuariosData([...users, ...invitations])
    } catch {
      setListError('No se pudieron cargar los usuarios')
      setUsuariosData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchAll()
  }, [])

  const handleCreateUser = async () => {
    if (!formEmail.trim()) {
      setCreateError('El email es obligatorio')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/internal/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim() || formEmail.trim(),
          email: formEmail,
          role: formRole,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setFormName('')
        setFormEmail('')
        setFormRole('lectura')
        void fetchAll()
      } else {
        setCreateError(data.error || 'Error al enviar invitacion')
      }
    } catch {
      setCreateError('Error de conexion')
    } finally {
      setCreating(false)
    }
  }

  const filteredUsuarios = usuariosData.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRol = rolFilter === 'todos' || usuario.rol === rolFilter
    const presence = presenceOf(usuario)
    const matchesEstado =
      estadoFilter === 'todos' ||
      (estadoFilter === 'online' && presence === 'online') ||
      (estadoFilter === 'idle' && presence === 'idle') ||
      (estadoFilter === 'offline' && presence === 'offline') ||
      (estadoFilter === 'pending' && presence === 'pending')
    return matchesSearch && matchesRol && matchesEstado
  })

  const kpis = useMemo(() => {
    const online = usuariosData.filter((row) => presenceOf(row) === 'online').length
    const pending = usuariosData.filter((row) => !row.verificado).length
    return [
      { label: 'Miembros', value: String(usuariosData.length) },
      { label: 'En línea', value: String(online) },
      { label: 'Invitaciones', value: String(pending) },
    ]
  }, [usuariosData])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Equipo del dashboard"
        icon={Users}
        actions={
          <Button size="sm" variant="outline" onClick={() => downloadTeamCsv(filteredUsuarios)}>
            CSV
          </Button>
        }
      />
      <ListingKpiStrip items={kpis} />

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium">Invitar al equipo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2 p-4 pt-0">
          <div className="grid min-w-[10rem] flex-1 gap-1">
            <Label htmlFor="invite-name">Nombre</Label>
            <Input
              id="invite-name"
              placeholder="Nombre"
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
            />
          </div>
          <div className="grid min-w-[12rem] flex-[2] gap-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="Introduce el email para invitar…"
              value={formEmail}
              onChange={(event) => setFormEmail(event.target.value)}
            />
          </div>
          <div className="grid min-w-[8rem] gap-1">
            <Label htmlFor="invite-role">Permiso</Label>
            <Select value={formRole} onValueChange={setFormRole}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="asesor">Asesor</SelectItem>
                <SelectItem value="lectura">Lectura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={() => void handleCreateUser()} disabled={creating}>
            <Send className="h-4 w-4" />
            Enviar invitación
          </Button>
          {createError ? <p className="w-full text-sm text-destructive">{createError}</p> : null}
        </CardContent>
      </Card>

      <PremiumDirectoryShell
        shortcut={false}
        search={
          <ListingSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar" />
        }
        filters={
          <>
            <Select value={rolFilter} onValueChange={setRolFilter}>
              <SelectTrigger className="h-10 w-auto">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Gestor">Gestor</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Asesor">Asesor</SelectItem>
                <SelectItem value="Lectura">Lectura</SelectItem>
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="h-10 w-auto">
                <SelectValue placeholder="Presencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="online">En línea</SelectItem>
                <SelectItem value="idle">Ausente</SelectItem>
                <SelectItem value="offline">Desconectado</SelectItem>
                <SelectItem value="pending">Invitación</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      >
        {listError ? (
          <p className="text-sm text-destructive">{listError}</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
        ) : filteredUsuarios.length === 0 ? (
          <Empty className="min-h-[16rem]" data-slot="team-members-empty">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>Aún no hay miembros</EmptyTitle>
              <EmptyDescription>
                Invita con nombre, email y permiso. Recibirán un correo para crear su contraseña.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table aria-label="Equipo del dashboard">
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Cargo y permiso</TableHead>
                <TableHead className="hidden md:table-cell">Alta</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => {
                const presence = presenceOf(usuario)
                return (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {usuario.avatarUrl ? (
                            <AvatarImage src={usuario.avatarUrl} alt={usuario.nombre} />
                          ) : null}
                          <AvatarFallback>{initialsOf(usuario.nombre)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{usuario.nombre}</p>
                          <p className="truncate text-xs text-muted-foreground md:hidden">{usuario.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="truncate">{usuario.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <span className="truncate">{usuario.cargo}</span>
                        {usuario.rol === 'Admin' ? (
                          <Badge variant="static" className="bg-emerald-600 text-white">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="static">{usuario.rol}</Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {usuario.fechaCreacion
                        ? new Date(usuario.fechaCreacion).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusDotBadge tone={presenceTone(presence)}>
                        {PRESENCE_LABEL[presence]}
                      </StatusDotBadge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </PremiumDirectoryShell>
    </div>
  )
}
