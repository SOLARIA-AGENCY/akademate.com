'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Briefcase,
  MapPin,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react'
import { Input } from '@payload-config/components/ui/input'
import { StaffCard } from '@payload-config/components/ui/StaffCard'
import { ToggleGroup, ToggleGroupItem } from '@payload-config/components/ui/toggle-group'
import { EmptyState } from '@payload-config/components/ui/EmptyState'

interface StaffMember {
  id: number
  fullName: string
  staffType: 'profesor' | 'administrativo' | 'jefatura_administracion' | 'academico'
  position: string
  contractType: string
  employmentStatus: string
  photo: string
  email: string
  phone: string
  bio?: string
  assignedCampuses: { id: number; name: string; city: string }[]
  isActive: boolean
}

interface StaffApiResponse {
  success: boolean
  data?: StaffMember[]
  error?: string
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  freelance: 'Freelance',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  temporary_leave: 'Baja Temporal',
  inactive: 'Inactivo',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  temporary_leave: 'secondary',
  inactive: 'destructive',
}

function PersonalPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = React.useState('profesores')
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('grid')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [staff, setStaff] = React.useState<StaffMember[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const requestedTab = searchParams.get('tab')
    if (requestedTab === 'administrativos' || requestedTab === 'profesores') {
      setActiveTab(requestedTab)
    }
  }, [searchParams])

  // Fetch staff data
  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const staffType = activeTab === 'profesores' ? 'profesor' : 'administrativo'
        const response = await fetch(`/api/staff?type=${staffType}&limit=100`)
        const result = (await response.json()) as StaffApiResponse

        if (result.success) {
          const allowedTypes =
            activeTab === 'profesores'
              ? new Set(['profesor', 'academico'])
              : new Set(['administrativo', 'jefatura_administracion'])
          setStaff((result.data ?? []).filter((member) => allowedTypes.has(member.staffType)))
        } else {
          console.error('Error fetching staff:', result.error)
        }
      } catch (error) {
        console.error('Error fetching staff:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchStaff()
  }, [activeTab])

  const filteredStaff = staff.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewDetail = (id: number) => {
    if (activeTab === 'profesores') {
      router.push(`/profesores/${id}`)
      return
    }
    router.push(`/administrativo/${id}`)
  }

  const handleEdit = (id: number) => {
    if (activeTab === 'profesores') {
      router.push(`/profesores/${id}/editar`)
      return
    }
    router.push(`/administrativo/${id}/editar`)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Está seguro de desactivar a ${name}?`)) return

    try {
      const response = await fetch(`/api/staff?id=${id}`, {
        method: 'DELETE',
      })

      const result = (await response.json()) as StaffApiResponse

      if (result.success) {
        // Refresh list
        setStaff(staff.filter((s) => s.id !== id))
        alert('Personal desactivado exitosamente')
      } else {
        alert(`Error: ${result.error ?? 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Error de conexión al eliminar personal')
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-6" data-oid="42ltni0">
      <Tabs value={activeTab} onValueChange={setActiveTab} data-oid="54ch-hn">
        <PageHeader
          title="Personal"
          description="Gestión de profesorado y equipo administrativo."
          icon={Users}
          badge={
            <Badge variant="secondary" data-oid="qavqrr-">
              {filteredStaff.length} en vista
            </Badge>
          }
          actions={
            <Button
              onClick={() =>
                router.push(activeTab === 'profesores' ? '/profesores/nuevo' : '/administrativo/nuevo')
              }
              data-oid="o1k9qim"
            >
              <Plus className="mr-2 h-4 w-4" data-oid="ve7zz:n" />
              {activeTab === 'profesores' ? 'Añadir Profesor' : 'Añadir Administrativo'}
            </Button>
          }
          filters={
            <div
              className="flex w-full flex-wrap items-center justify-between gap-3"
              data-oid="qa7_l4e"
            >
              {staff.length > 0 && (
                <div className="relative w-64" data-oid=".lj1q2:">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    data-oid="o019w3h"
                  />
                  <Input
                    placeholder="Buscar por nombre..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    data-oid="hlze4bs"
                  />
                </div>
              )}
              <TabsList data-oid="gm79umr">
                <TabsTrigger value="profesores" data-oid="vjkz_n2">
                  <Users className="mr-2 h-4 w-4" data-oid="vn:4jyh" />
                  Profesores
                </TabsTrigger>
                <TabsTrigger value="administrativos" data-oid=":z:8bq3">
                  <Briefcase className="mr-2 h-4 w-4" data-oid="5wxsguk" />
                  Administrativos
                </TabsTrigger>
              </TabsList>

              {staff.length > 0 && (
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value: string) => {
                    if (value === 'list' || value === 'grid') setViewMode(value)
                  }}
                  data-oid="t3liuqt"
                >
                  <ToggleGroupItem value="grid" aria-label="Vista de tarjetas" data-oid="p:6p7cb">
                    <LayoutGrid className="h-4 w-4" data-oid="pekzrs0" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="Vista de lista" data-oid="le9slld">
                    <List className="h-4 w-4" data-oid="unanepf" />
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </div>
          }
          data-oid="lxq--yw"
        />

        <TabsContent value="profesores" data-oid="oq-9g8t">
          <Card data-oid="auipqq.">
            <CardContent className="pt-6" data-oid="16j-5gg">
              {loading ? (
                <div className="text-center py-8" data-oid=".xtrb_l">
                  <p className="text-muted-foreground" data-oid="nqu9jo0">
                    Cargando profesores...
                  </p>
                </div>
              ) : staff.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Aún no hay profesores"
                  description="Añade tu primer profesor para gestionar el equipo docente."
                  action={{
                    label: '+ Añadir Profesor',
                    onClick: () => router.push('/profesores/nuevo'),
                  }}
                />
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground" data-oid="3a3w.w-">
                  Sin resultados para &ldquo;{searchTerm}&rdquo;
                </div>
              ) : viewMode === 'grid' ? (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  data-oid="pi09vlc"
                >
                  {filteredStaff.map((member) => (
                    <StaffCard
                      key={member.id}
                      id={member.id}
                      fullName={member.fullName}
                      position={member.position}
                      contractType={member.contractType}
                      employmentStatus={member.employmentStatus}
                      photo={member.photo}
                      email={member.email}
                      phone={member.phone}
                      bio={member.bio}
                      assignedCampuses={member.assignedCampuses}
                      onView={handleViewDetail}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      data-oid="sa54-rh"
                    />
                  ))}
                </div>
              ) : (
                <Table data-oid="kn_u0i3">
                  <TableHeader data-oid="eetu3qb">
                    <TableRow data-oid="qnty0_3">
                      <TableHead className="w-12" data-oid="aisipqm"></TableHead>
                      <TableHead data-oid="cznag55">Nombre</TableHead>
                      <TableHead data-oid="g77_b3x">Cargo</TableHead>
                      <TableHead data-oid="ni42ued">Contrato</TableHead>
                      <TableHead data-oid="xqi7c4p">Sedes</TableHead>
                      <TableHead data-oid="7v_6x_2">Estado</TableHead>
                      <TableHead className="w-12" data-oid="zy6f3vt"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-oid="0od-fqu">
                    {filteredStaff.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleViewDetail(member.id)}
                        data-oid="rj0.rty"
                      >
                        <TableCell data-oid="q68ixpu">
                          <Avatar className="h-10 w-10" data-oid="s2q1s34">
                            <AvatarImage
                              src={member.photo}
                              alt={member.fullName}
                              data-oid="u8y4jco"
                            />
                            <AvatarFallback data-oid="98svq64">
                              {getInitials(member.fullName)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell data-oid="ex45.m4">
                          <div data-oid="lpz.7.e">
                            <div className="font-medium" data-oid="szd.tt3">
                              {member.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground" data-oid="rbifo:8">
                              {member.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-oid="7g15upt">{member.position}</TableCell>
                        <TableCell data-oid="2au8fz:">
                          <Badge variant="outline" data-oid=":_jltu9">
                            {CONTRACT_TYPE_LABELS[member.contractType] ?? member.contractType}
                          </Badge>
                        </TableCell>
                        <TableCell data-oid="l4ywjdb">
                          <div className="flex gap-1 flex-wrap" data-oid="430_dsj">
                            {member.assignedCampuses.map((campus) => (
                              <Badge
                                key={campus.id}
                                variant="secondary"
                                className="text-xs"
                                data-oid="8b-e5ak"
                              >
                                <MapPin className="h-3 w-3 mr-1" data-oid="u8rd37u" />
                                {campus.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell data-oid="axm3pj-">
                          <Badge
                            variant={STATUS_VARIANTS[member.employmentStatus]}
                            data-oid="pki9dk3"
                          >
                            {STATUS_LABELS[member.employmentStatus] ?? member.employmentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          data-oid="63gmgfi"
                        >
                          <DropdownMenu data-oid="ohut-q4">
                            <DropdownMenuTrigger asChild data-oid="ocgqcs7">
                              <Button variant="ghost" className="h-8 w-8 p-0" data-oid=":74rfty">
                                <span className="sr-only" data-oid="tuk3muc">
                                  Abrir menú
                                </span>
                                <MoreHorizontal className="h-4 w-4" data-oid="ihrv-8o" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" data-oid="2mctn-l">
                              <DropdownMenuLabel data-oid="kxk919m">Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator data-oid="m8drjiz" />
                              <DropdownMenuItem
                                onClick={() => handleViewDetail(member.id)}
                                data-oid="0x9ssp0"
                              >
                                <Eye className="mr-2 h-4 w-4" data-oid="lefb79w" />
                                Ver Detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(member.id)}
                                data-oid="t6nlfrn"
                              >
                                <Edit className="mr-2 h-4 w-4" data-oid="ca6hy4g" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator data-oid="x6450.2" />
                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id, member.fullName)}
                                className="text-destructive"
                                data-oid="hrsftit"
                              >
                                <Trash2 className="mr-2 h-4 w-4" data-oid="8pbbpp9" />
                                Desactivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="administrativos" data-oid="p6yzr_a">
          <Card data-oid="-j88tkq">
            <CardContent className="pt-6" data-oid="11gdcrt">
              {loading ? (
                <div className="text-center py-8" data-oid="zkb7zb6">
                  <p className="text-muted-foreground" data-oid="sbdmj32">
                    Cargando personal...
                  </p>
                </div>
              ) : staff.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="Aún no hay administrativos"
                  description="Añade tu primer miembro del equipo administrativo."
                  action={{
                    label: '+ Añadir Administrativo',
                    onClick: () => router.push('/administrativo/nuevo'),
                  }}
                />
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground" data-oid="g_4-sx5">
                  Sin resultados para &ldquo;{searchTerm}&rdquo;
                </div>
              ) : viewMode === 'grid' ? (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  data-oid="0v-w4x7"
                >
                  {filteredStaff.map((member) => (
                    <StaffCard
                      key={member.id}
                      id={member.id}
                      fullName={member.fullName}
                      position={member.position}
                      contractType={member.contractType}
                      employmentStatus={member.employmentStatus}
                      photo={member.photo}
                      email={member.email}
                      phone={member.phone}
                      bio={member.bio}
                      assignedCampuses={member.assignedCampuses}
                      onView={handleViewDetail}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      data-oid="11523jp"
                    />
                  ))}
                </div>
              ) : (
                <Table data-oid="ztkorn7">
                  <TableHeader data-oid="-z:mrfl">
                    <TableRow data-oid="uo5vmqo">
                      <TableHead className="w-12" data-oid="73_.ppb"></TableHead>
                      <TableHead data-oid="op16-gu">Nombre</TableHead>
                      <TableHead data-oid="4_z7:il">Cargo</TableHead>
                      <TableHead data-oid="k4xtxm2">Contrato</TableHead>
                      <TableHead data-oid="9vrkzzy">Sede</TableHead>
                      <TableHead data-oid="hqndg:x">Estado</TableHead>
                      <TableHead className="w-12" data-oid="q5k.cms"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-oid="3rrgzvp">
                    {filteredStaff.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleViewDetail(member.id)}
                        data-oid=":jxu3pk"
                      >
                        <TableCell data-oid="68u9li3">
                          <Avatar className="h-10 w-10" data-oid="dy9umrj">
                            <AvatarImage
                              src={member.photo}
                              alt={member.fullName}
                              data-oid="i.h5jmh"
                            />
                            <AvatarFallback data-oid=":jj-ga5">
                              {getInitials(member.fullName)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell data-oid="93_frps">
                          <div data-oid="oto6mnv">
                            <div className="font-medium" data-oid="2172yx:">
                              {member.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground" data-oid="d:nlaia">
                              {member.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-oid="c:4:_9p">{member.position}</TableCell>
                        <TableCell data-oid="5.exyol">
                          <Badge variant="outline" data-oid="gt8:7_3">
                            {CONTRACT_TYPE_LABELS[member.contractType] ?? member.contractType}
                          </Badge>
                        </TableCell>
                        <TableCell data-oid="4s2qwlo">
                          <div className="flex gap-1 flex-wrap" data-oid="1ybys1o">
                            {member.assignedCampuses.map((campus) => (
                              <Badge
                                key={campus.id}
                                variant="secondary"
                                className="text-xs"
                                data-oid="gh93mv2"
                              >
                                <MapPin className="h-3 w-3 mr-1" data-oid="6xnpcm4" />
                                {campus.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell data-oid="bxa7ydw">
                          <Badge
                            variant={STATUS_VARIANTS[member.employmentStatus]}
                            data-oid="gvya5oe"
                          >
                            {STATUS_LABELS[member.employmentStatus] ?? member.employmentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          data-oid=":aj_8s0"
                        >
                          <DropdownMenu data-oid="w-hqrj.">
                            <DropdownMenuTrigger asChild data-oid="hxif1i1">
                              <Button variant="ghost" className="h-8 w-8 p-0" data-oid="-ex2y84">
                                <span className="sr-only" data-oid="r264vth">
                                  Abrir menú
                                </span>
                                <MoreHorizontal className="h-4 w-4" data-oid="g_e2xem" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" data-oid="5fmzn8e">
                              <DropdownMenuLabel data-oid="c3rar4y">Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator data-oid="rfhjn89" />
                              <DropdownMenuItem
                                onClick={() => handleViewDetail(member.id)}
                                data-oid="0lhnpiq"
                              >
                                <Eye className="mr-2 h-4 w-4" data-oid="0.y-v49" />
                                Ver Detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(member.id)}
                                data-oid="hkgp01p"
                              >
                                <Edit className="mr-2 h-4 w-4" data-oid="-s1223o" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator data-oid="m_048j." />
                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id, member.fullName)}
                                className="text-destructive"
                                data-oid="i228.eg"
                              >
                                <Trash2 className="mr-2 h-4 w-4" data-oid="sa84m:_" />
                                Desactivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function PersonalPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6" data-oid="m1c.ljz">
          <div className="flex items-start justify-between" data-oid="-6y:mh5">
            <div className="space-y-1" data-oid="2pwh1-t">
              <h1 className="text-3xl font-bold tracking-tight" data-oid="8bkv3k4">
                Personal
              </h1>
              <p className="text-muted-foreground" data-oid="ynbsfjl">
                Cargando datos de personal...
              </p>
            </div>
          </div>
        </div>
      }
      data-oid="6dlx:04"
    >
      <PersonalPageContent data-oid="cdvfy_l" />
    </React.Suspense>
  )
}
