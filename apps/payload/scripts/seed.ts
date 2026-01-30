/**
 * Seed Script for Akademate
 *
 * Creates:
 * - 1 Superadmin user
 * - 1 Demo tenant with sample data
 * - 1 Admin user for the demo tenant
 *
 * Usage:
 *   pnpm exec tsx scripts/seed.ts
 *
 * Or via npm script:
 *   pnpm seed
 */

import { getPayload } from 'payload'
import config from '../payload.config'

const SUPERADMIN_EMAIL = 'admin@akademate.io'
const SUPERADMIN_PASSWORD = 'Akademate2024!'

const DEMO_TENANT = {
  name: 'Demo Academy',
  slug: 'demo-academy',
  plan: 'pro' as const,
  status: 'active' as const,
  mrr: 99,
  domains: [{ host: 'demo.akademate.io' }],
  branding: {
    primaryColor: '#f6921d',
    logo: null,
  },
}

const DEMO_ADMIN = {
  email: 'admin@demo-academy.com',
  password: 'DemoAdmin2024!',
  name: 'Demo Admin',
}

const DEMO_COURSES = [
  {
    title: 'Introducción a React',
    slug: 'intro-react',
    status: 'published' as const,
    metadata: {
      duration: '40 horas',
      level: 'Principiante',
    },
  },
  {
    title: 'TypeScript Avanzado',
    slug: 'typescript-avanzado',
    status: 'published' as const,
    metadata: {
      duration: '30 horas',
      level: 'Avanzado',
    },
  },
  {
    title: 'Node.js para Backend',
    slug: 'nodejs-backend',
    status: 'draft' as const,
    metadata: {
      duration: '50 horas',
      level: 'Intermedio',
    },
  },
]

const DEMO_CYCLES = [
  {
    name: 'Desarrollo Web Full Stack',
    slug: 'desarrollo-web-fullstack',
    level: 'Grado Superior',
    duration: 2000,
    description: 'Ciclo formativo de desarrollo web completo',
  },
  {
    name: 'Administración de Sistemas',
    slug: 'administracion-sistemas',
    level: 'Grado Superior',
    duration: 1800,
    description: 'Ciclo formativo de administración de sistemas',
  },
]

const DEMO_CENTERS = [
  {
    name: 'Sede Central Madrid',
    slug: 'sede-madrid',
    address: 'Calle Gran Vía 1',
    city: 'Madrid',
    postalCode: '28013',
    country: 'ES',
    phone: '+34 91 123 4567',
    email: 'madrid@demo-academy.com',
    capacity: 200,
    isActive: true,
    facilities: [{ facility: 'WiFi' }, { facility: 'Parking' }, { facility: 'Cafetería' }],
  },
  {
    name: 'Sede Barcelona',
    slug: 'sede-barcelona',
    address: 'Paseo de Gracia 100',
    city: 'Barcelona',
    postalCode: '08008',
    country: 'ES',
    phone: '+34 93 456 7890',
    email: 'barcelona@demo-academy.com',
    capacity: 150,
    isActive: true,
    facilities: [{ facility: 'WiFi' }, { facility: 'Biblioteca' }],
  },
]

async function seed() {
  console.log('🌱 Starting seed process...')

  const payload = await getPayload({ config })

  try {
    // =========================================================================
    // 1. Create Superadmin User
    // =========================================================================
    console.log('\n📝 Creating superadmin user...')

    let superadmin = await payload.find({
      collection: 'users',
      where: { email: { equals: SUPERADMIN_EMAIL } },
    })

    if (superadmin.docs.length === 0) {
      superadmin = {
        docs: [
          await payload.create({
            collection: 'users',
            data: {
              email: SUPERADMIN_EMAIL,
              password: SUPERADMIN_PASSWORD,
              name: 'Superadmin',
              roles: [{ role: 'superadmin' }],
            },
          }),
        ],
        totalDocs: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
      console.log(`   ✅ Created superadmin: ${SUPERADMIN_EMAIL}`)
    } else {
      console.log(`   ⏭️  Superadmin already exists: ${SUPERADMIN_EMAIL}`)
    }

    // =========================================================================
    // 2. Create Demo Tenant
    // =========================================================================
    console.log('\n🏢 Creating demo tenant...')

    let tenant = await payload.find({
      collection: 'tenants',
      where: { slug: { equals: DEMO_TENANT.slug } },
    })

    if (tenant.docs.length === 0) {
      tenant = {
        docs: [
          await payload.create({
            collection: 'tenants',
            data: DEMO_TENANT,
          }),
        ],
        totalDocs: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
      console.log(`   ✅ Created tenant: ${DEMO_TENANT.name}`)
    } else {
      console.log(`   ⏭️  Tenant already exists: ${DEMO_TENANT.name}`)
    }

    const tenantId = tenant.docs[0].id

    // =========================================================================
    // 3. Create Demo Admin User
    // =========================================================================
    console.log('\n👤 Creating demo admin user...')

    let demoAdmin = await payload.find({
      collection: 'users',
      where: { email: { equals: DEMO_ADMIN.email } },
    })

    if (demoAdmin.docs.length === 0) {
      demoAdmin = {
        docs: [
          await payload.create({
            collection: 'users',
            data: {
              ...DEMO_ADMIN,
              roles: [{ role: 'admin' }],
              tenantId: [tenantId],
            },
          }),
        ],
        totalDocs: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
      console.log(`   ✅ Created demo admin: ${DEMO_ADMIN.email}`)
    } else {
      console.log(`   ⏭️  Demo admin already exists: ${DEMO_ADMIN.email}`)
    }

    // =========================================================================
    // 4. Create Demo Courses
    // =========================================================================
    console.log('\n📚 Creating demo courses...')

    for (const course of DEMO_COURSES) {
      const existing = await payload.find({
        collection: 'courses',
        where: {
          and: [
            { slug: { equals: course.slug } },
            { tenant: { equals: tenantId } },
          ],
        },
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'courses',
          data: {
            ...course,
            tenant: tenantId,
          },
          overrideAccess: true,
        })
        console.log(`   ✅ Created course: ${course.title}`)
      } else {
        console.log(`   ⏭️  Course already exists: ${course.title}`)
      }
    }

    // =========================================================================
    // 5. Create Demo Cycles
    // =========================================================================
    console.log('\n🔄 Creating demo cycles...')

    for (const cycle of DEMO_CYCLES) {
      const existing = await payload.find({
        collection: 'cycles',
        where: {
          and: [
            { slug: { equals: cycle.slug } },
            { tenant: { equals: tenantId } },
          ],
        },
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'cycles',
          data: {
            ...cycle,
            tenant: tenantId,
          },
          overrideAccess: true,
        })
        console.log(`   ✅ Created cycle: ${cycle.name}`)
      } else {
        console.log(`   ⏭️  Cycle already exists: ${cycle.name}`)
      }
    }

    // =========================================================================
    // 6. Create Demo Centers
    // =========================================================================
    console.log('\n🏫 Creating demo centers...')

    for (const center of DEMO_CENTERS) {
      const existing = await payload.find({
        collection: 'centers',
        where: {
          and: [
            { slug: { equals: center.slug } },
            { tenant: { equals: tenantId } },
          ],
        },
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'centers',
          data: {
            ...center,
            tenant: tenantId,
          },
          overrideAccess: true,
        })
        console.log(`   ✅ Created center: ${center.name}`)
      } else {
        console.log(`   ⏭️  Center already exists: ${center.name}`)
      }
    }

    // =========================================================================
    // Summary
    // =========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('🎉 Seed completed successfully!')
    console.log('='.repeat(60))
    console.log('\n📋 Summary:')
    console.log(`   Superadmin: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`)
    console.log(`   Demo Admin: ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`)
    console.log(`   Tenant: ${DEMO_TENANT.name} (${DEMO_TENANT.slug})`)
    console.log(`   Courses: ${DEMO_COURSES.length}`)
    console.log(`   Cycles: ${DEMO_CYCLES.length}`)
    console.log(`   Centers: ${DEMO_CENTERS.length}`)
    console.log('\n🚀 Ready to start using Akademate!')

  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

void seed()
