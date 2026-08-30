
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
  "kicker": "ACCESOS",
  "title": "Cada perfil entra por el acceso que necesita",
  "subtitle": "CEP puede separar web pública, panel de gestión, campus del alumno y administración técnica sin mezclar usos.",
  "layout": "access",
  "items": [
    [
      "Web CEP",
      "Oferta y formularios"
    ],
    [
      "Dashboard",
      "Gestión diaria"
    ],
    [
      "Campus",
      "Alumnos y certificados"
    ],
    [
      "Admin",
      "Contenido y configuración"
    ]
  ]
};

export async function slide14(presentation, ctx) {
  const slide = presentation.slides.add();
  
  header(slide, data, 14);
  data.items.forEach((it, i) => {
    const x = 108 + (i % 2) * 520;
    const y = 310 + Math.floor(i / 2) * 132;
    rect(slide, x, y, 430, 90, C.white, { style: 'solid', fill: C.gray, width: 1 });
    textbox(slide, it[0], x + 24, y + 20, 170, 28, { size: 23, bold: true, color: C.red });
    textbox(slide, it[1], x + 220, y + 22, 170, 42, { size: 18, color: C.graphite });
  });
  textbox(slide, 'Nota: el dominio propio se presenta como fase de implantación hasta confirmar DNS y despliegue final.', 144, 610, 930, 30, { size: 16, color: C.mid, align: 'center' });
  return slide;
}
