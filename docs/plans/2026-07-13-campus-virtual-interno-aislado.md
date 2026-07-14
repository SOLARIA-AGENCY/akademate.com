# Plan de desarrollo: Campus Virtual CEP en entorno aislado

**Fecha:** 2026-07-13
**Estado:** Plan aprobado para desarrollo interno. Campus cerrado en produccion.
**Rama prevista:** `codex/campus-internal`
**Propietario funcional:** CEP Formacion
**Objetivo:** construir y validar el Campus Virtual de CEP sin modificar, reiniciar ni interrumpir los servicios productivos actuales.

## 1. Objetivo ejecutivo

Construir una primera version operativa del Campus Virtual con:

1. Identidad y credenciales de alumnos.
2. Invitacion y recuperacion de contrasena.
3. Acceso basado en matriculas activas.
4. Cursos, modulos y lecciones.
5. Materiales protegidos, empezando por PDF.
6. Progreso basico por leccion.
7. Panel interno para gestionar contenidos.
8. Auditoria, permisos, pruebas y rollback.

La cadena funcional objetivo es:

```text
Alumno
  -> Cuenta de campus
  -> Matricula activa
  -> Convocatoria
  -> Curso
  -> Modulos
  -> Lecciones
  -> Materiales
  -> Progreso
```

La entrega inicial sera exclusivamente interna. No se anadira navegacion publica, no se abrira el campus a alumnos reales y no se reutilizaran servicios productivos.

## Estado de ejecucion local - 2026-07-13

Este corte distingue implementacion en rama de trabajo de evidencia de staging. No se han ejecutado migraciones, builds, reinicios ni escrituras contra produccion.

### Implementado en `codex/campus-internal`

- Guardrail de entorno: el Campus queda cerrado si no existe `CAMPUS_INTERNAL_ENABLED=true`, una etiqueta explicita `CAMPUS_ENVIRONMENT` no productiva y un secreto JWT de staging suficientemente largo. La etiqueta evita depender de `NODE_ENV`, que Next fija a `production` en imagenes optimizadas.
- Contrato canonico de sesion con cookie `httpOnly`: login, sesion, logout, invitacion, activacion, recuperacion y restablecimiento.
- Rate limit basico de login y respuestas genericas para credenciales invalidas y recuperacion de cuenta.
- Campo de credenciales LMS en `Students` sin exponer el hash en lecturas administrativas normales.
- Relacion aislada `CampusEnrollments` para vincular alumnos con matriculas activas sin reescribir la relacion historica de `Enrollments`.
- Migracion aditiva protegida para tokens, matriculas LMS, modulos, lecciones, materiales y progreso.
- Lectura de contenido condicionada a sesion, tenant, matricula activa y estado publicado.
- Descarga de materiales a traves de una ruta protegida; no se devuelve directamente una URL publica de archivo.
- Progreso por leccion con validacion de pertenencia y almacenamiento reversible.
- Compose de staging con contenedores, volumenes, base, SMTP Mailpit y secretos separados.
- Tests focalizados de contrato de aislamiento, contenido protegido y progreso protegido.

### Pendiente de evidencia en staging

- Validar funcionalmente las reglas de gamificacion con CEP antes de activar la bandera en cualquier entorno compartido.
- Verificar con CEP los permisos de gestion de contenidos antes de cualquier futura promocion.

### Evidencia de staging obtenida - 2026-07-13

- Se levanto un stack independiente con base `akademate_campus_staging`, puertos y volumenes propios, Mailpit y `CAMPUS_ENVIRONMENT=staging`.
- El encadenado de migraciones se hizo reproducible en staging: se incorporo la tabla base `classrooms` que faltaba en una cadena historica y una compatibilidad staging-only para columnas de integracion, relaciones bloqueadas y nombres snake_case de `lesson_progress`.
- Se creo un seed completamente ficticio: un alumno, una matricula, un curso, una convocatoria, un modulo, dos lecciones y un material de prueba.
- Login y sesion devuelven `200`; la sesion usa cookie `campus_session` `HttpOnly`; logout invalida la sesion.
- Dashboard devuelve una matricula confirmada, `totalCourses=1` y progreso real `50%`; el detalle de matricula devuelve un curso, un modulo, dos lecciones y el mismo progreso.
- Contenido, modulo, leccion y material protegido responden correctamente con sesion; el material se entrega mediante la ruta protegida y no con una URL publica directa.
- El progreso se conserva en `lesson_progress`; el acceso sin cookie devuelve `401`, una matricula ajena devuelve `403` y un tiempo negativo devuelve `400`.
- Backup y restore se ensayaron sobre una base temporal staging: el dump se restaura y conserva `students=1`, `campus_enrollments=1`, `modules=1`, `lessons=2` y `lesson_progress=1`.
- E2E Chromium pasa `3/3` con usuario ficticio. Firefox y WebKit tambien pasan `3/3`.

### Evidencia adicional - 2026-07-14

- Seed controlado de administrador ficticio para staging; aborta fuera de staging/dev/test/local.
- E2E Mailpit `1/1`: login de gestor, invitacion, captura del enlace, activacion, rechazo de reutilizacion, recuperacion, restablecimiento y rechazo de reutilizacion.
- Corregida la lectura de sesion Payload del gestor: la ruta prueba cookie y representaciones JWT canonicas, por lo que la invitacion funciona con el `payload-token` real del navegador.
- Compatibilidad staging-only para columnas de auth de `users` que faltaban y para la nulabilidad de `password` requerida por Payload. No se aplica fuera de staging.
- Gamificacion bajo `CAMPUS_GAMIFICATION_ENABLED=false`; `/api/campus/gamification` devuelve una estructura estable sin consultar colecciones antiguas.
- La implementacion de gamificacion queda derivada, en modo lectura, de `lesson_progress` y `campus_enrollments`; no crea tablas ni escribe puntos o insignias.
- `tsc --noEmit` pasa; tests focalizados `16/16`; contrato de aislamiento `5/5`.
- Imagen `akademate-campus-tenant:staging-local` construida con contexto reducido. El contenedor smoke responde health `200` y sesion Campus sin cookie `401`; la imagen no se publico ni se levanto con Compose.
- El Dockerfile de build instala las herramientas nativas en la etapa aislada de compilacion para evitar el fallback opcional de `bufferutil`; no se incorporan herramientas de compilacion a la imagen runtime.

### Evidencia negativa de produccion

- No se ha usado la `DATABASE_URL` productiva.
- No se ha aplicado la migracion en produccion.
- No se han reiniciado contenedores productivos.
- No se han enviado correos reales desde el flujo de Campus.
- No se ha modificado el menu publico ni se ha publicado el Campus.
- No se ha usado la base, volumen, secreto, contenedor ni dominio de produccion.

## 2. Hallazgos actuales

### 2.1 Codigo existente

- Existe la aplicacion `apps/campus`.
- Existe login especifico de campus en `apps/tenant-admin/app/api/campus/login/route.ts`.
- Existen pantallas de dashboard, cursos, lecciones, progreso, asistencia y certificados en distinto nivel de madurez.
- Existen colecciones Payload para `Modules`, `Lessons`, `Materials` y `LessonProgress`.
- Existen APIs internas de LMS en `apps/tenant-admin/app/api/lms`.
- Existen tipos y servicios LMS en `packages/lms`.

### 2.2 Inconsistencias que deben resolverse primero

- `apps/campus/app/_components/LoginForm.tsx` usa un endpoint de desarrollo.
- `apps/campus/lib/session-context.tsx` llama a `/api/users/login`.
- La autenticacion real de alumnos esta implementada en `/api/campus/login`.
- Hay contratos distintos entre el campus separado y el campus servido desde tenant-admin.
- No se debe activar ningun flujo hasta elegir un contrato canonico.

Contrato elegido para el MVP interno: el Campus alumno servido por `tenant-admin` en `/campus`, con las rutas `/api/campus/auth/*` y `/api/lms/*`. La aplicacion independiente `apps/campus` conserva un scaffold historico con contratos `/api/users/*`; queda fuera de la evidencia del MVP y su servicio se marca como perfil `legacy` en el compose de staging para no exponer un login paralelo.

### 2.3 Produccion

La inspeccion realizada sobre la base de datos productiva mostro que existen matriculas, pero no estan creadas las tablas LMS necesarias para:

- `modules`
- `lessons`
- `materials`
- `lesson_progress`

Por tanto, los PDFs importados se mantienen correctamente como dossiers asociados a los cursos mediante `dossier_pdf`. No se debe intentar convertirlos en materiales LMS en produccion hasta que exista una migracion aprobada y probada.

## 3. Contrato de no afectacion de produccion

Estas reglas son obligatorias y bloquean la entrega si se incumplen.

### 3.1 Prohibiciones

- No usar `DATABASE_URL` productiva en desarrollo, tests o migraciones.
- No ejecutar `payload migrate`, `drizzle migrate` ni `PAYLOAD_DB_PUSH` contra produccion.
- No montar el volumen productivo `media_data`.
- No usar el bucket productivo de Media.
- No usar secretos productivos.
- No enviar correos reales desde staging.
- No modificar el compose productivo para desarrollar el campus.
- No reiniciar `akademate-tenant`, `akademate-db` ni otros contenedores productivos.
- No cambiar middleware, rutas publicas o menus publicos como parte del MVP interno.
- No aplicar migraciones automaticamente al arrancar un contenedor.
- No ejecutar dos builds o reinicios productivos simultaneos.

### 3.2 Barreras automaticas

Antes de cualquier migracion o importacion se debe validar:

- Host de base de datos permitido.
- Nombre de base de datos terminado en `_staging`, `_dev` o `_test`.
- Volumen de Media distinto del productivo.
- Secretos de entorno con sufijo `_STAGING` o `_DEV`.
- SMTP de captura o Mailpit.
- `CAMPUS_ENABLED=false` por defecto.

El proceso debe abortar con error si detecta dominios, contenedores, volumenes o variables productivas.

### 3.3 Separacion de ramas y worktrees

- La rama de trabajo sera `codex/campus-internal`.
- Se usara un worktree separado del checkout utilizado para operaciones productivas.
- Ningun despliegue activara el Campus por defecto: `CAMPUS_INTERNAL_ENABLED` no se habilita y no se ejecutan migraciones Campus en produccion.
- Cualquier activacion futura necesitara aprobacion expresa y un procedimiento independiente.

## 4. Entornos

### 4.1 Desarrollo local

Uso:

- Desarrollo de UI, APIs y modelos.
- Tests unitarios.
- Tests de integracion con base efimera.

Caracteristicas:

- PostgreSQL local o contenedor temporal.
- Mailpit.
- Media local o bucket de desarrollo.
- Usuarios y datos ficticios.
- Sin acceso de red a la base productiva.

### 4.2 Staging interno

Uso:

- Migraciones reales de prueba.
- Tests E2E.
- Prueba de login y matriculas.
- Validacion por CEP.

Caracteristicas:

- Base `akademate_staging` independiente.
- Volumen `campus_staging_media` independiente.
- Secretos propios.
- SMTP de captura.
- Dominio privado o acceso protegido.
- No indexable.
- Sin enlaces desde la web publica.
- El compose por defecto arranca solo los servicios necesarios para el contrato canonico de `tenant-admin`; `apps/campus`, portal, Nginx y certbot solo aparecen bajo el perfil `legacy`.

El compose de staging existente debe revisarse antes de utilizarlo: el servicio de campus debe quedar aislado y no compartir datos ni almacenamiento con la instancia productiva.

### 4.3 Produccion

Durante todo el desarrollo del MVP:

- Se observa solo en modo lectura si es necesario.
- No se aplican migraciones.
- No se despliega el campus.
- No se cambia la aplicacion actual.
- No se actualiza el volumen de Media.

## 5. Arquitectura funcional objetivo

### 5.1 Identidad

La identidad academica sera el alumno de campus, separada de los usuarios internos del dashboard.

Componentes:

- Alumno.
- Cuenta de campus.
- Estado activo/inactivo.
- Email normalizado.
- Hash de contrasena.
- Ultimo acceso.
- Sesiones activas.
- Tokens de invitacion y recuperacion.

### 5.2 Autenticacion canonica

Se debe consolidar el contrato en rutas de campus:

```text
POST /api/campus/auth/login
POST /api/campus/auth/logout
GET  /api/campus/auth/session
POST /api/campus/auth/invite
POST /api/campus/auth/set-password
POST /api/campus/auth/request-reset
POST /api/campus/auth/reset-password
```

Reglas:

- Una sola implementacion de login.
- Nada de `dev-login` en el flujo normal.
- Nada de llamar a `/api/users/login` desde el campus de alumnos.
- Cookies `httpOnly`, `secure` y `sameSite`.
- Tokens de corta duracion y renovacion controlada.
- No guardar tokens en `localStorage`.
- Rate limit por IP y email.
- Mensajes que no permitan enumerar cuentas.
- Registro de auditoria sin contrasenas, tokens ni PII innecesaria.

### 5.3 Autorizacion

Cada peticion debe validar:

1. Sesion valida.
2. Alumno activo.
3. Tenant correcto.
4. Matricula perteneciente al alumno.
5. Estado de matricula permitido.
6. Curso o convocatoria correspondiente.
7. Material publicado.

Cambiar un ID en la URL nunca debe permitir acceder a otro alumno, curso, tenant o material.

## 6. Modelo de datos LMS

### 6.1 Modules

Campos minimos:

- `id`
- `tenant_id`
- `course_id`
- `title`
- `slug`
- `description`
- `order`
- `is_published`
- `created_by`
- `created_at`
- `updated_at`

### 6.2 Lessons

Campos minimos:

- `id`
- `tenant_id`
- `module_id`
- `title`
- `slug`
- `lesson_type`
- `content`
- `video_url` opcional
- `order`
- `is_published`
- `is_free_preview`
- `created_at`
- `updated_at`

Tipos iniciales:

- Lectura.
- PDF.
- Video.
- Enlace.

Se dejan cuestionarios, tareas y evaluacion para una fase posterior si no son necesarios para el piloto.

### 6.3 Materials

Campos minimos:

- `id`
- `tenant_id`
- `course_id`
- `module_id` opcional
- `lesson_id` opcional
- `title`
- `description`
- `material_type`
- `media_id` opcional
- `external_url` opcional
- `order`
- `is_published`
- `is_downloadable`
- `download_count`
- `created_by`
- `created_at`
- `updated_at`

Los PDFs existentes se reutilizaran solo despues de crear el material y publicarlo manualmente. `dossier_pdf` seguira representando el documento comercial de la ficha publica.

### 6.4 Lesson progress

Campos minimos:

- `id`
- `tenant_id`
- `enrollment_id`
- `lesson_id`
- `status`
- `progress_percent`
- `time_spent`
- `last_position`
- `completed_at`
- `updated_at`

Restricciones:

- Un registro por matricula y leccion.
- Claves foraneas.
- Indices por tenant, matricula y leccion.
- No duplicar progreso en frontend.

### 6.5 Versionado

Para el MVP, los modulos y lecciones perteneceran al curso y las matriculas tendran acceso al contenido publicado.

Antes de permitir cambios importantes sobre cursos activos se debe decidir si se necesita:

- version de contenido;
- snapshot por convocatoria;
- fecha efectiva de publicacion;
- migracion de progreso entre versiones.

No se resolvera silenciosamente este problema en produccion.

## 7. Fases de implementacion

### Fase 0 - Guardrails y baseline

Entregables:

- Rama y worktree aislados.
- Variables de staging documentadas.
- Base efimera para migraciones.
- SMTP de captura.
- Script de bloqueo de URLs productivas.
- Compose de campus/staging revisado.
- Checklist de no afectacion.

Gate:

- Una migracion apuntando a produccion debe fallar antes de conectar.
- Un envio de email de prueba debe quedar en Mailpit.
- No debe existir ningun dato de CEP productivo en el entorno nuevo.

### Fase 1 - Autenticacion

Entregables:

- Login real de alumno.
- Logout.
- Sesion.
- Invitacion.
- Creacion de contrasena.
- Recuperacion.
- Rate limit.
- Revocacion.
- Tests de seguridad.

Gate:

- Un alumno puede acceder solo a su propia sesion.
- Un usuario inactivo no puede entrar.
- Un token expirado no funciona.
- No se utiliza login de desarrollo.

### Fase 2 - Migraciones LMS

Entregables:

- Migraciones versionadas.
- Tipos Payload actualizados.
- Indices y claves foraneas.
- Seed minimo de prueba.
- Rollback probado.
- Reaplicacion idempotente.

Orden:

1. Base efimera.
2. Staging vacio.
3. Staging con datos de prueba.
4. Nunca produccion en esta fase.

Gate:

- Schema generado coincide con colecciones.
- No hay tablas creadas manualmente fuera de migracion.
- No hay cambios destructivos.

### Fase 3 - Gestion de contenidos

Entregables:

- CRUD de cursos y modulos.
- CRUD de lecciones.
- Subida de materiales.
- Asociacion a Media.
- Ordenacion.
- Publicacion y retirada.
- Vista previa como alumno.
- Auditoria de cambios.

Importacion inicial:

- Crear material como borrador.
- Asociar PDF por hash.
- Evitar duplicados.
- Registrar origen.
- Requerir publicacion manual.

### Fase 4 - Campus alumno

Entregables:

- Dashboard.
- Mis cursos.
- Detalle de curso.
- Modulos.
- Lecciones.
- Visor de PDF.
- Descarga protegida.
- Perfil.
- Cambio de contrasena.

Gate:

- No hay acceso directo a archivos no publicados.
- No hay acceso a cursos sin matricula.
- No hay fuga de datos entre alumnos.

### Fase 5 - Progreso

Entregables:

- Marcar leccion como iniciada.
- Marcar leccion completada.
- Porcentaje de curso.
- Ultima leccion visitada.
- Tiempo aproximado.
- Historial basico.

Se posponen para otra fase:

- Examenes.
- Tareas.
- Calificaciones.
- Gamificacion persistente con puntos e insignias editables por administradores; la primera version derivada en lectura queda preparada pero apagada.
- Certificados automaticos.

### Fase 6 - Piloto privado

Se usaran cuentas ficticias y cursos piloto:

- Auxiliar de Odontologia.
- Quiromasaje Holistico.
- Nutricosmetica.
- Seminario Gestorvet.

El piloto se ejecutara en staging con usuarios internos autorizados. No se usaran alumnos reales hasta aprobar el gate legal, funcional y de seguridad.

## 8. Pruebas obligatorias

### Unitarias

- Normalizacion de email.
- Hash y verificacion de contrasena.
- Expiracion de tokens.
- Estados de matricula.
- Calculo de progreso.
- Deduplicacion de materiales.

### API

- Login valido e invalido.
- Cuenta inactiva.
- Invitacion expirada.
- Reset reutilizado.
- Acceso sin matricula.
- Acceso a otro tenant.
- Material no publicado.
- Descarga sin sesion.
- Rate limit.

### E2E

- Crear alumno.
- Matricular alumno.
- Enviar invitacion.
- Crear contrasena.
- Iniciar sesion.
- Ver curso.
- Abrir PDF.
- Descargar PDF.
- Completar leccion.
- Ver progreso.
- Cerrar sesion.

### Operativas

- Build reproducible.
- TypeScript.
- Lint.
- Tests de migracion.
- Smoke tests.
- Health checks.
- Logs sin PII sensible.
- Restauracion de backup en staging.

## 9. Rollback

Antes de cualquier cambio en staging:

- Snapshot de base.
- Export de migraciones aplicadas.
- Version anterior de imagen.
- Backup de Media staging.
- Comando de rollback documentado.

Condiciones de rollback inmediato:

- Error de autenticacion masivo.
- Perdida de matriculas.
- Acceso cruzado entre tenants.
- Archivos privados expuestos.
- Error en health check.
- Saturacion de CPU, memoria o conexiones.
- Migracion no reversible.

La primera promocion futura debera ser un servicio separado del dashboard actual. Un fallo del campus no puede dejar fuera de servicio programacion, cursos, profesores, alumnos o matriculas.

## 10. Gate de promocion futura

No se podra abrir a usuarios reales hasta cumplir todo lo siguiente:

- Login real probado.
- Recuperacion de contrasena probada.
- Migraciones probadas en staging.
- Backup y restore probados.
- Tests unitarios, API y E2E aprobados.
- Permisos por tenant verificados.
- PDFs protegidos.
- Progreso persistente.
- Sin errores criticos en logs.
- Sin cambios no relacionados en el release.
- Aprobacion de CEP.
- Plan de rollback ejecutado en ensayo.
- Ventana de despliegue aprobada.

La activacion se hara progresivamente:

1. Feature flag cerrada.
2. Acceso solo a administradores.
3. Piloto interno.
4. Grupo limitado de alumnos.
5. Monitorizacion.
6. Apertura gradual.

## 11. Criterios de aceptacion del MVP interno

- Un alumno ficticio recibe una invitacion en Mailpit.
- Puede crear una contrasena.
- Puede iniciar sesion.
- Solo ve sus matriculas.
- Puede abrir un curso piloto.
- Puede consultar una leccion.
- Puede descargar un PDF autorizado.
- Puede marcar una leccion como completada.
- El progreso se conserva al cerrar sesion.
- Un alumno no puede acceder a otro alumno.
- Un usuario de otro tenant no puede acceder a los datos.
- Ningun servicio productivo ha sido reiniciado o modificado.

## 12. Fuera de alcance inicial

- Publicacion en la web publica.
- Enlaces desde el menu CEP.
- Certificados automaticos.
- Facturacion del campus.
- Gamificacion.
- Marketplace de contenidos.
- Aplicacion movil.
- Integraciones externas.
- Migracion directa de alumnos reales.

## 13. Estado del plan

- Plan documentado: completado.
- Goal de ejecucion: completado para el alcance MVP tecnico interno; la promocion futura sigue bloqueada por gates.
- Implementacion local aislada: completada para el alcance MVP tecnico.
- Autenticacion, matriculas LMS, contenidos protegidos y progreso basico: implementados en rama de desarrollo.
- Tests focalizados: 13 tests unitarios/API pasados.
- Staging funcional: seed, migraciones, smoke API, Mailpit E2E, E2E Chromium/Firefox/WebKit y backup/restore pasados.
- Build Docker local de staging: pasado; imagen no publicada.
- Gamificacion: implementada como lectura derivada de progreso, detras de bandera y apagada; queda pendiente la aprobacion funcional de sus reglas.
- Pendientes de cierre: aprobacion de CEP, backup/restore de una promocion y validacion funcional de contenidos.
- Produccion: el codigo puede desplegarse con el Campus cerrado; no se aplican migraciones ni se crean cuentas o datos reales.
- Condicion de salida: todos los gates de staging y no afectacion aprobados.
