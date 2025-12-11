'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
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
import { Plus, MoreHorizontal, Eye, Edit, Trash2, Users, Briefcase, MapPin, LayoutGrid, List } from 'lucide-react'
import { StaffCard } from '@payload-config/components/ui/StaffCard'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@payload-config/components/ui/toggle-group'

interface StaffMember {
  id: number
  fullName: string
  staffType: 'profesor' | 'administrativo'
  position: string
  contractType: string
  employmentStatus: string
  photo: string
  email: string
  phone: string
  bio?: string
  assignedCampuses: Array<{ id: number; name: string; city: string }>
  isActive: boolean
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

export default function PersonalPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState('profesores')
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('grid')
  const [staff, setStaff] = React.useState<StaffMember[]>([])
  const [loading, setLoading] = React.useState(true)

  // Fetch staff data
  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const staffType = activeTab === 'profesores' ? 'profesor' : 'administrativo'
        const response = await fetch(`/api/staff?type=${staffType}&limit=100`)
        const result = await response.json()

        if (result.success) {
          setStaff(result.data || [])
        } else {
          console.error('Error fetching staff:', result.error)
        }
      } catch (error) {
        console.error('Error fetching staff:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [activeTab])

  const handleViewDetail = (id: number) => {
    router.push(`/personal/${id}`)
  }

  const handleEdit = (id: number) => {
    router.push(`/personal/${id}/editar`)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Está seguro de desactivar a ${name}?`)) return

    try {
      const response = await fetch(`/api/staff?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Refresh list
        setStaff(staff.filter((s) => s.id !== id))
        alert('Personal desactivado exitosamente')
      } else {
        alert(`Error: ${result.error}`)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Personal</h1>
          <p className="text-muted-foreground">
            Gestión de profesores y personal administrativo
          </p>
        </div>

        <Button onClick={() => router.push('/personal/nuevo')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Miembro
        </Button>
      </div>

      {/* Tabs with View Mode Toggle */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="profesores">
              <Users className="mr-2 h-4 w-4" />
              Profesores
            </TabsTrigger>
            <TabsTrigger value="administrativos">
              <Briefcase className="mr-2 h-4 w-4" />
              Administrativos
            </TabsTrigger>
          </TabsList>

          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'list' | 'grid')}>
            <ToggleGroupItem value="grid" aria-label="Vista de tarjetas">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista de lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Profesores Tab */}
        <TabsContent value="profesores">
          <Card>
            <CardHeader>
              <CardTitle>Profesores</CardTitle>
              <CardDescription>
                Personal docente del centro ({staff.length} profesores)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando profesores...</p>
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay profesores registrados</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map((member) => (
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
                    />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Sedes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleViewDetail(member.id)}
                      >
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.photo} alt={member.fullName} />
                            <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{member.position}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CONTRACT_TYPE_LABELS[member.contractType] || member.contractType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {member.assignedCampuses.map((campus) => (
                              <Badge key={campus.id} variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {campus.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[member.employmentStatus]}>
                            {STATUS_LABELS[member.employmentStatus] || member.employmentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetail(member.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(member.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id, member.fullName)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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

        {/* Administrativos Tab */}
        <TabsContent value="administrativos">
          <Card>
            <CardHeader>
              <CardTitle>Personal Administrativo</CardTitle>
              <CardDescription>
                Personal de administración y gestión ({staff.length} personas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando personal...</p>
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay personal administrativo registrado</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map((member) => (
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
                    />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleViewDetail(member.id)}
                      >
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.photo} alt={member.fullName} />
                            <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{member.position}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CONTRACT_TYPE_LABELS[member.contractType] || member.contractType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {member.assignedCampuses.map((campus) => (
                              <Badge key={campus.id} variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {campus.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[member.employmentStatus]}>
                            {STATUS_LABELS[member.employmentStatus] || member.employmentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetail(member.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(member.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id, member.fullName)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
