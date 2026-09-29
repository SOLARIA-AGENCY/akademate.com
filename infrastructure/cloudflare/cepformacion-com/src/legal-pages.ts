const UPDATED = '23 de septiembre de 2026'

const STYLE = `<style data-cep-legal-css="1">
main article[data-cep-legal-page]{max-width:46rem;margin:0 auto;padding:2.75rem 1.25rem 4.5rem;color:#1e293b;background:transparent;border:0;box-shadow:none}
main article[data-cep-legal-page] .cep-legal-updated{margin:0;font-size:.9rem;color:#64748b}
main article[data-cep-legal-page] h1{margin:.35rem 0 0;font-size:1.9rem;line-height:1.2;font-weight:650;letter-spacing:-.02em;color:#0f172a}
main article[data-cep-legal-page] h2{margin:1.6rem 0 .35rem;font-size:1.15rem;font-weight:650;color:#0f172a}
main article[data-cep-legal-page] p,main article[data-cep-legal-page] li{margin:.7rem 0 0;font-size:1.05rem;line-height:1.75}
main article[data-cep-legal-page] ul{margin:.35rem 0 0;padding-left:1.25rem}
main article[data-cep-legal-page] a{color:#0f172a;font-weight:600}
main article[data-cep-legal-page] button{padding:0;border:0;background:none;color:#0f172a;font:inherit;font-weight:600;text-decoration:underline;cursor:pointer}
main article[data-cep-legal-page] table{width:100%;border-collapse:collapse;margin-top:.9rem;font-size:.92rem}
main article[data-cep-legal-page] th,main article[data-cep-legal-page] td{border-bottom:1px solid #e2e8f0;padding:.4rem .55rem .4rem 0;text-align:left;vertical-align:top}
main article[data-cep-legal-page] th{font-weight:650}
</style>`

function article(id: string, title: string, body: string): string {
  return `${STYLE}<article data-cep-legal-page="${id}"><p class="cep-legal-updated">Actualizado el ${UPDATED}</p><h1>${title}</h1>${body}</article>`
}

const PAGES: Record<string, string> = {
  index: article(
    'index',
    'Información legal',
    `<p>Estos textos regulan el uso de cepformacion.com y el tratamiento de datos de la formación que imparten FORMACIÓN CEP CANARIAS S.L., ACATEN 2020 S.L. y Cepsur Tenerife S.L.</p>
<ul>
<li><a href="/legal/privacidad">Política de privacidad</a>. Responsable, datos, finalidades, conservación y derechos.</li>
<li><a href="/legal/terminos">Términos de uso</a>. Condiciones de la web, las cuentas y la matrícula.</li>
<li><a href="/legal/cookies">Política de cookies</a>. Cookies necesarias, analítica, publicidad de campañas y cómo aceptar o rechazar.</li>
<li><a href="/legal/ia">Uso de inteligencia artificial</a>. Para qué se usa y qué decisiones no se automatizan.</li>
<li><a href="/legal/subencargados">Proveedores</a>. Alojamiento, correo del acuse, analítica y publicidad.</li>
<li><a href="/legal/transparencia">Transparencia de la formación subvencionada</a>. Cursos gratuitos para trabajadores/as desempleados/as y trabajadores/as ocupados/as. La gestiona APROEM.</li>
<li><a href="/legal/accesibilidad">Accesibilidad</a>. Criterio WCAG 2.2 nivel AA y cómo avisar de una barrera.</li>
</ul>`,
  ),
  privacidad: article(
    'privacidad',
    'Política de privacidad',
    `<p>La presente política informa del tratamiento de datos personales de quienes consultan cepformacion.com, solicitan información o formalizan matrícula, conforme al Reglamento (UE) 2016/679 y a la Ley Orgánica 3/2018, de 5 de diciembre.</p>
<h2>1. Responsable</h2>
<p>FORMACIÓN CEP CANARIAS S.L., NIF B70729272, domicilio social en Calle Chavoco 1, 38340 Tacoronte, Santa Cruz de Tenerife, España. Inscrita en el Registro Mercantil de Santa Cruz de Tenerife, sección 8, hoja TF 71748, inscripción 6 (24 de septiembre de 2025). El centro de Santa Cruz está en Plaza José Antonio Barrios Olivero s/n, 38005 Santa Cruz de Tenerife, código de centro 38017275. Correo <a href="mailto:info@cursostenerife.es">info@cursostenerife.es</a>. Privacidad y ejercicio de derechos: <a href="mailto:privacidad@cursostenerife.es">privacidad@cursostenerife.es</a>. Teléfono +34 922 21 92 57.</p>
<p>Los cursos privados de CEP Norte los contrata ACATEN 2020 S.L., NIF B76816578, domicilio social en Plaza José Antonio Barrios Olivero s/n, 38005 Santa Cruz de Tenerife. Inscrita en el Registro Mercantil de Santa Cruz de Tenerife, tomo 3660, folio 92, sección 8, hoja TF 63956, inscripción 1 (10 de enero de 2020).</p>
<p>Los cursos de CEP Sur los contrata Cepsur Tenerife S.L., NIF B70847546, domicilio en Calle Arguayoda 3, 38611 San Isidro, Granadilla de Abona, Santa Cruz de Tenerife. Correo <a href="mailto:infocepsur@gmail.com">infocepsur@gmail.com</a>. Teléfono +34 922 393 692. Delegado de protección de datos: Invesgia Nubelia S.L.U., <a href="mailto:dpd@nubelia.cloud">dpd@nubelia.cloud</a>.</p>
<h2>2. Datos que se tratan</h2>
<ul>
<li>Identificación, contacto y documentación necesaria para la matrícula.</li>
<li>Datos académicos, asistencia, calificaciones, expedientes y certificaciones.</li>
<li>Datos administrativos, contractuales y de pago. El número completo de la tarjeta no se guarda en esta web.</li>
<li>Datos técnicos de acceso, seguridad y la preferencia de cookies.</li>
<li>Comunicaciones y solicitudes que la persona envía a CEP.</li>
</ul>
<h2>3. Finalidades</h2>
<ul>
<li>Informar, admitir, matricular, impartir, evaluar y certificar la formación.</li>
<li>Atender consultas y las comunicaciones de la formación contratada.</li>
<li>Cumplir obligaciones educativas, fiscales, contables y administrativas.</li>
<li>Proteger las cuentas, prevenir el fraude y resolver incidencias.</li>
<li>Enviar comunicaciones comerciales cuando exista una base válida, y dejar de enviarlas si la persona se opone o retira el consentimiento.</li>
</ul>
<h2>4. Bases jurídicas</h2>
<p>Según el caso, el tratamiento se basa en la relación precontractual o contractual, en una obligación legal, en el interés legítimo de mantener la seguridad del servicio o en el consentimiento. El consentimiento puede retirarse en cualquier momento.</p>
<h2>5. Conservación</h2>
<p>Los datos se conservan durante la relación formativa y, después, durante los plazos de la normativa educativa, fiscal, contable y de prescripción. Las facturas y los libros se conservan los años que exigen la normativa tributaria y el Código de Comercio. Las comunicaciones comerciales se mantienen hasta que se retire el consentimiento o se ejerza el derecho de oposición. Los registros técnicos se conservan el tiempo necesario para la seguridad y el soporte del servicio.</p>
<h2>6. Destinatarios</h2>
<p>Los datos pueden comunicarse a administraciones educativas, a la Administración tributaria, a entidades financieras y a otros destinatarios cuando exista una obligación o una base jurídica. Si la solicitud se refiere a un curso gratuito para trabajadores/as desempleados/as o trabajadores/as ocupados/as, los datos necesarios para gestionar la ayuda se comunican a APROEM, que gestiona esa subvención. El alojamiento, el correo del acuse, y la analítica o la publicidad cuando la persona las autoriza, los prestan los encargados indicados en la página de <a href="/legal/subencargados">proveedores</a>. Si un proveedor trata datos fuera del Espacio Económico Europeo, la transferencia cuenta con una garantía del capítulo V del RGPD.</p>
<p>Las solicitudes de derechos frente a FORMACIÓN CEP CANARIAS S.L. y ACATEN 2020 S.L. se dirigen a <a href="mailto:privacidad@cursostenerife.es">privacidad@cursostenerife.es</a>. Cepsur Tenerife S.L. tiene designado delegado de protección de datos en la dirección indicada en el apartado primero.</p>
<h2>7. Menores</h2>
<p>La matrícula o la solicitud de una persona menor de 14 años requiere el consentimiento de quien ejerce la patria potestad o la tutela, conforme al artículo 7 de la Ley Orgánica 3/2018.</p>
<h2>8. Comunicaciones comerciales</h2>
<p>El acuse de una solicitud de información no es un alta en un boletín. La publicidad por medios electrónicos solo se envía cuando existe consentimiento u otra base admitida por el artículo 21 de la Ley 34/2002. Esos mensajes identifican al remitente y ofrecen un medio para oponerse. Las cookies de publicidad se rigen por la <a href="/legal/cookies">política de cookies</a>.</p>
<h2>9. Derechos</h2>
<ul>
<li>Acceso, rectificación y supresión.</li>
<li>Oposición y limitación del tratamiento.</li>
<li>Portabilidad, cuando proceda.</li>
<li>Retirada del consentimiento, sin afectar a la licitud del tratamiento anterior.</li>
</ul>
<p>Puede ejercerlos en <a href="mailto:privacidad@cursostenerife.es">privacidad@cursostenerife.es</a>. Solo se pedirá un dato adicional de identidad si hay dudas razonables. No se exige, con carácter general, una copia completa del documento de identidad. La respuesta se da en el plazo de un mes, prorrogable en los casos que prevé el RGPD. También puede reclamar ante la <a href="https://www.aepd.es" rel="noreferrer">Agencia Española de Protección de Datos</a>.</p>
<h2>10. Seguridad</h2>
<p>Se aplican medidas técnicas y organizativas adecuadas al riesgo: control de acceso, protección de las comunicaciones, copias de seguridad y gestión de incidentes.</p>
<h2>11. Decisiones automatizadas</h2>
<p>No se adoptan decisiones exclusivamente automatizadas que produzcan efectos jurídicos o similares sobre la admisión, la evaluación, el acceso a la formación, el empleo o la financiación. El uso de herramientas de apoyo se describe en la página de <a href="/legal/ia">inteligencia artificial</a>.</p>
<h2>12. Cambios</h2>
<p>Si esta política cambia de forma relevante, se publicará aquí con una fecha nueva y, cuando corresponda, se comunicará a las personas afectadas.</p>`,
  ),
  terminos: article(
    'terminos',
    'Términos de uso',
    `<p>Estas condiciones regulan el uso de cepformacion.com y de los servicios digitales de la formación. El precio, el calendario y las condiciones de cada matrícula, cuando se comunican para un curso concreto, prevalecen sobre este texto general.</p>
<h2>1. Titular</h2>
<p>El titular de la web es FORMACIÓN CEP CANARIAS S.L., NIF B70729272, domicilio social en Calle Chavoco 1, 38340 Tacoronte, Santa Cruz de Tenerife, España. Inscrita en el Registro Mercantil de Santa Cruz de Tenerife, sección 8, hoja TF 71748, inscripción 6 (24 de septiembre de 2025). El centro de Santa Cruz está en Plaza José Antonio Barrios Olivero s/n, 38005 Santa Cruz de Tenerife, código de centro 38017275.</p>
<p>Los cursos privados de CEP Norte los contrata ACATEN 2020 S.L., NIF B76816578, domicilio social en Plaza José Antonio Barrios Olivero s/n, 38005 Santa Cruz de Tenerife, inscrita en el Registro Mercantil de Santa Cruz de Tenerife, tomo 3660, folio 92, hoja TF 63956. Los cursos de CEP Sur los contrata Cepsur Tenerife S.L., NIF B70847546, domicilio en Calle Arguayoda 3, 38611 San Isidro, Granadilla de Abona, Santa Cruz de Tenerife. Correo <a href="mailto:info@cursostenerife.es">info@cursostenerife.es</a>. Teléfono +34 922 21 92 57.</p>
<h2>2. Acceso y cuentas</h2>
<ul>
<li>Las cuentas son personales e intransferibles.</li>
<li>La persona usuaria custodia sus claves y comunica cualquier acceso no autorizado.</li>
<li>Lo que cada persona ve depende del rol, la sede y los permisos que CEP le asigne.</li>
<li>El nombre de un rol no abre por sí solo finanzas, alumnado, campañas ni otras áreas restringidas.</li>
</ul>
<h2>3. Servicios</h2>
<p>La web informa de la oferta formativa, recoge solicitudes y da acceso a las funciones que CEP tenga habilitadas para cada persona, como convocatorias, matrícula y comunicaciones.</p>
<h2>4. Matrícula, precio y desistimiento</h2>
<p>El precio, la forma de pago, el calendario, la cancelación y las becas se comunican con carácter previo a la formalización de cada matrícula. Cuando el curso se ofrece en la modalidad «Consultar», el precio es el que se comunique en ese trámite. En la contratación a distancia, el plazo de desistimiento es de 14 días naturales, sin perjuicio de las excepciones del texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios, entre ellas la ejecución completa del servicio o la formación vinculada a una fecha determinada. La cancelación imputable al centro se rige por las condiciones comunicadas y por la normativa imperativa.</p>
<h2>5. Uso aceptable</h2>
<p>No está permitido usar el servicio con fines ilícitos, introducir código dañino, eludir controles de acceso, extraer datos de forma masiva sin autorización, suplantar a otra persona o afectar a la disponibilidad del sistema. CEP puede limitar o suspender el acceso cuando haga falta para la seguridad, el cumplimiento del contrato o la investigación de un uso indebido, de forma proporcionada y respetando los derechos que correspondan.</p>
<h2>6. Propiedad intelectual</h2>
<p>Los contenidos formativos y las marcas pertenecen a CEP o a sus titulares. El acceso no autoriza a reproducirlos, distribuirlos ni explotarlos fuera de lo que permita la ley o una autorización expresa.</p>
<h2>7. Disponibilidad</h2>
<p>El servicio puede interrumpirse por mantenimiento o por incidencia técnica. Subsisten las responsabilidades y los derechos que la normativa imperativa declara irrenunciables.</p>
<h2>8. Ley aplicable</h2>
<p>Se aplica la legislación española. Si la persona usuaria es consumidora, son competentes los juzgados que fije la norma imperativa, sin renuncia anticipada a ese fuero.</p>
<p>Contacto: <a href="mailto:info@cursostenerife.es">info@cursostenerife.es</a>. Consulte también la <a href="/legal/privacidad">política de privacidad</a> y la <a href="/legal/cookies">política de cookies</a>.</p>`,
  ),
  cookies: article(
    'cookies',
    'Política de cookies',
    `<p>FORMACIÓN CEP CANARIAS S.L. informa, conforme al artículo 22.2 de la Ley 34/2002, de las cookies y del almacenamiento local de cepformacion.com. La analítica y la publicidad no se cargan hasta que la persona las autoriza. Rechazarlas es tan directo como aceptarlas.</p>
<h2>1. Qué son</h2>
<p>Una cookie es un archivo pequeño que el sitio puede guardar en el navegador. El almacenamiento local recuerda una preferencia de la misma forma. Las cookies necesarias permiten que el sitio funcione. Las de analítica y las de publicidad solo se instalan con consentimiento.</p>
<h2>2. Relación</h2>
<table>
<thead><tr><th>Nombre</th><th>Tipo</th><th>Finalidad</th><th>Duración</th><th>Responsable</th></tr></thead>
<tbody>
<tr><td>cep_cookie_consent_v1</td><td>Necesaria</td><td>Guarda si la persona aceptó, rechazó o configuró la analítica y la publicidad.</td><td>Hasta que se borra en el navegador</td><td>Este sitio</td></tr>
<tr><td>Sesión de cuenta</td><td>Necesaria</td><td>Mantiene el acceso al área con cuenta. No se instala en la consulta pública.</td><td>La sesión</td><td>Este sitio</td></tr>
<tr><td>_ga y _ga_*</td><td>Analítica</td><td>Google Analytics 4, identificador G-ZPBEY6SHX9. Mide visitas de forma agregada.</td><td>Hasta 2 años, según Google</td><td>Google</td></tr>
<tr><td>_gid</td><td>Analítica</td><td>Distingue usuarios durante un día cuando la analítica está autorizada.</td><td>24 horas, según Google</td><td>Google</td></tr>
<tr><td>_fbp</td><td>Publicidad</td><td>Píxel de Meta. Mide las campañas cuando la publicidad está autorizada.</td><td>Unos 3 meses, según Meta</td><td>Meta</td></tr>
<tr><td>_fbc</td><td>Publicidad</td><td>Asocia un clic en un anuncio de Meta cuando la publicidad está autorizada.</td><td>Unos 3 meses, según Meta</td><td>Meta</td></tr>
</tbody>
</table>
<p>La duración de las cookies de Google y de Meta es la que publican esos proveedores. No se usa otra herramienta de analítica ni otro píxel publicitario.</p>
<h2>3. Cómo se elige</h2>
<p>En la primera visita hay tres opciones: solo las necesarias, configurar analítica y publicidad por separado, o aceptar ambas. La elección se guarda en el navegador. Puede reabrirse con <button type="button" onclick="window.dispatchEvent(new Event('cep-consent-open'))">Preferencias de cookies</button>, también en el pie de página. Retirar el consentimiento impide nuevas cargas no esenciales. Las cookies ya guardadas se borran desde el navegador.</p>
<h2>4. Publicidad</h2>
<p>Los anuncios de Meta que enlazan con esta web pueden medirse con el píxel solo si la persona autoriza la publicidad. Sin esa autorización el píxel no se instala y no se envían datos de navegación a Meta. La analítica de Google es independiente: se puede aceptar sin aceptar la publicidad.</p>
<p>Un correo que confirma una solicitud de información no es publicidad ni un alta en un boletín. Las comunicaciones comerciales por medios electrónicos solo se envían con consentimiento o con otra base que la Ley 34/2002 admita, identifican al remitente y permiten oponerse.</p>
<h2>5. Base jurídica</h2>
<p>Las cookies necesarias se usan para prestar el servicio solicitado. La analítica y la publicidad se basan en el consentimiento. Los proveedores están en la página de <a href="/legal/subencargados">proveedores</a>. El tratamiento de datos personales está en la <a href="/legal/privacidad">política de privacidad</a>. Consultas: <a href="mailto:privacidad@cursostenerife.es">privacidad@cursostenerife.es</a>.</p>`,
  ),
  ia: article(
    'ia',
    'Uso de inteligencia artificial',
    `<p>CEP Formación puede utilizar herramientas de inteligencia artificial como apoyo para redactar o revisar contenidos. Esas herramientas no deciden admisiones, calificaciones, acceso a la formación, contratación ni financiación.</p>
<p>El personal autorizado revisa el resultado antes de publicarlo o de usarlo en la actividad del centro. Las decisiones académicas las toma CEP Formación.</p>
<p>Cuando una persona interactúe de forma directa con un sistema de inteligencia artificial, se le informará en los términos del Reglamento (UE) 2024/1689. El personal que utilice estas herramientas lo hará conforme a instrucciones sobre su finalidad, sus límites y la protección de datos. La presente información describe ese uso.</p>
<p>No están activas funciones que evalúen al alumnado, supervisen exámenes o condicionen el acceso al empleo o a la financiación. Una función de ese tipo no se pondrá en marcha sin clasificación, evaluación y autorización previa.</p>
<p>Consultas de privacidad: <a href="mailto:privacidad@cursostenerife.es">privacidad@cursostenerife.es</a>. Más información en la <a href="/legal/privacidad">política de privacidad</a>.</p>`,
  ),
  subencargados: article(
    'subencargados',
    'Proveedores',
    `<p>FORMACIÓN CEP CANARIAS S.L. encarga a los siguientes proveedores los servicios de esta web. Tratan datos por cuenta del responsable y solo para la finalidad indicada. La analítica y la publicidad no se activan sin el consentimiento descrito en la <a href="/legal/cookies">política de cookies</a>.</p>
<h2>Alojamiento</h2>
<p>Hetzner Online GmbH aloja la web y los sistemas asociados. El tratamiento se realiza en la Unión Europea.</p>
<h2>Correo de las solicitudes</h2>
<p>Brevo (Sendinblue) envía el acuse de la solicitud de información al correo que indica la persona. El tratamiento se presta desde la Unión Europea. Ese mensaje no es un boletín.</p>
<h2>Analítica</h2>
<p>Google Ireland Limited presta Google Analytics 4 cuando la persona autoriza las cookies de analítica. Si no hay consentimiento, la etiqueta no se carga. Google puede tratar datos fuera del Espacio Económico Europeo con una garantía del capítulo V del RGPD.</p>
<h2>Publicidad</h2>
<p>Meta Platforms Ireland Limited mide las campañas cuando la persona autoriza las cookies de publicidad. Si no hay consentimiento, el píxel no se carga. Meta puede tratar datos fuera del Espacio Económico Europeo con una garantía del capítulo V del RGPD.</p>
<p>Consultas: <a href="mailto:privacidad@cursostenerife.es">privacidad@cursostenerife.es</a>. El detalle del tratamiento está en la <a href="/legal/privacidad">política de privacidad</a>.</p>`,
  ),
  transparencia: article(
    'transparencia',
    'Transparencia de la formación subvencionada',
    `<p>La presente información se refiere a las acciones formativas gratuitas dirigidas a trabajadores/as desempleados/as y a trabajadores/as ocupados/as. Las acciones de carácter privado se rigen por las condiciones de uso, la política de privacidad y la política de cookies. Actualización: 25 de septiembre de 2026.</p>
<h2>1. Sujetos</h2>
<p>Las acciones privadas de CEP Santa Cruz corresponden a FORMACIÓN CEP CANARIAS S.L., NIF B70729272. Las de CEP Norte corresponden a ACATEN 2020 S.L., NIF B76816578. Las de CEP Sur corresponden a Cepsur Tenerife S.L., NIF B70847546.</p>
<p>La gestión de la subvención de las acciones gratuitas corresponde a la Asociación para el Fomento de las Enseñanzas Profesionales y la Orientación Profesional para el Empleo (APROEM). La impartición tiene lugar en CEP Norte, CEP Santa Cruz o CEP Sur. Domicilio de contacto: Centro Comercial El Trompo, tercera planta, La Orotava, 38312. Teléfono +34 922 21 92 57.</p>
<h2>2. Publicidad de la financiación</h2>
<p>En la ficha de cada acción gratuita consta su carácter gratuito, la gestión por APROEM y los logotipos del Fondo Social Europeo y del Servicio Canario de Empleo, en los términos del artículo 31 del Reglamento de la Ley 38/2003, de 17 de noviembre, General de Subvenciones.</p>
<h2>3. Información económica</h2>
<p>El organigrama, los contratos y convenios celebrados con una Administración, las subvenciones y ayudas percibidas, el presupuesto, las cuentas anuales, los informes de auditoría y las retribuciones de los máximos responsables no se publican en esta web. Dicha información se facilita, previa solicitud, a quien acredite un interés de comprobación o de auditoría.</p>
<p><a href="mailto:info@cursostenerife.es?subject=Solicitud%20de%20informaci%C3%B3n%20de%20transparencia%20APROEM&amp;body=Solicito%20la%20informaci%C3%B3n%20econ%C3%B3mica%20de%20transparencia%20de%20APROEM%20para%20su%20comprobaci%C3%B3n.">Solicitar la información económica</a></p>
<h2>4. Régimen jurídico</h2>
<p>La Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información pública y buen gobierno, establece en su artículo 3 los supuestos en los que una entidad privada queda sujeta a las obligaciones de publicidad activa. La Ley 12/2014, de 26 de diciembre, de transparencia y de acceso a la información pública de Canarias, resulta de aplicación en el ámbito de la Comunidad Autónoma. La Ley 38/2003, de 17 de noviembre, General de Subvenciones, y su reglamento determinan la identificación del origen público de la financiación.</p>
<p>El incumplimiento del deber de transparencia puede reclamarse ante el <a href="https://transparenciacanarias.org/como-reclamar/" rel="noreferrer">Comisionado de Transparencia y Acceso a la Información Pública de Canarias</a>.</p>
<h2>5. Ámbito</h2>
<p>La ficha de la acción gratuita incorpora la mención de gratuidad y los logotipos de financiación. Las acciones privadas quedan fuera de este régimen. Oferta: <a href="/cursos?tipo=desempleados">trabajadores/as desempleados/as</a> y <a href="/cursos?tipo=ocupados">trabajadores/as ocupados/as</a>.</p>
<p><a href="/legal">Información legal</a></p>`,
  ),
  accesibilidad: article(
    'accesibilidad',
    'Accesibilidad',
    `<p>cepformacion.com se elabora para que cualquier persona pueda consultar la oferta, solicitar información y leer los textos legales. El criterio técnico de referencia es WCAG 2.2, nivel AA, en el marco de la Ley 11/2023, de 8 de mayo.</p>
<h2>1. Qué está cubierto</h2>
<ul>
<li>El idioma de las páginas es español.</li>
<li>Los botones rojos y las etiquetas de matrícula usan un fondo más oscuro para que el texto blanco supere el contraste de 4,5:1.</li>
<li>El texto claro sobre fotografía lleva un fondo oscuro propio, no una transparencia del 80 %.</li>
<li>El nombre accesible de las áreas de formación es el texto visible.</li>
<li>Los controles pequeños del carrusel de docentes miden al menos 24 px.</li>
<li>La analítica y la publicidad no se cargan sin consentimiento.</li>
</ul>
<h2>2. Estado</h2>
<p>El estado de conformidad es parcialmente conforme respecto del nivel AA. La revisión automática no agota dicho nivel. La barrera que impida completar una gestión se corrige y se deja constancia en esta declaración.</p>
<h2>3. Distintivos publicados</h2>
<p>Cada sede exhibe los distintivos de su propio sitio.</p>
<ul>
<li>CEP Santa Cruz y CEP Norte, en <a href="https://cursostenerife.es/">cursostenerife.es</a>: marcas de calidad, Fondo Social Europeo y Servicio Canario de Empleo. Se ven en <a href="/sedes/sede-santa-cruz">CEP Santa Cruz</a> y en <a href="/sedes/sede-norte">CEP Norte</a>.</li>
<li>CEP Sur, en <a href="https://cepsur.es/">cepsur.es</a>: OCA Global ISO/IEC 27001, ISO 9001, ISO 14001, EMAS y el reconocimiento EFQM 500 del Club Excelencia en Gestión. Se ven en <a href="/sedes/cep-sur">CEP Sur</a>.</li>
</ul>
<p>ISO 18000 no forma parte de los distintivos de esta formación. El reconocimiento publicado por CEP Sur es EFQM 500.</p>
<h2>4. Aviso de barrera</h2>
<p>Si no puede usar una página, escriba a <a href="mailto:privacidad@cursostenerife.es">privacidad@cursostenerife.es</a> o llame al +34 922 21 92 57. Indique la dirección de la página y el obstáculo. También puede usar el teléfono de la sede que figura en <a href="/contacto">contacto</a>.</p>
<p><a href="/legal">Información legal</a></p>`,
  ),
  portal: article(
    'portal',
    'Transparencia',
    `<p>La información pública de esta formación se reparte entre dos entidades.</p>
<p>APROEM gestiona la formación subvencionada para trabajadores y trabajadoras en desempleo y en ocupación. El detalle de esa formación está en <a href="/legal/transparencia">transparencia de la formación subvencionada</a>.</p>
<p>ACATEN 2020 S.L. contrata los cursos privados de CEP Norte.</p>
<p>El uso de inteligencia artificial está en el <a href="/legal">centro legal</a>.</p>`,
  ),
}

const KNOWN = new Set(Object.keys(PAGES))

export function isTransparencyHub(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path === '/transparencia'
}

export function isTransparencyPortalPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path === '/transparencia' || path.startsWith('/transparencia/')
}

export function rewriteTransparencyAssets(html: string, origin: string): string {
  const base = origin.replace(/\/$/, '')
  return html.replace(/(["'(])\/_next\//g, `$1${base}/_next/`)
}

export function legalPageId(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  const match = path.match(/^(?:\/p)?\/legal(?:\/([a-z0-9-]+))?$/)
  if (!match) return null
  const id = match[1] || 'index'
  if (id === 'portal') return null
  return KNOWN.has(id) ? id : null
}

function stripNextHydration(html: string): string {
  return html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (full, attrs: string) => (/data-cep-/i.test(attrs) ? full : ''))
    .replace(/<script\b(?![^>]*data-cep-)[^>]*\/>/gi, '')
    .replace(/<link\b[^>]*rel="(?:module)?preload"[^>]*>/gi, (full) => (/\/_next\//i.test(full) ? '' : full))
}

function stripDefensivePhrases(html: string): string {
  return html
    .replaceAll('Información regulatoria; no constituye certificación.', 'Información legal.')
    .replaceAll('Información regulatoria; no constituye certificación', 'Información legal')
    .replaceAll('SOLARIA AGENCY OÜ', 'CEP Formación')
}

function lockScript(): string {
  const payload = JSON.stringify(PAGES).replace(/</g, '\\u003c')
  return `<script data-cep-legal-lock="1">
(function () {
  if (window.__cepLegalLock) return;
  window.__cepLegalLock = 1;
  var pages = ${payload};
  function pageId() {
    var path = (location.pathname || '/').replace(/\\/+$/, '') || '/';
    if (path === '/transparencia') return pages.portal ? 'portal' : '';
    var match = path.match(/^(?:\\/p)?\\/legal(?:\\/([a-z0-9-]+))?$/);
    if (!match) return '';
    var id = match[1] || 'index';
    return pages[id] ? id : '';
  }
  function paint(main, html) {
    var doc = new DOMParser().parseFromString('<div id="cep-legal-root">' + html + '</div>', 'text/html');
    var root = doc.getElementById('cep-legal-root');
    if (!root) return;
    main.replaceChildren();
    while (root.firstChild) main.appendChild(document.importNode(root.firstChild, true));
  }
  function apply() {
    var id = pageId();
    var main = document.querySelector('main');
    if (!id || !main || !pages[id]) return;
    if (main.querySelector('[data-cep-legal-page="' + id + '"]')) return;
    paint(main, pages[id]);
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 60);
  }
  function start() {
    apply();
    var root = document.documentElement;
    if (!root) return;
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
    [80, 240, 700, 1500, 3000].forEach(function (ms) { setTimeout(apply, ms); });
    document.addEventListener('click', function () { setTimeout(apply, 40); setTimeout(apply, 280); }, true);
    window.addEventListener('popstate', function () { setTimeout(apply, 40); });
    ['pushState', 'replaceState'].forEach(function (name) {
      var original = history[name];
      history[name] = function () {
        var result = original.apply(this, arguments);
        setTimeout(apply, 40);
        setTimeout(apply, 280);
        return result;
      };
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
}

function stripNextNotFound(html: string, title: string): string {
  if (!html.includes('next-error-h1')) return html
  return html
    .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta\s+name="robots"\s+content="noindex"\s*\/?>/i, '')
    .replace(/<div style="font-family:system-ui[\s\S]*?This page could not be found\.<\/h2><\/div><\/div><\/div>/, '')
}

export function rewriteLegalPages(html: string, pathname: string): string {
  if (isTransparencyPortalPath(pathname)) return html
  let next = stripDefensivePhrases(html)
  const id = legalPageId(pathname)
  if (id && PAGES[id] && !next.includes(`data-cep-legal-rendered="${id}"`)) {
    const replaced = next.replace(
      /<main\b([^>]*)>[\s\S]*?<\/main>/i,
      `<main$1 data-cep-legal-rendered="${id}">${PAGES[id]}</main>`,
    )
    if (replaced !== next) next = replaced
    else if (next.includes('</body>')) {
      next = next.replace('</body>', `<main data-cep-legal-rendered="${id}">${PAGES[id]}</main></body>`)
    } else {
      next += `<main data-cep-legal-rendered="${id}">${PAGES[id]}</main>`
    }
  }
  if (!next.includes('data-cep-legal-lock="1"')) {
    if (next.includes('</body>')) next = next.replace('</body>', `${lockScript()}</body>`)
    else next += lockScript()
  }
  if (id) {
    const heading = next.match(/<article\b[^>]*>[\s\S]*?<h1>([^<]+)<\/h1>/)
    next = stripNextNotFound(next, heading?.[1] ? `${heading[1]} | CEP Formación` : 'Información legal | CEP Formación')
    next = stripNextHydration(next)
  }
  return next
}
