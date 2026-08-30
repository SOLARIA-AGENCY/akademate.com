
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
  "kicker": "CEP PLATFORM",
  "title": "La nueva plataforma digital de CEP Formación",
  "subtitle": "Web, gestión interna, captación y campus en un único entorno operativo para la academia.",
  "layout": "cover",
  "images": [
    "cep-dashboard-final.png",
    "cep-public-web-2026-06-04.png",
    "cep-login-current.png"
  ]
};

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  
  slide.background.fill = { type: 'solid', color: C.paper };
  rect(slide, 0, 0, 410, 720, C.red, { transparency: 100000 });
  textbox(slide, data.kicker, 62, 70, 260, 24, { size: 13, bold: true, color: C.white });
  textbox(slide, data.title, 62, 116, 370, 180, { size: 46, bold: true, color: C.white });
  textbox(slide, data.subtitle, 64, 296, 380, 92, { size: 22, color: C.white });
  await addImage(slide, ctx, data.images[0], 470, 62, 700, 390, 'cover');
  await addImage(slide, ctx, data.images[1], 470, 480, 330, 170, 'cover');
  await addImage(slide, ctx, data.images[2], 830, 480, 340, 170, 'cover');
  textbox(slide, 'Convocatorias · publicidad · leads · matrícula · campus', 62, 604, 360, 48, { size: 15, color: C.white, bold: true });
  footer(slide, 1);
  return slide;
}
