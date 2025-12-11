'use client'

export const dynamic = 'force-dynamic'

import { MockupTable } from '@payload-config/components/mockup/MockupTable'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'

export default function LeadsPage() {
  const columns = ['Nombre', 'Email', 'Teléfono', 'Estado', 'Origen', 'Fecha Registro']

  const rows = [
    [
      'María García López',
      'maria.garcia@email.com',
      '+34 612 345 678',
      <span key="1" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Contactado</span>,
      'Web - Formulario Contacto',
      '23/11/2025 14:30'
    ],
    [
      'Juan Martínez Ruiz',
      'juan.martinez@email.com',
      '+34 623 456 789',
      <span key="2" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Nuevo</span>,
      'Meta Ads - Campaña Marketing Digital',
      '23/11/2025 12:15'
    ],
    [
      'Ana Sánchez Torres',
      'ana.sanchez@email.com',
      '+34 634 567 890',
      <span key="3" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Seguimiento</span>,
      'Web - Descargar Brochure',
      '22/11/2025 18:45'
    ],
    [
      'Pedro López Fernández',
      'pedro.lopez@email.com',
      '+34 645 678 901',
      <span key="4" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Contactado</span>,
      'WhatsApp - Consulta Curso',
      '22/11/2025 10:20'
    ],
    [
      'Laura Rodríguez Gil',
      'laura.rodriguez@email.com',
      '+34 656 789 012',
      <span key="5" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Nuevo</span>,
      'Meta Ads - Campaña Ciclos FP',
      '21/11/2025 16:30'
    ],
    [
      'Carlos Gómez Martín',
      'carlos.gomez@email.com',
      '+34 667 890 123',
      <span key="6" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Seguimiento</span>,
      'Web - Formulario Info',
      '21/11/2025 09:15'
    ]
  ]

  return (
    <div className="p-6 space-y-6">
      <MockDataIndicator
        variant="banner"
        label="Este módulo usa datos de demostración. Pendiente integración con formularios web y Meta Ads."
      />
      <MockupTable
        title="Gestión de Leads"
        description="Control y seguimiento de leads capturados desde formularios, campañas y canales digitales"
        columns={columns}
        rows={rows}
        onAdd={() => console.log('Añadir lead')}
        addButtonText="Añadir Lead"
        onExport={() => console.log('Exportar CSV')}
      />
    </div>
  )
}
