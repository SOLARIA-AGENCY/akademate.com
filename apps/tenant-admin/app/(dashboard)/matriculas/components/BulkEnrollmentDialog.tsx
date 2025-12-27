'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'

interface BulkEnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

interface CSVRow {
  studentEmail: string
  courseRunId: string
  status?: string
  notes?: string
}

interface BulkResult {
  total: number
  created: number
  failed: number
  skipped: number
  errors: Array<{ row: number; email: string; error: string }>
  created_ids: string[]
}

type DialogStep = 'upload' | 'preview' | 'processing' | 'results'

export function BulkEnrollmentDialog({
  open,
  onOpenChange,
  onComplete,
}: BulkEnrollmentDialogProps) {
  const [step, setStep] = useState<DialogStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<CSVRow[]>([])
  const [result, setResult] = useState<BulkResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const resetState = useCallback(() => {
    setStep('upload')
    setFile(null)
    setParsedRows([])
    setResult(null)
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onOpenChange(false)
  }, [resetState, onOpenChange])

  const parseCSV = (content: string): CSVRow[] => {
    const lines = content.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('El CSV debe tener al menos una fila de encabezado y una fila de datos')
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

    const emailIndex = headers.indexOf('studentemail') !== -1
      ? headers.indexOf('studentemail')
      : headers.indexOf('email')
    const courseRunIndex = headers.indexOf('courserunid') !== -1
      ? headers.indexOf('courserunid')
      : headers.indexOf('course_run_id')
    const statusIndex = headers.indexOf('status')
    const notesIndex = headers.indexOf('notes')

    if (emailIndex === -1) {
      throw new Error('El CSV debe tener una columna "studentEmail" o "email"')
    }
    if (courseRunIndex === -1) {
      throw new Error('El CSV debe tener una columna "courseRunId" o "course_run_id"')
    }

    const rows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      if (values.length < 2 || !values[emailIndex]) continue

      rows.push({
        studentEmail: values[emailIndex],
        courseRunId: values[courseRunIndex],
        status: statusIndex !== -1 ? values[statusIndex] || 'active' : 'active',
        notes: notesIndex !== -1 ? values[notesIndex] : undefined,
      })
    }

    return rows
  }

  const handleFileSelect = async (selectedFile: File) => {
    setError(null)

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV')
      return
    }

    try {
      const content = await selectedFile.text()
      const rows = parseCSV(content)

      if (rows.length === 0) {
        setError('El archivo CSV no contiene filas de datos validas')
        return
      }

      setFile(selectedFile)
      setParsedRows(rows)
      setStep('preview')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al procesar el archivo')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleSubmit = async () => {
    if (!file) return

    setStep('processing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/lms/enrollments/bulk', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar las matriculas')
      }

      setResult(data.data)
      setStep('results')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al procesar las matriculas')
      setStep('preview')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/lms/enrollments/bulk')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bulk-enrollment-template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error('Error downloading template:', e)
    }
  }

  const handleDone = () => {
    if (result && result.created > 0 && onComplete) {
      onComplete()
    }
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" style={{ color: '#F2014B' }} />
            Importar Matriculas desde CSV
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube un archivo CSV con los datos de matriculacion'}
            {step === 'preview' && 'Revisa los datos antes de procesarlos'}
            {step === 'processing' && 'Procesando matriculas...'}
            {step === 'results' && 'Resultados de la importacion'}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">
                Arrastra tu archivo CSV aqui
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
              <div className="relative">
                <Button variant="outline" className="mt-4" asChild>
                  <label htmlFor="csv-file-input" className="cursor-pointer">
                    Seleccionar archivo
                  </label>
                </Button>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="sr-only"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <p className="font-medium">Formato requerido:</p>
                <p className="text-muted-foreground">
                  studentEmail, courseRunId, status, notes
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Plantilla
              </Button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{file?.name}</span>
                <Badge variant="outline">{parsedRows.length} filas</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null)
                  setParsedRows([])
                  setStep('upload')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="max-h-64 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Course Run ID</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 10).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{row.studentEmail}</TableCell>
                      <TableCell className="font-mono text-sm">{row.courseRunId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status || 'active'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRows.length > 10 && (
                <div className="p-2 text-center text-sm text-muted-foreground bg-muted/50">
                  ... y {parsedRows.length - 10} filas mas
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Procesando {parsedRows.length} matriculas...
            </p>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <span className="mt-2 text-2xl font-bold text-green-700">{result.created}</span>
                <span className="text-sm text-green-600">Creadas</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-amber-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-amber-600" />
                <span className="mt-2 text-2xl font-bold text-amber-700">{result.skipped}</span>
                <span className="text-sm text-amber-600">Omitidas</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600" />
                <span className="mt-2 text-2xl font-bold text-red-700">{result.failed}</span>
                <span className="text-sm text-red-600">Fallidas</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Errores:</p>
                <div className="max-h-40 overflow-auto border border-red-200 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Fila</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell className="font-mono text-sm">{err.email}</TableCell>
                          <TableCell className="text-red-600">{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Atras
              </Button>
              <Button onClick={handleSubmit} style={{ backgroundColor: '#F2014B' }}>
                Procesar {parsedRows.length} matriculas
              </Button>
            </>
          )}
          {step === 'results' && (
            <Button onClick={handleDone} style={{ backgroundColor: '#F2014B' }}>
              {result && result.created > 0 ? 'Finalizar' : 'Cerrar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
