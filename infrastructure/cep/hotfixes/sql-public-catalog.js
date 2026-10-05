const { Client } = require('pg')

const TYPE_LABELS = {
  privado: 'Privados',
  privados: 'Privados',
  ocupado: 'Ocupados',
  ocupados: 'Ocupados',
  desempleado: 'Desempleados',
  desempleados: 'Desempleados',
  teleformacion: 'Teleformación',
  tele_formacion: 'Teleformación',
}

function studyTypeLabel(courseType) {
  const key = String(courseType || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
  return TYPE_LABELS[key] || 'Privados'
}

module.exports = async function buildSqlPublicCatalog() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    const coursesRes = await client.query(
      `SELECT id, name, slug, course_type, COALESCE(short_description, '') AS descripcion, updated_at
       FROM courses
       WHERE tenant_id = 1
         AND COALESCE(active, true) = true
         AND (course_type IS NULL OR course_type::text NOT IN ('ciclo_medio', 'ciclo_superior'))
       ORDER BY name
       LIMIT 500`,
    )
    const runsRes = await client.query(
      `SELECT course_id, status
       FROM course_runs
       WHERE tenant_id = 1
         AND status IN ('enrollment_open', 'published')`,
    )
    const campusesRes = await client.query(
      `SELECT id, name, slug, city
       FROM campuses
       WHERE tenant_id = 1
       ORDER BY name
       LIMIT 50`,
    )
    const openIds = new Set(
      runsRes.rows.filter((row) => row.status === 'enrollment_open').map((row) => String(row.course_id)),
    )
    const publishedIds = new Set(
      runsRes.rows.filter((row) => row.status === 'published').map((row) => String(row.course_id)),
    )
    const courses = coursesRes.rows.map((row) => {
      const id = String(row.id)
      const enrollmentStatus = openIds.has(id) ? 'open' : publishedIds.has(id) ? 'published' : 'none'
      return {
        id,
        slug: row.slug || String(row.id),
        nombre: row.name || 'Curso',
        studyTypeLabel: studyTypeLabel(row.course_type),
        enrollmentStatus,
        descripcion: row.descripcion || '',
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      }
    })
    const generatedAt = new Date().toISOString()
    return {
      meta: {
        tenant: 'cep-formacion',
        host: 'cepformacion.akademate.com',
        generatedAt,
        version: `sql-${courses.length}-${generatedAt.slice(0, 10)}`,
        cacheTtlSeconds: 60,
      },
      data: {
        branding: {
          academyName: 'CEP Formación',
          slug: 'cep-formacion',
          logoUrl: '/logos/cep-formacion-logo.svg',
        },
        navigation: { items: [] },
        seo: {
          defaultTitle: 'CEP Formación | Formación profesional en Tenerife',
          defaultDescription: 'Cursos, ciclos y convocatorias de CEP Formación.',
          canonicalOrigin: 'https://cepformacion.com',
        },
        courses,
        cycles: [],
        convocatorias: [],
        campuses: campusesRes.rows.map((row) => ({
          slug: row.slug || String(row.id),
          name: row.name || 'Sede',
          city: row.city || null,
        })),
        teachers: [],
        pages: [],
        sitemap: [
          { path: '/', changefreq: 'daily', lastmod: generatedAt },
          ...courses.map((course) => ({
            path: `/cursos/${course.slug}`,
            changefreq: 'weekly',
            lastmod: course.updated_at,
          })),
        ],
      },
    }
  } finally {
    await client.end()
  }
}
