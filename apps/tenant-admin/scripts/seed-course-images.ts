#!/usr/bin/env tsx

/**
 * Script para agregar imágenes a los cursos existentes
 *
 * Este script:
 * 1. Asigna URLs de Unsplash apropiadas según el tipo de curso
 * 2. Crea registros en la colección media
 * 3. Asocia las imágenes a los cursos correspondientes
 *
 * Uso: cd apps/cms && pnpm tsx scripts/seed-course-images.ts
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Mapeo de áreas formativas y tipos a imágenes relevantes de Unsplash
const COURSE_IMAGE_MAPPINGS: Record<string, string> = {
  // Marketing
  'MKT-PRIV': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Marketing digital
  'MKT-OCUP': 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop', // SEO/Analytics
  'MKT-DESE': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=600&fit=crop', // Social Media
  'MKT-TELE': 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&h=600&fit=crop', // Online courses

  // Desarrollo/Programación
  'DEV-PRIV': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop', // Coding
  'DEV-OCUP': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop', // Dev workspace
  'DEV-DESE': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop', // Programming
  'DEV-TELE': 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=600&fit=crop', // Remote dev

  // Diseño
  'DIS-PRIV': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', // Design tools
  'DIS-OCUP': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop', // Graphic design
  'DIS-DESE': 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=800&h=600&fit=crop', // Creative work
  'DIS-TELE': 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800&h=600&fit=crop', // Digital design

  // Audiovisual
  'AUD-PRIV': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop', // Video production
  'AUD-OCUP': 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=600&fit=crop', // Camera
  'AUD-DESE': 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&h=600&fit=crop', // Studio
  'AUD-TELE': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop', // Online video

  // Comunicación
  'COM-PRIV': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop', // Team communication
  'COM-OCUP': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop', // Business meeting
  'COM-DESE': 'https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=800&h=600&fit=crop', // Public speaking
  'COM-TELE': 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=600&fit=crop', // Video call

  // Default fallback
  'DEFAULT': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop', // Education
}

// Esta versión simplificada usa URLs directas en lugar de descargar archivos
// Es más eficiente para desarrollo y funciona perfectamente con Unsplash

// Función para obtener imagen basada en código de curso
function getImageUrlForCourse(courseCode: string): string {
  // Extraer área y tipo del código (ej: MKT-PRIV-0001 -> MKT-PRIV)
  const parts = courseCode.split('-')
  if (parts.length >= 2) {
    const prefix = `${parts[0]}-${parts[1]}`
    return COURSE_IMAGE_MAPPINGS[prefix] || COURSE_IMAGE_MAPPINGS.DEFAULT
  }
  return COURSE_IMAGE_MAPPINGS.DEFAULT
}

async function seedCourseImages() {
  console.log('🎨 Iniciando seed de imágenes de cursos...\n')

  try {
    const payload = await getPayload({ config: configPromise })

    // 1. Obtener todos los cursos sin imagen
    const courses = await payload.find({
      collection: 'courses',
      where: {
        featured_image_id: {
          equals: null
        }
      },
      limit: 100
    })

    console.log(`📚 Encontrados ${courses.totalDocs} cursos sin imagen\n`)

    if (courses.totalDocs === 0) {
      console.log('✅ Todos los cursos ya tienen imagen asignada')
      return
    }

    // 2. Procesar cada curso
    let successCount = 0
    let errorCount = 0

    for (const course of courses.docs) {
      try {
        console.log(`📥 Procesando: ${course.codigo} - ${course.name}`)

        // Obtener URL de imagen apropiada
        const imageUrl = getImageUrlForCourse(course.codigo)
        console.log(`   URL: ${imageUrl}`)

        // Crear entrada en media collection con URL directa
        // NOTA: Payload puede almacenar URLs externas directamente
        const mediaEntry = await payload.create({
          collection: 'media',
          data: {
            alt: `Imagen del curso: ${course.name}`,
            url: imageUrl, // URL externa (Unsplash)
            filename: `${course.codigo.toLowerCase()}.jpg`,
            mimeType: 'image/jpeg',
            filesize: 0, // Placeholder para URLs externas
            width: 800,
            height: 600,
          }
        })

        console.log(`   ✓ Media creada con ID: ${mediaEntry.id}`)

        // Actualizar curso con la imagen
        await payload.update({
          collection: 'courses',
          id: course.id,
          data: {
            featured_image: mediaEntry.id
          }
        })

        console.log(`   ✅ Curso actualizado con imagen\n`)
        successCount++

      } catch (error: any) {
        console.error(`   ❌ Error procesando ${course.codigo}:`, error.message || error)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Seed completado:`)
    console.log(`   - Éxitos: ${successCount}`)
    console.log(`   - Errores: ${errorCount}`)
    console.log(`   - Total: ${courses.totalDocs}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }
}

// Ejecutar script
seedCourseImages()
  .then(() => {
    console.log('\n✨ Proceso finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
