'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Plus,
  BookOpen,
  Edit2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  GraduationCap,
  ArrowRight,
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
    setAreas(areas.map((a) => (a.id === selectedArea.id ? selectedArea : a)))
    setShowEditModal(false)
    setSelectedArea(null)
  }

  const handleDeleteArea = () => {
    if (!selectedArea) return
    setAreas(areas.filter((a) => a.id !== selectedArea.id))
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
    <div className="space-y-6 max-w-6xl" data-oid="88j51lc">
      <PageHeader
        title="Áreas de Estudio"
        description="Gestiona las categorías de cursos y formación profesional"
        icon={GraduationCap}
        actions={
          <Button onClick={() => setShowCreateModal(true)} data-oid="6d0gk9f">
            <Plus className="mr-2 h-4 w-4" data-oid="-k5wes4" />
            Nueva Área
          </Button>
        }
        data-oid="8q:6dvi"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4" data-oid="-js2b0v">
        <Card data-oid="v.3_hu5">
          <CardContent className="pt-6" data-oid="tdmt6x3">
            <div className="text-2xl font-bold" data-oid="j-l04xx">
              {areas.length}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="8trat1r">
              Áreas Totales
            </p>
          </CardContent>
        </Card>
        <Card data-oid="96-yp43">
          <CardContent className="pt-6" data-oid="whphvq7">
            <div className="text-2xl font-bold" data-oid=":0z8wmy">
              {areas.filter((a) => a.active).length}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="jgx7_rr">
              Áreas Activas
            </p>
          </CardContent>
        </Card>
        <Card data-oid="ajlh:sa">
          <CardContent className="pt-6" data-oid="lzh4eci">
            <div className="text-2xl font-bold" data-oid="8691no1">
              {areas.reduce((sum, a) => sum + a.courses.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="ye5r9r:">
              Cursos Asignados
            </p>
          </CardContent>
        </Card>
        <Card data-oid="o6.7_zw">
          <CardContent className="pt-6" data-oid="-6rvk0e">
            <div className="text-2xl font-bold" data-oid="5f9e.ju">
              {areas.filter((a) => a.courses.length === 0).length}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="j966okt">
              Áreas Sin Cursos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Areas List */}
      <div className="grid gap-4 md:grid-cols-2" data-oid="ikl3huu">
        {areas.map((area) => (
          <Card key={area.id} className="hover:shadow-md transition-shadow" data-oid="87jkdiv">
            <CardHeader data-oid="jkow6o2">
              <div className="flex items-start justify-between" data-oid="pp5413b">
                <div className="flex-1" data-oid="q06sk28">
                  <CardTitle className="flex items-center gap-2" data-oid="b97pj5m">
                    <BookOpen className="h-5 w-5 text-primary" data-oid="-l:r1m3" />
                    {area.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1" data-oid="j.ra_.1">
                    Código: {area.code}
                  </p>
                  {area.description && (
                    <p className="text-sm text-muted-foreground mt-2" data-oid=":loalb1">
                      {area.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1" data-oid="b0wc.gb">
                  {area.active ? (
                    <CheckCircle className="h-5 w-5 text-success" data-oid=".ar00-r" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" data-oid="mjjxad." />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent data-oid="g4p0a:d">
              <div className="space-y-3" data-oid="vg9-d1g">
                <div
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-oid="uzxb3ba"
                >
                  <div className="flex items-center gap-2" data-oid="evj4_vw">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" data-oid="luy-.dc" />
                    <span className="font-medium" data-oid="soj5k5r">
                      {area.courses.length} cursos
                    </span>
                  </div>
                  {area.courses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCourses(area)}
                      data-oid="dmj-t8:"
                    >
                      Ver Cursos
                      <ArrowRight className="ml-1 h-4 w-4" data-oid="ffvi21y" />
                    </Button>
                  )}
                </div>

                <div className="flex gap-2" data-oid="oawv4:u">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewCourses(area)}
                    data-oid="c61_rm0"
                  >
                    <Eye className="mr-2 h-4 w-4" data-oid="2z4ndk0" />
                    Ver Detalles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditClick(area)}
                    data-oid="5yw2d:5"
                  >
                    <Edit2 className="mr-2 h-4 w-4" data-oid="v:gisqk" />
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          data-oid="m-x6dma"
        >
          <Card className="w-full max-w-lg mx-4" data-oid="4y8wd0j">
            <CardHeader data-oid="yaj96ma">
              <CardTitle data-oid="qlrcpvq">Crear Nueva Área de Estudio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="h5hkeoo">
              <div className="space-y-2" data-oid="p8yzzmr">
                <Label htmlFor="name" data-oid="iwkq_ol">
                  Nombre del Área
                </Label>
                <Input
                  id="name"
                  value={newArea.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewArea({ ...newArea, name: e.target.value })
                  }
                  placeholder="Ej: Marketing y Publicidad"
                  data-oid="6d1bbob"
                />
              </div>
              <div className="space-y-2" data-oid="sfdi8r5">
                <Label htmlFor="code" data-oid="idt0gr:">
                  Código
                </Label>
                <Input
                  id="code"
                  value={newArea.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewArea({ ...newArea, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ej: MKT"
                  maxLength={5}
                  data-oid="gw86vv0"
                />
              </div>
              <div className="space-y-2" data-oid="am9aayj">
                <Label htmlFor="description" data-oid="yn1z8xp">
                  Descripción (Opcional)
                </Label>
                <Input
                  id="description"
                  value={newArea.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewArea({ ...newArea, description: e.target.value })
                  }
                  placeholder="Breve descripción del área..."
                  data-oid="_-uqto-"
                />
              </div>
              <div className="flex gap-2 pt-4" data-oid="mfr54bv">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                  data-oid="ua-nwki"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateArea}
                  className="flex-1"
                  disabled={!newArea.name || !newArea.code}
                  data-oid="v98wkcp"
                >
                  Crear Área
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedArea && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          data-oid="j4g-us4"
        >
          <Card className="w-full max-w-lg mx-4" data-oid="xuysjk6">
            <CardHeader data-oid=".k3539_">
              <CardTitle data-oid="bweh5l0">Editar Área de Estudio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="k9wy4tz">
              <div className="space-y-2" data-oid="akt.:10">
                <Label htmlFor="edit-name" data-oid="cj1:yef">
                  Nombre del Área
                </Label>
                <Input
                  id="edit-name"
                  value={selectedArea.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedArea({ ...selectedArea, name: e.target.value })
                  }
                  data-oid="jfy61:k"
                />
              </div>
              <div className="space-y-2" data-oid="6fnlyj2">
                <Label htmlFor="edit-code" data-oid="grpke2o">
                  Código
                </Label>
                <Input
                  id="edit-code"
                  value={selectedArea.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedArea({ ...selectedArea, code: e.target.value.toUpperCase() })
                  }
                  maxLength={5}
                  data-oid="lnyuy:5"
                />
              </div>
              <div className="space-y-2" data-oid="su1ni:c">
                <Label htmlFor="edit-description" data-oid=":u8s5cg">
                  Descripción
                </Label>
                <Input
                  id="edit-description"
                  value={selectedArea.description ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedArea({ ...selectedArea, description: e.target.value })
                  }
                  data-oid="g2xi7f7"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg" data-oid="e7e6t1.">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={selectedArea.active}
                  onChange={(e) => setSelectedArea({ ...selectedArea, active: e.target.checked })}
                  className="rounded"
                  data-oid="pkfsrrs"
                />

                <Label htmlFor="edit-active" className="cursor-pointer" data-oid="_9_2db-">
                  Área activa
                </Label>
              </div>

              {selectedArea.courses.length > 0 && (
                <div
                  className="bg-warning/10 border border-warning/20 p-3 rounded-lg"
                  data-oid="kr:4hxd"
                >
                  <p className="text-sm text-warning flex items-start gap-2" data-oid="frbuspk">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" data-oid="p0y77lz" />
                    Esta área tiene {selectedArea.courses.length} curso(s) asignado(s). Para
                    eliminarla, primero reasigna los cursos a otra área.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4" data-oid="xiqc5uq">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                  data-oid="lzmph2i"
                >
                  Cancelar
                </Button>
                {selectedArea.courses.length === 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowEditModal(false)
                      handleDeleteClick(selectedArea)
                    }}
                    data-oid="rdw:mzh"
                  >
                    Eliminar
                  </Button>
                )}
                <Button onClick={handleEditArea} className="flex-1" data-oid="slg:5hs">
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedArea && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          data-oid="o:9xmxv"
        >
          <Card className="w-full max-w-md mx-4" data-oid="agvq5h9">
            <CardHeader data-oid=".:auil:">
              <CardTitle className="text-destructive flex items-center gap-2" data-oid=":0ihe01">
                <AlertTriangle className="h-5 w-5" data-oid="bkmccef" />
                Confirmar Eliminación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="35vw11a">
              <p data-oid="1j68em-">
                ¿Estás seguro de que deseas eliminar el área{' '}
                <strong data-oid="amj80nx">{selectedArea.name}</strong>?
              </p>
              {selectedArea.courses.length > 0 ? (
                <div
                  className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg"
                  data-oid="m2b0lbx"
                >
                  <p className="text-sm text-destructive" data-oid="lxoszo1">
                    No se puede eliminar esta área porque tiene {selectedArea.courses.length}{' '}
                    curso(s) asignado(s). Primero debes reasignar estos cursos a otra área.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-oid="-w5..ly">
                  Esta acción no se puede deshacer.
                </p>
              )}
              <div className="flex gap-2" data-oid="uu0_-sb">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                  data-oid="t71uyrm"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteArea}
                  className="flex-1"
                  disabled={selectedArea.courses.length > 0}
                  data-oid="r_doqdc"
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          data-oid="cas9kc_"
        >
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" data-oid="5dva0lz">
            <CardHeader data-oid="9dsqa.8">
              <CardTitle className="flex items-center gap-2" data-oid="qd20vef">
                <BookOpen className="h-5 w-5" data-oid="5.7d-cr" />
                Cursos de {selectedArea.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground" data-oid="dxi3dw_">
                Código: {selectedArea.code}
              </p>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="kg4jb40">
              {selectedArea.description && (
                <p className="text-muted-foreground" data-oid="asp.p_z">
                  {selectedArea.description}
                </p>
              )}

              {selectedArea.courses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" data-oid="oz9bu80">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" data-oid="3xuziso" />
                  <p data-oid="zfe1d4w">No hay cursos asignados a esta área</p>
                  <p className="text-sm mt-1" data-oid=":ryfsk2">
                    Los cursos aparecerán aquí una vez asignados
                  </p>
                </div>
              ) : (
                <div className="space-y-2" data-oid="wlg4-uf">
                  {selectedArea.courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5"
                      data-oid="nixc2-n"
                    >
                      <div className="flex-1" data-oid="zt:km-_">
                        <p className="font-medium" data-oid="5o:pex9">
                          {course.title}
                        </p>
                        <p className="text-sm text-muted-foreground" data-oid="fcybvc3">
                          {course.type}
                        </p>
                      </div>
                      {course.active ? (
                        <CheckCircle className="h-5 w-5 text-success" data-oid="mta8upu" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" data-oid="krwtgen" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4" data-oid="30jazg4">
                <Button
                  onClick={() => setShowCoursesModal(false)}
                  className="flex-1"
                  data-oid="su3vs4d"
                >
                  Cerrar
                </Button>
                {selectedArea.courses.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => handleEditClick(selectedArea)}
                    className="flex-1"
                    data-oid="cox49-1"
                  >
                    <Edit2 className="mr-2 h-4 w-4" data-oid="k:u3idr" />
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
