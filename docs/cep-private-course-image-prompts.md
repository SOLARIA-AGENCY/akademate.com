# CEP cursos - prompts de imagen

Fuente operativa:
- `apps/tenant-admin/scripts/cep-course-image-prompts.ts`
- compatibilidad privada: `apps/tenant-admin/scripts/cep-private-course-image-prompts.ts`

## Uso

- Script batch generico: `apps/tenant-admin/scripts/generate-course-images.ts`
- Script batch legado privados: `apps/tenant-admin/scripts/generate-private-course-images.ts`
- Dry-run:

```bash
cd apps/tenant-admin
pnpm tsx scripts/generate-course-images.ts --type=privado
```

- Ejecucion real:

```bash
cd apps/tenant-admin
OPENAI_API_KEY=... pnpm tsx scripts/generate-course-images.ts --type=privado --apply
```

- Para regenerar aunque el curso ya tenga imagen:

```bash
cd apps/tenant-admin
OPENAI_API_KEY=... pnpm tsx scripts/generate-course-images.ts --type=privado --apply --replace-existing
```

## Catalogo

El catalogo completo se mantiene en el archivo TypeScript para poder reutilizarlo programaticamente durante la generacion y vinculacion automatica al curso.

Tipologias previstas:
- `privado`
- `ocupados`
- `desempleados`
- `teleformacion`

## Criterio visual

- Priorizar escenas de aula, practica, consulta, cabina, clinica, set o entorno real de trabajo.
- Evitar que todas las portadas se conviertan en retratos de un solo personaje mirando a camara.
- Favorecer interaccion, supervision, aprendizaje aplicado, pequenos equipos o contexto profesional visible.
- Reservar el encuadre mas posado solo para casos sensibles donde convenga evitar contenido demasiado descriptivo.
- Codificacion de acento por tipologia:
  - privados: rojo
  - ocupados: verde
  - desempleados: azul
  - teleformacion: naranja
- Si un curso comparte su tipologia principal con modalidad de teleformacion, mantener el color principal de tipologia y sumar naranja como acento secundario tecnologico.
