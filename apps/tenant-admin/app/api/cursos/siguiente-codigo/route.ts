import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

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

    const payload = await getPayloadHMR({ config: configPromise });

    // 1. Obtener código del área
    const area = await payload.findByID({
      collection: 'areas-formativas',
      id: areaId,
    });

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
      const ultimoCodigo = ultimosCursos.docs[0].codigo;
      const match = ultimoCodigo.match(/(\d{4})$/);
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
