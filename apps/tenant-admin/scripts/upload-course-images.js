#!/usr/bin/env tsx
/**
 * Script para descargar imágenes de Unsplash y subirlas a Payload CMS
 *
 * Este script:
 * 1. Descarga imágenes de Unsplash
 * 2. Las sube a Payload usando la API interna (sin autenticación HTTP)
 * 3. Asocia las imágenes a los cursos correspondientes
 *
 * Uso: cd apps/cms && pnpm tsx scripts/upload-course-images.ts
 */
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import fs from 'fs';
import path from 'path';
import https from 'https';
// Mapeo de códigos de curso a URLs de Unsplash
const COURSE_IMAGES = {
    'MKT-PRIV-0001': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    'MKT-OCUP-0001': 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop',
    'DEV-PRIV-0001': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
    'MKT-PRIV-0002': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=600&fit=crop',
    'DIS-PRIV-0001': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'MKT-PRIV-0003': 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&h=600&fit=crop',
    'MKT-PRIV-0004': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    'DEV-DESE-0001': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop',
};
// Directorio temporal para imágenes
const TEMP_DIR = '/tmp/course-images';
// Asegurar que existe el directorio
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
/**
 * Descarga una imagen de Unsplash
 */
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
            file.on('error', (err) => {
                fs.unlinkSync(filepath);
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlinkSync(filepath);
            reject(err);
        });
    });
}
async function uploadCourseImages() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  DESCARGA Y SUBIDA DE IMÁGENES DE CURSOS A PAYLOAD');
    console.log('═══════════════════════════════════════════════════════════════\n');
    try {
        const payload = await getPayload({ config: configPromise });
        // 1. Obtener todos los cursos
        console.log('1️⃣  Obteniendo lista de cursos...');
        const courses = await payload.find({
            collection: 'courses',
            limit: 100,
        });
        console.log(`   ✓ Encontrados ${courses.totalDocs} cursos\n`);
        let successCount = 0;
        let errorCount = 0;
        // 2. Procesar cada curso
        for (const course of courses.docs) {
            const codigo = course.codigo;
            const nombre = course.name;
            console.log('─'.repeat(70));
            console.log(`📚 Curso: ${codigo} - ${nombre}`);
            console.log('─'.repeat(70));
            // Verificar si tenemos imagen para este curso
            if (!COURSE_IMAGES[codigo]) {
                console.log(`  ⚠️  No hay imagen definida para ${codigo} - SKIP\n`);
                continue;
            }
            try {
                // 1. Descargar imagen
                const imageUrl = COURSE_IMAGES[codigo];
                const filename = `${codigo.toLowerCase()}.jpg`;
                const filepath = path.join(TEMP_DIR, filename);
                console.log(`  📥 Descargando: ${filename}`);
                console.log(`     URL: ${imageUrl}`);
                await downloadImage(imageUrl, filepath);
                const fileStats = fs.statSync(filepath);
                console.log(`     ✓ Descargado: ${filepath} (${fileStats.size} bytes)`);
                // 2. Leer archivo como buffer
                const fileBuffer = fs.readFileSync(filepath);
                // 3. Crear entrada en media collection
                console.log(`  📤 Subiendo a Payload...`);
                const mediaEntry = await payload.create({
                    collection: 'media',
                    data: {
                        alt: `Imagen del curso: ${nombre}`,
                    },
                    file: {
                        data: fileBuffer,
                        mimetype: 'image/jpeg',
                        name: filename,
                        size: fileStats.size,
                    },
                });
                console.log(`     ✓ Media creada con ID: ${mediaEntry.id}`);
                // 4. Actualizar curso con la imagen
                console.log(`  🔄 Actualizando curso...`);
                await payload.update({
                    collection: 'courses',
                    id: course.id,
                    data: {
                        featured_image: mediaEntry.id,
                    },
                });
                console.log(`     ✓ Curso actualizado con imagen\n`);
                successCount++;
            }
            catch (error) {
                console.error(`  ❌ Error procesando ${codigo}:`, error.message || error);
                console.log();
                errorCount++;
            }
        }
        // Resumen
        console.log('\n' + '═'.repeat(70));
        console.log(`  RESUMEN FINAL`);
        console.log('═'.repeat(70));
        console.log(`  ✓ Exitosos: ${successCount}`);
        console.log(`  ✗ Errores:  ${errorCount}`);
        console.log(`  📊 Total:    ${successCount + errorCount}`);
        console.log('═'.repeat(70) + '\n');
    }
    catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
}
// Ejecutar script
uploadCourseImages()
    .then(() => {
    console.log('\n✨ Proceso finalizado');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
});
//# sourceMappingURL=upload-course-images.js.map