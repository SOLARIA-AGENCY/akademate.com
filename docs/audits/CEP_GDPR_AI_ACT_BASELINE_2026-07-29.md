# CEP Formación — línea base RGPD y EU AI Act

**Fecha de corte:** 29 de julio de 2026
**Artefacto de producción contrastado:** `36d4dfb6e30757220896f0fd146e3b58de8bbac4`
**Naturaleza:** auditoría preliminar de preparación; no es certificación ni dictamen jurídico.

## Dictamen ejecutivo

| Marco | Preparación demostrable | Brecha | Dictamen |
|---|---:|---:|---|
| RGPD/GDPR | **38%** | **62%** | Base técnica parcial, sin cumplimiento organizativo demostrable y con un fallo P0 en las rutas de derechos RGPD. |
| EU AI Act | **16%** | **84%** | Aplicabilidad actual limitada, pero no existe gobierno formal de IA ni evidencia de alfabetización. |

Los porcentajes miden evidencia disponible en código, producción y documentación. No equivalen a un porcentaje de conformidad legal. Un control solo se considera completo cuando existe implementación, activación, responsable, procedimiento y evidencia verificable.

## Fechas regulatorias

### RGPD

- Entrada en vigor: 24 de mayo de 2016.
- Aplicación obligatoria: **25 de mayo de 2018**.
- Estado a fecha de corte: plenamente aplicable.

### EU AI Act

- Entrada en vigor: 1 de agosto de 2024.
- Desde **2 de febrero de 2025**: definición de sistema de IA, prácticas prohibidas y alfabetización en IA.
- Desde **2 de agosto de 2025**: gobernanza y obligaciones para proveedores de modelos de propósito general.
- Desde **2 de agosto de 2026**: aplicación general y obligaciones de transparencia, salvo excepciones.
- Desde **2 de diciembre de 2027**: reglas para usos de alto riesgo del Anexo III, incluidos determinados usos en educación, formación profesional y empleo, conforme al calendario oficial actualizado.
- Desde **2 de agosto de 2028**: sistemas de alto riesgo incorporados a productos regulados del Anexo I.

Fuentes oficiales:

- Reglamento (UE) 2016/679: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Guía EDPB para responsables y encargados: https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en
- Reglamento (UE) 2024/1689: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
- Calendario oficial AI Act: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai

## Alcance real de AI Act en Akademate/CEP

Tener usuarios en la UE activa el RGPD respecto del tratamiento de datos personales, pero no convierte automáticamente toda la plataforma en un sistema de IA. AI Act se aplica a las funciones que encajen en la definición legal de IA y depende del rol asumido: proveedor, desplegador, importador o distribuidor.

En el artefacto revisado:

- Se encontró un script auxiliar que usa OpenAI `gpt-image-1` para generar imágenes de cursos.
- Existe publicidad pública sobre conectores MCP con asistentes de IA.
- No se encontró una función de IA activa que admita alumnos, determine acceso a formación, evalúe resultados, vigile exámenes, seleccione personal o tome decisiones financieras.
- El `lead scoring` encontrado es determinista por reglas; no se ha clasificado como sistema de IA. Sigue sujeto a RGPD si constituye perfilado.

Conclusión: no hay evidencia de un sistema educativo de IA de alto riesgo activo, pero falta un inventario formal que permita sostener esa conclusión y controlar futuras funcionalidades.

## Matriz RGPD

| Control | Estado | Evidencia y brecha |
|---|---|---|
| Responsables, encargados y separación de las empresas CEP | ⛔ 20% | El modelo multi-entidad está en sombra. Faltan responsables nominales, roles jurídicos, acuerdos entre empresas y contrato Art. 28 con Akademate/Solaria y subencargados. |
| Principios, finalidades, bases jurídicas y minimización | ⚠ 30% | La política enumera finalidades y bases genéricas, pero no existe RAT/ROPA aprobado por empresa, finalidad, categoría, destinatario, conservación y medida de seguridad. |
| Información al interesado, Arts. 12–14 | ⚠ 40% | Existe página pública, pero contiene `CIF: B-XXXXXXXX`, identidad única hardcodeada y afirmaciones no verificadas, incluida ausencia de transferencias internacionales. |
| Consentimiento y marketing, Art. 7 | ⚠ 50% | Se capturan marca temporal e IP y marketing es separado en varios modelos. Falta demostrar retirada efectiva end-to-end, versión del texto, banner real y bloqueo previo de trackers no esenciales. |
| Derechos Arts. 15–22 | ⛔ 35% | Hay exportación, anonimización y consentimiento, pero no cubren de forma demostrada todos los datos. Las rutas aceptan una cookie falsa porque el middleware solo comprueba presencia y los handlers no validan sesión, propietario, rol ni tenant. |
| Conservación y supresión, Art. 5.1.e | ⚠ 40% | Existen políticas y una función de job, pero no hay evidencia de scheduler activo, ejecución en producción, excepciones legales aprobadas ni reconciliación. La política pública dice que datos académicos se guardan indefinidamente. |
| Privacidad desde el diseño, Art. 25 | ⚠ 45% | Existen tenant scoping, esquema multi-entidad deny-all en sombra y algunas validaciones. La separación nominal por empresa/sede y el mínimo privilegio aún no están activados. |
| Seguridad, Art. 32 | ⚠ 50% | HTTPS, cabeceras, backups, aislamiento de tenant y endurecimiento parcial. Persisten bypass por cookie presente, rate limiter Edge desactivado, hardening histórico de secretos y falta de prueba autenticada completa. |
| Registro y responsabilidad proactiva, Arts. 5.2 y 30 | ⚠ 45% | Existe colección de auditoría y hooks, pero el propio código indica que la integración completa queda para una fase posterior. Un audit log técnico no sustituye el RAT/ROPA. |
| Brechas, Arts. 33–34 | ⚠ 25% | Hay runbook genérico de incidentes, pero no procedimiento RGPD de 72 horas, registro de brechas, evaluación de riesgo, plantillas AEPD/interesados ni responsables de guardia. |
| DPIA/EIPD, Art. 35; DPO, Art. 37 | ✗ 0% | No se encontró EIPD para educación, CRM/perfilado, publicidad Meta, finanzas o arquitectura multiempresa; tampoco evaluación documentada de necesidad de DPO. |
| Proveedores, transferencias y subencargados, Arts. 28 y 44–49 | ✗ 0% | No se encontró inventario contractual ni evaluación de Hetzner, Meta, OpenAI, correo, almacenamiento y demás proveedores; la política pública no puede afirmar “sin transferencias” sin esta revisión. |

**Resultado ponderado:** **38% con evidencia / 62% pendiente o no demostrado**.

## Matriz EU AI Act

| Control | Estado | Evidencia y brecha |
|---|---|---|
| Inventario, definición y clasificación de cada IA | ⚠ 20% | Se identificó manualmente generación de imágenes, pero no hay registro corporativo de sistemas, finalidad, modelo, versión, proveedor, datos, usuarios, riesgo y propietario. |
| Determinación del rol legal y cadena de proveedores | ✗ 0% | No existe evaluación documentada de CEP/Akademate como proveedor o desplegador ni contrato/evidencia del proveedor de modelo. |
| Alfabetización en IA, Art. 4 | ✗ 0% | Obligatoria desde 02/02/2025; no se encontró plan, formación, asistentes, temario ni registro de personal formado. |
| Prácticas prohibidas, Art. 5 | ⚠ 50% | No se detectó funcionalidad prohibida, pero falta una política y un gate de producto que impida incorporarla. |
| Transparencia, Art. 50 | ✗ 10% | No hay etiquetado/procedencia de contenido generado, aviso de interacción con IA ni registro de qué materiales públicos fueron generados o modificados mediante IA. |
| Supervisión humana y uso conforme a instrucciones | ⚠ 20% | El script de imágenes requiere ejecución humana, pero no hay procedimiento de revisión, aprobación, retirada ni competencias asignadas. |
| Logs, documentación técnica y trazabilidad | ⚠ 25% | Se conoce endpoint y modelo por código; faltan versión efectiva, prompts, outputs, aprobaciones, limitaciones, métricas, retención y evidencia de uso. |
| Gestión de riesgo, calidad, exactitud, robustez y ciberseguridad | ✗ 0% | No existe sistema de gestión de riesgos de IA, evaluación adversarial, límites de uso ni seguimiento post-uso. |
| Datos, privacidad, propiedad intelectual y proveedores | ✗ 10% | No se encontró evaluación documentada de datos enviados, DPA, transferencias, copyright, términos del modelo o derechos sobre resultados. |
| Preparación para IA educativa o laboral de alto riesgo | ✗ 0% | No hay QMS, documentación, registro, evaluación de conformidad, supervisión humana formal, monitorización ni evaluación de impacto. Debe permanecer prohibida su activación hasta completar clasificación y gates. |

**Resultado ponderado:** **16% con evidencia / 84% pendiente o no demostrado**.

## Hallazgos prioritarios

### P0 — cerrar inmediatamente

1. Validar token real dentro de todas las rutas RGPD, no solo presencia de cookie.
2. Autorizar únicamente al propio interesado o a roles expresamente habilitados, con scoping por tenant y entidad legal.
3. Añadir pruebas adversariales con cookie falsa, usuario de otro tenant, IDOR, rol insuficiente y exportación incompleta.
4. No activar permisos multiempresa ni finanzas hasta cerrar la matriz nominal y la EIPD.

### P1 — antes del 2 de agosto de 2026

1. Crear inventario de IA y dictamen de aplicabilidad/rol para cada función.
2. Implantar y registrar alfabetización en IA para personal que use o supervise IA.
3. Aprobar política de usos prohibidos y gate para usos educativos/laborales de alto riesgo.
4. Etiquetar y registrar contenidos generados con IA cuando corresponda; documentar proveedor, modelo, revisión humana y derechos de uso.
5. Corregir política de privacidad: empresa/NIF reales, responsables por sede/entidad, proveedores, transferencias, conservación y canales de derechos.

### P1/P2 — programa RGPD

1. Elaborar RAT/ROPA separado para cada empresa y matriz responsable/encargado/corresponsable.
2. Firmar DPA Art. 28 y mantener inventario de subencargados y transferencias.
3. Ejecutar EIPD para CRM/perfilado, publicidad Meta, campus educativo, finanzas y modelo multiempresa.
4. Implantar workflow de derechos con SLA, identidad, excepciones, evidencia y revisión humana.
5. Activar retención programada con dry-run, legal hold, reconciliación y evidencia.
6. Crear procedimiento de brechas RGPD de 72 horas y registro de incidentes de datos.
7. Evaluar formalmente si procede DPO y, en todo caso, nombrar un responsable interno de privacidad.

## Validación realizada

- Inspección del SHA desplegado y del código de las rutas RGPD, políticas públicas, audit logs, RLS, retención, backups e incidentes.
- Producción: privacidad pública `200`; rutas RGPD sin cookie `401`.
- Prueba adversarial no destructiva: cookie falsa aceptada por middleware; consentimiento inexistente devolvió `200`. No se invocó borrado ni se consultaron datos reales.
- Tests existentes: 84/84 pasaron (20 tenant-admin + 64 paquete API). Estos tests validan comportamiento funcional, pero no detectan el bypass de autenticación observado.
- No se verificaron contratos, RAT/ROPA, EIPD, DPO, formación, configuración real de proveedores, transferencias ni ejecución efectiva de jobs de retención.
