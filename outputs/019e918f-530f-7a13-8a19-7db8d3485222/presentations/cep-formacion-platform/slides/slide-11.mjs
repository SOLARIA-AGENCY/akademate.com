
const C = {
  paper: '#F7F5F2',
  ink: '#171717',
  red: '#F0004F',
  deepRed: '#9A0035',
  gray: '#E7E0DA',
  mid: '#6F6760',
  graphite: '#303030',
  white: '#FFFFFF',
};

function rect(slide, left, top, width, height, fill = C.white, line = { style: 'solid', fill: C.gray, width: 1 }, radius = false) {
  const sh = slide.shapes.add({
    geometry: radius ? 'roundRect' : 'rect',
    position: { left, top, width, height },
    fill: { type: 'solid', color: fill },
    line,
  });
  return sh;
}

function line(slide, left, top, width, height, color = C.red, weight = 2) {
  return slide.shapes.add({
    geometry: 'line',
    position: { left, top, width, height },
    line: { style: 'solid', fill: color, width: weight },
  });
}

function textbox(slide, text, left, top, width, height, opts = {}) {
  const sh = slide.shapes.add({
    geometry: 'rect',
    position: { left, top, width, height },
    fill: { color: opts.fill || 'transparent', transparency: opts.fill ? 0 : 100000 },
    line: { transparency: 100000 },
  });
  sh.text = text;
  sh.text.fontSize = opts.size || 20;
  sh.text.typeface = 'Arial';
  sh.text.color = opts.color || C.ink;
  sh.text.bold = Boolean(opts.bold);
  sh.text.alignment = opts.align || 'left';
  sh.text.verticalAlignment = opts.valign || 'top';
  return sh;
}

function footer(slide, num) {
  textbox(slide, 'CEP Formación · Akademate', 58, 682, 360, 20, { size: 11, color: C.mid });
  textbox(slide, String(num).padStart(2, '0'), 1175, 678, 48, 24, { size: 12, color: C.mid, align: 'right' });
}

function header(slide, data, num) {
  slide.background.fill = { type: 'solid', color: C.paper };
  rect(slide, 0, 0, 18, 720, C.red, { transparency: 100000 });
  textbox(slide, data.kicker, 58, 42, 340, 22, { size: 12, bold: true, color: C.red });
  textbox(slide, data.title, 58, 72, 620, 100, { size: 34, bold: true, color: C.ink });
  if (data.subtitle) textbox(slide, data.subtitle, 58, 178, 600, 62, { size: 18, color: C.graphite });
  footer(slide, num);
}

async function addImage(slide, ctx, name, left, top, width, height, fit = 'cover') {
  return await ctx.addImage(slide, {
    path: `${ctx.assetDir}/${name}`,
    alt: name,
    left,
    top,
    width,
    height,
    fit,
  });
}

function bullet(slide, text, left, top, width) {
  rect(slide, left, top + 7, 8, 8, C.red, { transparency: 100000 });
  textbox(slide, text, left + 20, top, width, 34, { size: 17, color: C.graphite });
}

function pill(slide, text, left, top, width, fill = C.white) {
  const sh = rect(slide, left, top, width, 54, fill, { style: 'solid', fill: C.gray, width: 1 }, true);
  sh.text = text;
  sh.text.fontSize = 17;
  sh.text.typeface = 'Arial';
  sh.text.bold = true;
  sh.text.color = C.ink;
  sh.text.alignment = 'center';
  sh.text.verticalAlignment = 'middle';
  return sh;
}

const data = {
  "kicker": "EQUIPO Y SEDES",
  "title": "CEP puede coordinar personas, aulas y sedes desde el mismo panel",
  "subtitle": "Profesores, personal administrativo, sedes, aulas y disponibilidad quedan alineados con cada convocatoria.",
  "layout": "matrix",
  "rows": [
    [
      "Profesores",
      "Asignación a cursos",
      "Áreas cualificadas"
    ],
    [
      "Sedes",
      "Convocatorias por centro",
      "Aulas y capacidad"
    ],
    [
      "Personal",
      "Roles internos",
      "Seguimiento operativo"
    ]
  ]
};

export async function slide11(presentation, ctx) {
  const slide = presentation.slides.add();
  
  header(slide, data, 11);
  ['Área', 'Qué coordina', 'Para qué sirve'].forEach((h, i) => textbox(slide, h, 118 + i * 330, 286, 290, 30, { size: 16, bold: true, color: C.red }));
  data.rows.forEach((r, row) => {
    const y = 330 + row * 90;
    rect(slide, 96, y, 990, 72, row % 2 === 0 ? C.white : '#FBFAF8', { style: 'solid', fill: C.gray, width: 1 });
    r.forEach((cell, i) => textbox(slide, cell, 118 + i * 330, y + 20, 280, 28, { size: i === 0 ? 21 : 18, bold: i === 0, color: i === 0 ? C.ink : C.graphite }));
  });
  textbox(slide, 'La planificación comercial solo funciona bien si aulas, docentes y sedes están conectados con la convocatoria.', 128, 618, 940, 34, { size: 20, bold: true, color: C.deepRed, align: 'center' });
  return slide;
}
