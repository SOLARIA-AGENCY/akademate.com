# CEP course programs inventory

## Executive Summary

- ✓ PDFs almacenados en repo: 24/24
- ✓ Texto extraido: 24/24
- ✓ Matching final: 24 PDFs cubiertos, 26 relaciones curso-PDF preparadas (incluye PDFs aplicados a 2 cursos)
- ⚠ Validacion pendiente: cruzar contra BD real de Payload/Postgres antes de aplicar cambios
- ✓ Creacion preparada si no existen: Nutricosmetica, Nutricion Deportiva Online 100h, Nutricion en la Practica Deportiva Online 200h, Seminario Unycop, Dietetica y Nutricion Online, CFGM Farmacia y Parafarmacia, CFGS Higiene Bucodental

## Inventory

| PDF | Pages | Words | Modality detected | Hours detected | Proposed course match | Status |
| --- | ---: | ---: | --- | --- | --- | --- |
| `ACV AUXILIAR CLINICO VETERINARIO.pdf` | 7 | 1525 | Presencial | 108h / 350h | Auxiliar Clinico Veterinario (`auxiliar-clinico-veterinario-priv`) | ✓ adjuntar + revisar horas |
| `ADIESTRAMIENTO CANINO.pdf` | 6 | 992 | Presencial / Online mention | 72h | Adiestramiento Canino I y Adiestramiento Canino II | ✓ aplicar a ambos |
| `AGENTE FUNERARIO.pdf` | 13 | 3145 | Presencial | 160h / 120h | Agente Funerario (Tanatopraxia y Tanatoestetica) | ✓ adjuntar + revisar horas |
| `ATV AYUDANTE TECNICO VETERINARIO.pdf` | 7 | 1108 | Presencial / online bajo consulta | 120h / 50h | Ayudante Tecnico Veterinario (ATV) | ✓ adjuntar |
| `AUX FARMACIA, PARAFARMACIA Y DERMOCOSMÉTICA.pdf` | 6 | 763 | Presencial / online bajo consulta | 120h / 350h | Farmacia y Dermocosmetica | ✓ adjuntar + revisar nombre |
| `AUXILIAR CLINICAS ESTETICAS.pdf` | 6 | 938 | Presencial | 120h / 150h | Auxiliar de Clinicas Esteticas | ✓ adjuntar + revisar horas |
| `AUXILIAR DE ENFERMERÍA.pdf` | 6 | 866 | Presencial | 300h / 120h | Auxiliar de Enfermeria | ✓ adjuntar + revisar horas |
| `AUXILIAR DE ODONTOLOGIA ONLINE.pdf` | 5 | 611 | Online | 300h | Auxiliar de Odontologia e Higiene online | ✓ adjuntar |
| `AUXILIAR ODONTOLOGÍA INTENSIVO.pdf` | 5 | 596 | Presencial | 300h / 200h / 120h | Auxiliar de Odontologia e Higiene | ✓ adjuntar + revisar horas |
| `CFGM FARMACIA.pdf` | 6 | 697 | Semipresencial | 500h | CFGM Farmacia y Parafarmacia | ✓ crear si no existe |
| `CFGS HIGIENE BUCODENTAL.pdf` | 6 | 720 | Semipresencial | 500h | CFGS Higiene Bucodental | ✓ crear si no existe |
| `DIETETICA Y NUTRICION ONLINE.pdf` | 5 | 576 | Online | 400h | Dietetica y Nutricion Online | ✓ crear si no existe |
| `DIETETICA Y NUTRICION.pdf` | 6 | 730 | Presencial | 150h | Dietetica y Nutricion | ✓ adjuntar |
| `ENTRENAMIENTO PERSONAL.pdf` | 6 | 907 | Presencial | 120h | Entrenamiento Personal | ✓ adjuntar |
| `ESPECIALISTA EN URGENCIAS, LABORATORIO Y REHABILITACIÓN VETERINARIA.pdf.pdf` | 8 | 1298 | Presencial | 108h / 100h | Especializacion Clinica Avanzada para ACV | ✓ aplicar |
| `INSTRUCTOR PILATES.pdf` | 6 | 856 | Presencial | 3h detectada en asistencia | Instructor o Instructora de Pilates | ✓ adjuntar + extraer duracion real manualmente |
| `INSTRUCTOR YOGA.pdf` | 8 | 1278 | Presencial | 200h | Instructor o Instructora de Yoga | ✓ adjuntar |
| `NUTRICOSMÉTICA.pdf` | 5 | 466 | Presencial | 48h / 4h | Nutricosmetica | ✓ crear si no existe |
| `Nutrición Deportiva Online 100h.pdf` | 6 | 1040 | 100% online | 100h | Nutricion Deportiva Online | ✓ crear si no existe |
| `Nutrición en la Práctica Deportiva Online 200h.pdf` | 7 | 1346 | Online | 200h / 6h / 150h | Nutricion en la Practica Deportiva Online | ✓ crear si no existe |
| `PELUQUERIA CANINA Y FELINA.pdf` | 7 | 1090 | Presencial | 72h | Peluqueria Canina y Felina | ✓ adjuntar |
| `PROTECCION, BIENESTAR ANIMAL Y MARCO LEGAL.pdf` | 6 | 976 | Online | 200h | Proteccion, Bienestar Animal y Marco Legal | ✓ aplicar al curso base; despublicar version actual |
| `QUIROMASAJE HOLISTO.pdf` | 6 | 911 | Presencial | 100h / 176h | Quiromasaje y Quiromasaje - 11 meses | ✓ aplicar a ambos |
| `SEMINARIO UNYCOP.pdf.pdf` | 5 | 404 | Presencial | 12h | Seminario Practico Gestion Unycop | ✓ crear si no existe |

## Course Matching Checklist

- [x] Almacenar PDFs originales en `docs/course-programs/cep/originals/`
- [x] Extraer texto a `docs/course-programs/cep/text/`
- [x] Crear inventario inicial
- [x] Matching preliminar contra seeds/scripts del catalogo CEP
- [x] Preparar dataset de 26 relaciones curso-PDF en `apps/tenant-admin/scripts/cep-course-programs-data.ts`
- [x] Preparar creacion de 7 cursos si faltan
- [x] Preparar importador idempotente en `apps/tenant-admin/scripts/import-cep-course-programs.ts`
- [ ] Ejecutar consulta contra BD real de Payload/Postgres para obtener `id`, `slug`, `course_type`, `duration_hours`, `modality`, `short_description`, `long_description`
- [ ] Confirmar cursos con matching ambiguo:
  - [x] Adiestramiento Canino: aplicar a I y II
  - [x] Quiromasaje: aplicar a base y 11 meses
  - [x] Proteccion/Bienestar Animal: aplicar al curso base y despublicar version actual
  - [x] Especialista Urgencias/Laboratorio/Rehabilitacion Veterinaria: aplicar a `Especializacion Clinica Avanzada para ACV`
  - [x] Nutricosmetica: crear curso si falta
- [x] Confirmar destino de ciclos:
  - [x] `CFGM FARMACIA.pdf`: crear curso si falta
  - [x] `CFGS HIGIENE BUCODENTAL.pdf`: crear curso si falta
- [x] Crear cursos faltantes aprobados en importador
- [ ] Subir PDFs a Media con tenant CEP
- [ ] Crear `materials` tipo `pdf` enlazados a cada curso
- [ ] Actualizar metadatos de curso desde programa validado
- [ ] Validar publicacion en web publica y campus

## Data Extraction Plan

1. Normalizar nombre PDF y curso:
   - quitar tildes para matching
   - comparar por tokens fuertes: `odontologia`, `atv`, `farmacia`, `pilates`, `higiene`, etc.
   - mantener variantes `online`, `intensivo`, `11 meses`, `actual`

2. Extraer campos candidatos:
   - `duration_hours`: tomar la duracion comercial principal, no horas de practicas/tutorias cuando aparezcan mezcladas
   - `modality`: `online`, `presencial`, `hibrido/semipresencial`
   - `short_description`: resumen comercial del primer bloque descriptivo
   - `long_description`: objetivos + temario/modulos + salidas/beneficios
   - `price_notes`: solo si el PDF contiene precio completo y vigente

3. Aplicar a plataforma:
   - `courses.short_description`
   - `courses.long_description`
   - `courses.duration_hours`
   - `courses.modality`
   - `materials.course`
   - `materials.file`
   - `materials.material_type = pdf`
   - `materials.is_published = true` solo tras validacion

4. Control de calidad:
   - verificar que cada PDF tenga `tenant_id` CEP via Media/Material/Course
   - no sobrescribir descripciones mejores sin diff humano
   - marcar cursos ambiguos como `pending_validation`
   - registrar fuente PDF y fecha de ingest en notas internas si existe campo disponible

## Courses Created If Missing

| Course | Suggested type | Area | Modality | Duration | Reason |
| --- | --- | --- | --- | ---: | --- |
| Dietetica y Nutricion Online | teleformacion | Salud/Bienestar | online | 400h | Variante online distinta del curso presencial |
| Nutricion Deportiva Online | teleformacion | Salud/Bienestar | online | 100h | Programa propio |
| Nutricion en la Practica Deportiva Online | teleformacion | Salud/Bienestar | online | 200h | Programa propio |
| Nutricosmetica | privado | Salud/Bienestar | presencial | 48h | Programa propio |
| Seminario Practico Gestion Unycop | privado | Sanitaria | presencial | 12h | Seminario practico especifico |
| CFGM Farmacia y Parafarmacia | ciclo_medio | Sanitaria | hibrido | 500h | Ciclo/curso creado si falta |
| CFGS Higiene Bucodental | ciclo_superior | Sanitaria | hibrido | 500h | Ciclo/curso creado si falta |

## Immediate Next Actions

- [ ] Hacer dry-run contra Payload para cruzar IDs reales.
- [ ] Preparar script idempotente `import-cep-course-programs.ts` que:
  - [x] suba PDFs a `media`
  - [x] cree/actualice `materials`
  - [x] actualice campos de `courses` solo con `--apply`
  - [x] emita reporte JSON con updated/skipped/conflicts/errors
- [ ] Ejecutar primero en dry-run y revisar conflictos P1/P2.
- [ ] Aplicar solo los matches directos; dejar ambiguos en `pending_validation`.
- [x] Despublicacion preparada para `proteccion-bienestar-animal-y-marco-legal-actual-priv` mediante `active=false` y `operational_status=inactive`.

## Import Command

Dry-run:

```bash
pnpm --filter @akademate/tenant-admin import:cep:course-programs -- --tenant-id=1 --json
```

Apply conservador (solo rellena campos de curso vacios, adjunta PDF y publica material):

```bash
pnpm --filter @akademate/tenant-admin import:cep:course-programs -- --tenant-id=1 --apply
```

Apply con sustitucion de campos de curso:

```bash
pnpm --filter @akademate/tenant-admin import:cep:course-programs -- --tenant-id=1 --apply --replace-course-fields
```
