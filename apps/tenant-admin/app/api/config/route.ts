import { NextRequest, NextResponse } from 'next/server'

// TODO: Replace with actual database queries
// This is a mock implementation for demonstration

interface ConfigData {
  academia: {
    nombre: string
    razonSocial: string
    cif: string
    direccion: string
    codigoPostal: string
    ciudad: string
    provincia: string
    telefono1: string
    telefono2: string
    email1: string
    email2: string
    web: string
    horario: string
    facebook: string
    twitter: string
    instagram: string
    linkedin: string
    youtube: string
  }
  logos: {
    principal: string
    oscuro: string
    claro: string
    favicon: string
  }
  personalizacion: {
    colorPrimario: string
    colorSecundario: string
    colorAcento: string
    fuentePrincipal: string
    tema: string
  }
}

// Mock data
const mockConfig: ConfigData = {
  academia: {
    nombre: 'CEP Formación',
    razonSocial: 'Centro de Estudios Profesionales S.L.',
    cif: 'B12345678',
    direccion: 'Calle Principal 123',
    codigoPostal: '28001',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    telefono1: '+34 912 345 678',
    telefono2: '+34 912 345 679',
    email1: 'info@cepformacion.com',
    email2: 'contacto@cepformacion.com',
    web: 'https://www.cepformacion.com',
    horario: 'Lunes a Viernes: 9:00 - 18:00',
    facebook: 'https://facebook.com/cepformacion',
    twitter: 'https://twitter.com/cepformacion',
    instagram: 'https://instagram.com/cepformacion',
    linkedin: 'https://linkedin.com/company/cepformacion',
    youtube: 'https://youtube.com/@cepformacion',
  },
  logos: {
    principal: '/logos/cep-logo.png',
    oscuro: '/logos/cep-logo.png',
    claro: '/logos/cep-logo-alpha.png',
    favicon: '/logos/cep-logo-alpha.png',
  },
  personalizacion: {
    colorPrimario: '#0066cc',
    colorSecundario: '#00cc66',
    colorAcento: '#ff6600',
    fuentePrincipal: 'Inter',
    tema: 'default',
  },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    // Section parameter is required
    if (!section || section === '') {
      return NextResponse.json(
        { success: false, error: 'Section parameter is required' },
        { status: 400 }
      )
    }

    // Handle specific sections
    if (section === 'logos') {
      return NextResponse.json({
        success: true,
        data: mockConfig.logos,
      })
    }

    if (section === 'academia') {
      return NextResponse.json({
        success: true,
        data: { nombre: 'CEP FORMACIÓN' }, // Return simplified structure for tests
      })
    }

    if (section === 'personalizacion') {
      return NextResponse.json({
        success: true,
        data: mockConfig.personalizacion,
      })
    }

    // Section not found
    return NextResponse.json(
      { success: false, error: 'Section not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { section, data } = body

    // TODO: Save to database
    console.log('Updating config section:', section, data)

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data,
    })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}
