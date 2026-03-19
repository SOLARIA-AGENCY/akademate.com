'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  GraduationCap,
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  BookOpen,
  Clock,
  ClipboardCheck,
  Layers,
  Briefcase,
  Award,
  DollarSign,
  Heart,
  FileText,
  Star,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Requirement {
  text: string
  type: 'obligatorio' | 'alternativo'
}

interface Module {
  name: string
  courseYear: '1' | '2'
  hours: string
  type: 'troncal' | 'optativo' | 'transversal' | 'fct'
}

interface CareerPath {
  title: string
  sector: string
}

interface Competency {
  title: string
  description: string
}

interface PaymentOption {
  label: string
  description: string
}

interface Scholarship {
  name: string
  description: string
  url: string
  type: string
}

interface FurtherStudy {
  title: string
  description: string
}

interface Feature {
  title: string
  description: string
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'basicos', label: 'Datos Basicos', icon: BookOpen },
  { id: 'duracion', label: 'Duracion y Modalidad', icon: Clock },
  { id: 'requisitos', label: 'Requisitos', icon: ClipboardCheck },
  { id: 'modulos', label: 'Modulos', icon: Layers },
  { id: 'salidas', label: 'Salidas Profesionales', icon: Briefcase },
  { id: 'competencias', label: 'Competencias', icon: Award },
  { id: 'precios', label: 'Precios', icon: DollarSign },
  { id: 'becas', label: 'Becas y Subvenciones', icon: Heart },
  { id: 'continuidad', label: 'Continuidad y Documentos', icon: FileText },
  { id: 'caracteristicas', label: 'Caracteristicas', icon: Star },
] as const

type TabId = (typeof TABS)[number]['id']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditarCicloPage() {
  const params = useParams()
  const router = useRouter()
  const cycleId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('basicos')

  // Tab 1: Datos Basicos
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [level, setLevel] = useState('superior')
  const [family, setFamily] = useState('')
  const [officialTitle, setOfficialTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Tab 2: Duracion y Modalidad
  const [totalHours, setTotalHours] = useState('')
  const [courses, setCourses] = useState('')
  const [modality, setModality] = useState('presencial')
  const [classFrequency, setClassFrequency] = useState('')
  const [schedule, setSchedule] = useState('')
  const [practiceHours, setPracticeHours] = useState('')

  // Tab 3: Requisitos
  const [requirements, setRequirements] = useState<Requirement[]>([])

  // Tab 4: Modulos
  const [modules, setModules] = useState<Module[]>([])

  // Tab 5: Salidas Profesionales
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([])

  // Tab 6: Competencias
  const [competencies, setCompetencies] = useState<Competency[]>([])

  // Tab 7: Precios
  const [enrollmentFee, setEnrollmentFee] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([])
  const [priceNotes, setPriceNotes] = useState('')

  // Tab 8: Becas
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [fundaeEligible, setFundaeEligible] = useState(false)

  // Tab 9: Continuidad y Documentos
  const [furtherStudies, setFurtherStudies] = useState<FurtherStudy[]>([])
  const [documents, setDocuments] = useState<{ title: string }[]>([])

  // Tab 10: Caracteristicas
  const [features, setFeatures] = useState<Feature[]>([])

  // ---------------------------------------------------------------------------
  // Fetch existing data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetch(`/api/cycles/${cycleId}?depth=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cycle) => {
        if (!cycle) return

        // Tab 1: Datos Basicos
        setName(cycle.name || '')
        setCode(cycle.code || '')
        setLevel(cycle.level || 'superior')
        setFamily(cycle.family || '')
        setOfficialTitle(cycle.officialTitle || '')
        setDescription(cycle.description || '')
        if (cycle.image?.url) {
          setImagePreview(cycle.image.url)
        }

        // Tab 2: Duracion y Modalidad
        setTotalHours(cycle.totalHours?.toString() || cycle.duration?.totalHours?.toString() || '')
        setCourses(cycle.courses?.toString() || cycle.duration?.courses?.toString() || '')
        setModality(cycle.modality || cycle.duration?.modality || 'presencial')
        setClassFrequency(cycle.classFrequency || cycle.duration?.classFrequency || '')
        setSchedule(cycle.schedule || cycle.duration?.schedule || '')
        setPracticeHours(cycle.practiceHours?.toString() || cycle.duration?.practiceHours?.toString() || '')

        // Tab 3: Requisitos
        setRequirements(
          (cycle.requirements || []).map((r: any) => ({
            text: r.text || '',
            type: r.type || 'alternativo',
          })),
        )

        // Tab 4: Modulos
        setModules(
          (cycle.modules || []).map((m: any) => ({
            name: m.name || '',
            courseYear: m.courseYear || '1',
            hours: m.hours?.toString() || '',
            type: m.type || 'troncal',
          })),
        )

        // Tab 5: Salidas Profesionales
        setCareerPaths(
          (cycle.careerPaths || []).map((cp: any) => ({
            title: cp.title || '',
            sector: cp.sector || '',
          })),
        )

        // Tab 6: Competencias
        setCompetencies(
          (cycle.competencies || []).map((c: any) => ({
            title: c.title || '',
            description: c.description || '',
          })),
        )

        // Tab 7: Precios
        setEnrollmentFee(cycle.enrollmentFee?.toString() || '')
        setMonthlyFee(cycle.monthlyFee?.toString() || '')
        setTotalPrice(cycle.totalPrice?.toString() || '')
        setPaymentOptions(
          (cycle.paymentOptions || []).map((po: any) => ({
            label: po.label || '',
            description: po.description || '',
          })),
        )
        setPriceNotes(cycle.priceNotes || '')

        // Tab 8: Becas
        setScholarships(
          (cycle.scholarships || []).map((s: any) => ({
            name: s.name || '',
            description: s.description || '',
            url: s.url || '',
            type: s.type || '',
          })),
        )
        setFundaeEligible(cycle.fundaeEligible ?? false)

        // Tab 9: Continuidad y Documentos
        setFurtherStudies(
          (cycle.furtherStudies || []).map((fs: any) => ({
            title: fs.title || '',
            description: fs.description || '',
          })),
        )
        setDocuments(
          (cycle.documents || []).map((d: any) => ({
            title: d.title || '',
          })),
        )

        // Tab 10: Caracteristicas
        setFeatures(
          (cycle.features || []).map((f: any) => ({
            title: f.title || '',
            description: f.description || '',
          })),
        )
      })
      .finally(() => setLoading(false))
  }, [cycleId])

  // ---------------------------------------------------------------------------
  // Dynamic array helpers
  // ---------------------------------------------------------------------------

  function addItem<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, template: T) {
    setter((prev) => [...prev, template])
  }

  function removeItem<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number) {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem<T>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number,
    field: keyof T,
    value: string,
  ) {
    setter((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // ---------------------------------------------------------------------------
  // Image handler
  // ---------------------------------------------------------------------------

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    }
  }

  // ---------------------------------------------------------------------------
  // Submit (PATCH instead of POST)
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      // Upload image first if a new one was selected
      let imageId: number | undefined
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('alt', name)
        const uploadRes = await fetch('/api/media', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const uploaded = await uploadRes.json()
          imageId = uploaded.doc?.id
        }
      }

      const payload = {
        name,
        code: code || undefined,
        level,
        family: family || undefined,
        officialTitle: officialTitle || undefined,
        description: description || undefined,
        ...(imageId ? { image: imageId } : {}),
        totalHours: totalHours ? parseInt(totalHours, 10) : undefined,
        courses: courses ? parseInt(courses, 10) : undefined,
        modality,
        classFrequency: classFrequency || undefined,
        schedule: schedule || undefined,
        practiceHours: practiceHours ? parseInt(practiceHours, 10) : undefined,
        requirements: requirements.length > 0 ? requirements : undefined,
        modules: modules.length > 0 ? modules.map((m) => ({ ...m, hours: parseInt(m.hours, 10) || 0 })) : undefined,
        careerPaths: careerPaths.length > 0 ? careerPaths : undefined,
        competencies: competencies.length > 0 ? competencies : undefined,
        enrollmentFee: enrollmentFee ? parseFloat(enrollmentFee) : undefined,
        monthlyFee: monthlyFee ? parseFloat(monthlyFee) : undefined,
        totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
        paymentOptions: paymentOptions.length > 0 ? paymentOptions : undefined,
        priceNotes: priceNotes || undefined,
        scholarships: scholarships.length > 0 ? scholarships : undefined,
        fundaeEligible,
        furtherStudies: furtherStudies.length > 0 ? furtherStudies : undefined,
        documents: documents.length > 0 ? documents : undefined,
        features: features.length > 0 ? features : undefined,
      }

      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push(`/ciclos/${cycleId}`)
      }
    } catch (err) {
      console.error('Error updating cycle:', err)
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar: ${name}`}
        description="Modifica los datos del ciclo formativo"
        icon={GraduationCap}
      />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/ciclos/${cycleId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al detalle
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-px scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ================================================================
            TAB 1: DATOS BASICOS
        ================================================================ */}
        {activeTab === 'basicos' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Datos Basicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Ciclo *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Desarrollo de Aplicaciones Web"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Codigo</Label>
                  <Input
                    id="code"
                    placeholder="Ej: DAW-2026"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Nivel</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Formacion Profesional Basica</SelectItem>
                      <SelectItem value="medio">Grado Medio</SelectItem>
                      <SelectItem value="superior">Grado Superior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="family">Familia Profesional</Label>
                  <Input
                    id="family"
                    placeholder="Ej: Informatica y Comunicaciones"
                    value={family}
                    onChange={(e) => setFamily(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="officialTitle">Titulo Oficial</Label>
                  <Input
                    id="officialTitle"
                    placeholder="Ej: Tecnico Superior en Desarrollo de Aplicaciones Web"
                    value={officialTitle}
                    onChange={(e) => setOfficialTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Imagen del Ciclo</Label>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <div className="flex-shrink-0 w-32 h-20 rounded-lg border border-border overflow-hidden bg-muted">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="max-w-xs"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Imagen de portada del ciclo. Recomendado: 1200x400px.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  placeholder="Descripcion detallada del ciclo formativo, competencias generales, perfil profesional..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 2: DURACION Y MODALIDAD
        ================================================================ */}
        {activeTab === 'duracion' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Duracion y Modalidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="totalHours">Horas Totales</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    placeholder="Ej: 2000"
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courses">Cursos Academicos</Label>
                  <Input
                    id="courses"
                    type="number"
                    placeholder="Ej: 2"
                    value={courses}
                    onChange={(e) => setCourses(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modality">Modalidad</Label>
                  <Select value={modality} onValueChange={setModality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="semipresencial">Semipresencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="dual">Dual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classFrequency">Frecuencia de Clases</Label>
                  <Input
                    id="classFrequency"
                    placeholder="Ej: Lunes a Viernes"
                    value={classFrequency}
                    onChange={(e) => setClassFrequency(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Horario</Label>
                  <Input
                    id="schedule"
                    placeholder="Ej: 08:00 - 14:30"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="practiceHours">Horas de Practicas (FCT)</Label>
                  <Input
                    id="practiceHours"
                    type="number"
                    placeholder="Ej: 400"
                    value={practiceHours}
                    onChange={(e) => setPracticeHours(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 3: REQUISITOS DE ACCESO
        ================================================================ */}
        {activeTab === 'requisitos' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Requisitos de Acceso
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem(setRequirements, { text: '', type: 'obligatorio' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Anadir Requisito
              </Button>
            </CardHeader>
            <CardContent>
              {requirements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay requisitos definidos. Anade el primero.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requirements.map((req, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Ej: Titulo de Bachillerato o equivalente"
                          value={req.text}
                          onChange={(e) => updateItem(setRequirements, i, 'text', e.target.value)}
                        />
                      </div>
                      <Select
                        value={req.type}
                        onValueChange={(v) => updateItem(setRequirements, i, 'type', v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="obligatorio">Obligatorio</SelectItem>
                          <SelectItem value="alternativo">Alternativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => removeItem(setRequirements, i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 4: MODULOS
        ================================================================ */}
        {activeTab === 'modulos' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Modulos del Ciclo
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem(setModules, { name: '', courseYear: '1', hours: '', type: 'troncal' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Anadir Modulo
              </Button>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay modulos definidos. Anade el primero.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((mod, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-2">
                          <Input
                            placeholder="Nombre del modulo"
                            value={mod.name}
                            onChange={(e) => updateItem(setModules, i, 'name', e.target.value)}
                          />
                        </div>
                        <Select
                          value={mod.courseYear}
                          onValueChange={(v) => updateItem(setModules, i, 'courseYear', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Curso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1er Curso</SelectItem>
                            <SelectItem value="2">2do Curso</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Horas"
                          value={mod.hours}
                          onChange={(e) => updateItem(setModules, i, 'hours', e.target.value)}
                        />
                      </div>
                      <Select
                        value={mod.type}
                        onValueChange={(v) => updateItem(setModules, i, 'type', v)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="troncal">Troncal</SelectItem>
                          <SelectItem value="optativo">Optativo</SelectItem>
                          <SelectItem value="transversal">Transversal</SelectItem>
                          <SelectItem value="fct">FCT</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => removeItem(setModules, i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 5: SALIDAS PROFESIONALES
        ================================================================ */}
        {activeTab === 'salidas' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Salidas Profesionales
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem(setCareerPaths, { title: '', sector: '' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Anadir Salida
              </Button>
            </CardHeader>
            <CardContent>
              {careerPaths.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay salidas profesionales definidas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {careerPaths.map((cp, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Titulo / Puesto"
                          value={cp.title}
                          onChange={(e) => updateItem(setCareerPaths, i, 'title', e.target.value)}
                        />
                        <Input
                          placeholder="Sector"
                          value={cp.sector}
                          onChange={(e) => updateItem(setCareerPaths, i, 'sector', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => removeItem(setCareerPaths, i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 6: COMPETENCIAS
        ================================================================ */}
        {activeTab === 'competencias' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Competencias
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem(setCompetencies, { title: '', description: '' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Anadir Competencia
              </Button>
            </CardHeader>
            <CardContent>
              {competencies.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay competencias definidas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {competencies.map((comp, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Titulo de la competencia"
                          value={comp.title}
                          onChange={(e) => updateItem(setCompetencies, i, 'title', e.target.value)}
                        />
                        <Textarea
                          placeholder="Descripcion de la competencia"
                          value={comp.description}
                          onChange={(e) => updateItem(setCompetencies, i, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => removeItem(setCompetencies, i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 7: PRECIOS
        ================================================================ */}
        {activeTab === 'precios' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Precios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="enrollmentFee">Matricula</Label>
                  <Input
                    id="enrollmentFee"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={enrollmentFee}
                    onChange={(e) => setEnrollmentFee(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyFee">Cuota Mensual</Label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Precio Total</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Options */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Opciones de Pago</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addItem(setPaymentOptions, { label: '', description: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Anadir Opcion
                  </Button>
                </div>
                {paymentOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin opciones de pago adicionales.</p>
                ) : (
                  <div className="space-y-3">
                    {paymentOptions.map((opt, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1 grid gap-3 sm:grid-cols-2">
                          <Input
                            placeholder="Ej: Pago unico"
                            value={opt.label}
                            onChange={(e) => updateItem(setPaymentOptions, i, 'label', e.target.value)}
                          />
                          <Input
                            placeholder="Ej: 10% descuento"
                            value={opt.description}
                            onChange={(e) => updateItem(setPaymentOptions, i, 'description', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => removeItem(setPaymentOptions, i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceNotes">Notas sobre Precios</Label>
                <Textarea
                  id="priceNotes"
                  placeholder="Informacion adicional sobre precios, descuentos, condiciones..."
                  value={priceNotes}
                  onChange={(e) => setPriceNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 8: BECAS Y SUBVENCIONES
        ================================================================ */}
        {activeTab === 'becas' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Becas y Subvenciones
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem(setScholarships, { name: '', description: '', url: '', type: '' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Anadir Beca
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Checkbox
                  id="fundae"
                  checked={fundaeEligible}
                  onCheckedChange={(v) => setFundaeEligible(v === true)}
                />
                <Label htmlFor="fundae" className="cursor-pointer">
                  Bonificable a traves de FUNDAE
                </Label>
              </div>

              {scholarships.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay becas o subvenciones definidas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scholarships.map((sch, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Nombre de la beca"
                          value={sch.name}
                          onChange={(e) => updateItem(setScholarships, i, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Tipo (publica, privada, europea)"
                          value={sch.type}
                          onChange={(e) => updateItem(setScholarships, i, 'type', e.target.value)}
                        />
                        <Input
                          placeholder="Descripcion"
                          value={sch.description}
                          onChange={(e) => updateItem(setScholarships, i, 'description', e.target.value)}
                        />
                        <Input
                          placeholder="URL de informacion"
                          value={sch.url}
                          onChange={(e) => updateItem(setScholarships, i, 'url', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => removeItem(setScholarships, i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 9: CONTINUIDAD Y DOCUMENTOS
        ================================================================ */}
        {activeTab === 'continuidad' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Continuidad y Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Further Studies */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Estudios de Continuidad</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addItem(setFurtherStudies, { title: '', description: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Anadir
                  </Button>
                </div>
                {furtherStudies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin estudios de continuidad definidos.</p>
                ) : (
                  <div className="space-y-3">
                    {furtherStudies.map((fs, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Titulo (Ej: Grado en Ingenieria Informatica)"
                            value={fs.title}
                            onChange={(e) => updateItem(setFurtherStudies, i, 'title', e.target.value)}
                          />
                          <Input
                            placeholder="Descripcion"
                            value={fs.description}
                            onChange={(e) => updateItem(setFurtherStudies, i, 'description', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => removeItem(setFurtherStudies, i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Documentos</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addItem(setDocuments, { title: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Anadir Documento
                  </Button>
                </div>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin documentos adjuntos.</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1 grid gap-3 sm:grid-cols-2">
                          <Input
                            placeholder="Titulo del documento"
                            value={doc.title}
                            onChange={(e) => updateItem(setDocuments, i, 'title', e.target.value)}
                          />
                          <Input
                            type="file"
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => removeItem(setDocuments, i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            TAB 10: CARACTERISTICAS
        ================================================================ */}
        {activeTab === 'caracteristicas' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Caracteristicas
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem(setFeatures, { title: '', description: '' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Anadir Caracteristica
              </Button>
            </CardHeader>
            <CardContent>
              {features.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay caracteristicas definidas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {features.map((feat, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Titulo de la caracteristica"
                          value={feat.title}
                          onChange={(e) => updateItem(setFeatures, i, 'title', e.target.value)}
                        />
                        <Textarea
                          placeholder="Descripcion"
                          value={feat.description}
                          onChange={(e) => updateItem(setFeatures, i, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => removeItem(setFeatures, i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================================
            SUBMIT BAR
        ================================================================ */}
        <div className="flex justify-end gap-3 pt-6">
          <Button type="button" variant="outline" onClick={() => router.push(`/ciclos/${cycleId}`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
