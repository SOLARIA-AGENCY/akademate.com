# CEP course programs

Repositorio documental para los programas PDF facilitados por CEP Formacion.

## Estructura

- `originals/`: PDFs originales, sin modificar.
- `text/`: extraccion de texto con `pdftotext -layout` para inventario, matching e ingest.
- `COURSE_PROGRAMS_INVENTORY.md`: indice, matching contra cursos existentes y checklist operativo.

## Estado

- PDFs almacenados: 24
- Textos extraidos: 24
- Fuente: `/Users/carlosjperez/Downloads`
- Fecha de incorporacion: 2026-04-30

## Uso previsto

1. Validar el matching curso PDF contra el catalogo real de Payload/Postgres.
2. Subir cada PDF como `media`.
3. Crear un `material` tipo `pdf` enlazado al `course` correspondiente.
4. Actualizar `courses.short_description`, `courses.long_description`, `courses.duration_hours` y `courses.modality` cuando el dato extraido sea mejor que el existente.
5. Crear cursos faltantes cuando el programa no tenga curso equivalente.
