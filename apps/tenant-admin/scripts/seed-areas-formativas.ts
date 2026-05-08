import { getPayload } from 'payload'
import configPromise from '@payload-config';

const AREAS_INICIALES = [
  {
    nombre: 'Marketing Digital',
    codigo: 'MKT',
    descripcion: 'Estrategias de marketing online, redes sociales, SEO, SEM',
    color: '#FF5733',
    activo: true,
  },
  {
    nombre: 'Desarrollo Web',
    codigo: 'DEV',
    descripcion: 'Programación frontend y backend, frameworks modernos',
    color: '#3498DB',
    activo: true,
  },
  {
    nombre: 'Diseño Gráfico',
    codigo: 'DIS',
    descripcion: 'Diseño visual, UX/UI, herramientas creativas',
    color: '#9B59B6',
    activo: true,
  },
  {
    nombre: 'Audiovisual',
    codigo: 'AUD',
    descripcion: 'Producción de video, edición, post-producción',
    color: '#E74C3C',
    activo: true,
  },
  {
    nombre: 'Gestión Empresarial',
    codigo: 'GES',
    descripcion: 'Administración, finanzas, recursos humanos',
    color: '#2ECC71',
    activo: true,
  },
];

async function seed() {
  console.log('🌱 Iniciando seed de Áreas Formativas...');

  try {
    const payload = await getPayload({ config: configPromise });

    for (const area of AREAS_INICIALES) {
      // Check if already exists
      const existing = await payload.find({
        collection: 'areas-formativas',
        where: {
          codigo: {
            equals: area.codigo,
          },
        },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        console.log(`⏭️  ${area.codigo} ya existe, saltando...`);
        continue;
      }

      // Create
      await payload.create({
        collection: 'areas-formativas',
        data: area,
      });

      console.log(`✅ ${area.codigo} - ${area.nombre} creado`);
    }

    console.log('\n🎉 Seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
