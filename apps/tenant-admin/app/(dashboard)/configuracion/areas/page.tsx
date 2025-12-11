'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { 
  Plus, 
  BookOpen, 
  Edit2, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  GraduationCap,
  ArrowRight
} from 'lucide-react'

interface Course {
  id: number
  title: string
  type: string
  active: boolean
}

interface StudyArea {
  id: number
  name: string
  code: string
  courses: Course[]
  active: boolean
  description?: string
}

export default function AreasPage() {
  const [areas, setAreas] = useState<StudyArea[]>([
    {
      id: 1,
      name: 'Marketing y Publicidad',
      code: 'MKT',
      active: true,
      description: 'Cursos de marketing digital, publicidad y gestión de redes sociales',
      courses: [
        { id: 1, title: 'Marketing Digital Avanzado', type: 'Telemático', active: true },
        { id: 2, title: 'Community Manager Profesional', type: 'Semipresencial', active: true },
        { id: 3, title: 'Publicidad en Redes Sociales', type: 'Telemático', active: true },
      ],
    },
    {
      id: 2,
      name: 'Diseño Gráfico',
      code: 'DIS',
      active: true,
      description: 'Diseño digital, branding y herramientas profesionales',
      courses: [
        { id: 4, title: 'Adobe Creative Suite', type: 'Presencial', active: true },
        { id: 5, title: 'Diseño UX/UI', type: 'Telemático', active: true },
      ],
    },
    {
      id: 3,
      name: 'Administración y Gestión',
      code: 'ADM',
      active: true,
      description: 'Gestión empresarial, contabilidad y recursos humanos',
      courses: [
        { id: 6, title: 'Contabilidad y Finanzas', type: 'Semipresencial', active: true },
        { id: 7, title: 'Gestión de RRHH', type: 'Telemático', active: true },
        { id: 8, title: 'Administración de Empresas', type: 'Presencial', active: true },
      ],
    },
    {
      id: 4,
      name: 'Informática y Tecnología',
      code: 'IT',
      active: true,
      description: 'Programación, desarrollo web y ciberseguridad',
      courses: [],
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCoursesModal, setShowCoursesModal] = useState(false)
  const [selectedArea, setSelectedArea] = useState<StudyArea | null>(null)
  const [newArea, setNewArea] = useState({ name: '', code: '', description: '' })

  const handleCreateArea = () => {
    const area: StudyArea = {
      id: areas.length + 1,
      name: newArea.name,
      code: newArea.code,
      description: newArea.description,
      courses: [],
      active: true,
    }
    setAreas([...areas, area])
    setShowCreateModal(false)
    setNewArea({ name: '', code: '', description: '' })
  }

  const handleEditArea = () => {
    if (!selectedArea) return
    setAreas(areas.map(a => a.id === selectedArea.id ? selectedArea : a))
    setShowEditModal(false)
    setSelectedArea(null)
  }

  const handleDeleteArea = () => {
    if (!selectedArea) return
    setAreas(areas.filter(a => a.id !== selectedArea.id))
    setShowDeleteModal(false)
    setSelectedArea(null)
  }

  const handleViewCourses = (area: StudyArea) => {
    setSelectedArea(area)
    setShowCoursesModal(true)
  }

  const handleEditClick = (area: StudyArea) => {
    setSelectedArea(area)
    setShowEditModal(true)
  }

  const handleDeleteClick = (area: StudyArea) => {
    setSelectedArea(area)
    setShowDeleteModal(true)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Áreas de Estudio</h1>
          <p className="text-muted-foreground">Gestiona las categorías de cursos y formación profesional</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Área
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{areas.length}</div>
            <p className="text-xs text-muted-foreground">Áreas Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{areas.filter(a => a.active).length}</div>
            <p className="text-xs text-muted-foreground">Áreas Activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {areas.reduce((sum, a) => sum + a.courses.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Cursos Asignados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{areas.filter(a => a.courses.length === 0).length}</div>
            <p className="text-xs text-muted-foreground">Áreas Sin Cursos</p>
          </CardContent>
        </Card>
      </div>

      {/* Areas List */}
      <div className="grid gap-4 md:grid-cols-2">
        {areas.map((area) => (
          <Card key={area.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {area.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Código: {area.code}</p>
                  {area.description && (
                    <p className="text-sm text-muted-foreground mt-2">{area.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {area.active ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{area.courses.length} cursos</span>
                  </div>
                  {area.courses.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewCourses(area)}
                    >
                      Ver Cursos
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewCourses(area)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalles
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditClick(area)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Crear Nueva Área de Estudio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Área</Label>
                <Input
                  id="name"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  placeholder="Ej: Marketing y Publicidad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={newArea.code}
                  onChange={(e) => setNewArea({ ...newArea, code: e.target.value.toUpperCase() })}
                  placeholder="Ej: MKT"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Input
                  id="description"
                  value={newArea.description}
                  onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                  placeholder="Breve descripción del área..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateArea} className="flex-1" disabled={!newArea.name || !newArea.code}>
                  Crear Área
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedArea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Editar Área de Estudio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre del Área</Label>
                <Input
                  id="edit-name"
                  value={selectedArea.name}
                  onChange={(e) => setSelectedArea({ ...selectedArea, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Código</Label>
                <Input
                  id="edit-code"
                  value={selectedArea.code}
                  onChange={(e) => setSelectedArea({ ...selectedArea, code: e.target.value.toUpperCase() })}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Input
                  id="edit-description"
                  value={selectedArea.description || ''}
                  onChange={(e) => setSelectedArea({ ...selectedArea, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={selectedArea.active}
                  onChange={(e) => setSelectedArea({ ...selectedArea, active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-active" className="cursor-pointer">Área activa</Label>
              </div>

              {selectedArea.courses.length > 0 && (
                <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
                  <p className="text-sm text-warning flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    Esta área tiene {selectedArea.courses.length} curso(s) asignado(s). Para eliminarla, primero reasigna los cursos a otra área.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancelar
                </Button>
                {selectedArea.courses.length === 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setShowEditModal(false)
                      handleDeleteClick(selectedArea)
                    }}
                  >
                    Eliminar
                  </Button>
                )}
                <Button onClick={handleEditArea} className="flex-1">
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedArea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Eliminación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                ¿Estás seguro de que deseas eliminar el área <strong>{selectedArea.name}</strong>?
              </p>
              {selectedArea.courses.length > 0 ? (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <p className="text-sm text-destructive">
                    No se puede eliminar esta área porque tiene {selectedArea.courses.length} curso(s) asignado(s). 
                    Primero debes reasignar estos cursos a otra área.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteArea} 
                  className="flex-1"
                  disabled={selectedArea.courses.length > 0}
                >
                  Eliminar Área
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Courses Modal */}
      {showCoursesModal && selectedArea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Cursos de {selectedArea.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Código: {selectedArea.code}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedArea.description && (
                <p className="text-muted-foreground">{selectedArea.description}</p>
              )}

              {selectedArea.courses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay cursos asignados a esta área</p>
                  <p className="text-sm mt-1">Los cursos aparecerán aquí una vez asignados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedArea.courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5">
                      <div className="flex-1">
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.type}</p>
                      </div>
                      {course.active ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowCoursesModal(false)} className="flex-1">
                  Cerrar
                </Button>
                {selectedArea.courses.length > 0 && (
                  <Button variant="outline" onClick={() => handleEditClick(selectedArea)} className="flex-1">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar Área
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
