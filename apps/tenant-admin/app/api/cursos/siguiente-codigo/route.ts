import { getPayloadHMR } from '@payloadcms/next/utilities';
import type { Payload } from 'payload';
import configPromise from '@payload-config';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/cursos/siguiente-codigo?areaId=xxx&tipo=privados
 *
 * Genera el siguiente código secuencial para un curso
 * Formato: {AREA_CODE}-{TIPO_CODE}-{SECUENCIAL}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get('areaId');
    const tipo = searchParams.get('tipo');

    if (!areaId || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Parámetros areaId y tipo son requeridos' },
        { status: 400 }
      );
    }

     
    const payload: Payload = await getPayloadHMR({ config: configPromise });

    // 1. Obtener código del área
    const area = await payload.findByID({
      collection: 'areas-formativas',
      id: areaId,
    }) as { codigo: string } | null;

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Área formativa no encontrada' },
        { status: 404 }
      );
    }

    // 2. Mapeo de tipos a códigos
    const TIPO_CODES: Record<string, string> = {
      privados: 'PRIV',
      ocupados: 'OCUP',
      desempleados: 'DESE',
      teleformacion: 'TELE',
    };

    const tipoCode = TIPO_CODES[tipo];
    if (!tipoCode) {
      return NextResponse.json(
        { success: false, error: `Tipo de curso inválido: ${tipo}` },
        { status: 400 }
      );
    }

    // 3. Buscar último curso con este prefijo
    const prefix = `${area.codigo}-${tipoCode}-`;

    const ultimosCursos = await payload.find({
      collection: 'courses',
      where: {
        codigo: {
          like: `${prefix}%`,
        },
      },
      sort: '-codigo',
      limit: 1,
    });

    // 4. Calcular siguiente secuencial
    let secuencial = 1;
    if (ultimosCursos.docs.length > 0) {
      const firstDoc = ultimosCursos.docs[0] as { codigo: string };
      const ultimoCodigo = firstDoc.codigo;
      const match = /(\d{4})$/.exec(ultimoCodigo);
      if (match) {
        secuencial = parseInt(match[1], 10) + 1;
      }
    }

    // 5. Generar código completo
    const secuencialStr = secuencial.toString().padStart(4, '0');
    const codigoCompleto = `${prefix}${secuencialStr}`;

    return NextResponse.json({
      success: true,
      data: {
        codigo: codigoCompleto,
        area_codigo: area.codigo,
        tipo_codigo: tipoCode,
        secuencial: secuencialStr,
      },
    });
  } catch (error) {
    console.error('Error generating course code:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar código de curso' },
      { status: 500 }
    );
  }
}
