import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// GET /.well-known/ai-plugin.json
// Returns the ChatGPT Actions / OpenAI plugin manifest for Akademate.
// This endpoint does NOT require authentication.
// ============================================================================

const AI_PLUGIN_MANIFEST = {
  schema_version: 'v1',
  name_for_human: 'Akademate',
  name_for_model: 'akademate',
  description_for_human:
    'Gestiona tu academia: cursos, alumnos, matrículas y analíticas.',
  description_for_model:
    'API para gestión de centros de formación. Permite listar y crear cursos, consultar alumnos, gestionar matrículas y obtener analíticas del dashboard. Siempre usa los IDs devueltos por los endpoints de listado para hacer referencias. Respeta los scopes: courses:read/write, students:read/write, enrollments:read/write, analytics:read.',
  auth: {
    type: 'service_http',
    authorization_type: 'bearer',
    verification_tokens: {},
  },
  api: {
    type: 'openapi',
    url: 'https://app.akademate.com/api/v1/openapi.json',
  },
  logo_url: 'https://akademate.com/logos/akademate-logo-official.png',
  contact_email: 'hola@akademate.com',
  legal_info_url: 'https://akademate.com/legal/terminos',
}

export async function GET() {
  return NextResponse.json(AI_PLUGIN_MANIFEST, {
    headers: {
      'Content-Type': 'application/json',
      // Required for ChatGPT to fetch the manifest cross-origin
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
