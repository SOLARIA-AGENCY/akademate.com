import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('📍 Navegando a http://localhost:3000...');
  await page.goto('http://localhost:3000');

  // Esperar a que cargue
  await page.waitForLoadState('networkidle');

  // Tomar screenshot
  console.log('📸 Capturando screenshot...');
  await page.screenshot({ path: 'frontend-screenshot.png', fullPage: true });
  console.log('✅ Screenshot guardado: frontend-screenshot.png');

  // Verificar CSS variables en :root
  console.log('\n🎨 Verificando CSS variables en :root:');
  const rootStyles = await page.evaluate(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    return {
      '--background': computedStyle.getPropertyValue('--background'),
      '--foreground': computedStyle.getPropertyValue('--foreground'),
      '--primary': computedStyle.getPropertyValue('--primary'),
      '--card': computedStyle.getPropertyValue('--card'),
      '--border': computedStyle.getPropertyValue('--border'),
      '--radius': computedStyle.getPropertyValue('--radius'),
    };
  });
  console.log(rootStyles);

  // Verificar estilos computados del body
  console.log('\n📐 Estilos computados del body:');
  const bodyStyles = await page.evaluate(() => {
    const body = document.body;
    const computed = getComputedStyle(body);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
    };
  });
  console.log(bodyStyles);

  // Verificar primer Card
  console.log('\n🃏 Estilos del primer Card:');
  const cardStyles = await page.evaluate(() => {
    const card = document.querySelector('[class*="rounded-xl"]');
    if (!card) return 'No se encontró card';
    const computed = getComputedStyle(card);
    return {
      backgroundColor: computed.backgroundColor,
      borderRadius: computed.borderRadius,
      borderColor: computed.borderColor,
      borderWidth: computed.borderWidth,
      padding: computed.padding,
      boxShadow: computed.boxShadow,
    };
  });
  console.log(cardStyles);

  // Verificar primer Button
  console.log('\n🔘 Estilos del primer Button:');
  const buttonStyles = await page.evaluate(() => {
    const button = document.querySelector('button');
    if (!button) return 'No se encontró button';
    const computed = getComputedStyle(button);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderRadius: computed.borderRadius,
      padding: computed.padding,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
    };
  });
  console.log(buttonStyles);

  // Verificar si hay estilos inline bloqueando
  console.log('\n⚠️  Verificando estilos inline problemáticos:');
  const inlineStyles = await page.evaluate(() => {
    const elementsWithInline = Array.from(document.querySelectorAll('[style]'));
    return elementsWithInline.map(el => ({
      tag: el.tagName,
      classes: el.className,
      style: el.getAttribute('style')
    }));
  });
  console.log(inlineStyles.length > 0 ? inlineStyles : 'No hay estilos inline');

  // Verificar errores de consola
  console.log('\n🐛 Errores de consola:');
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text());
    }
  });

  // Recargar para capturar errores
  await page.reload();
  await page.waitForLoadState('networkidle');

  if (consoleMessages.length > 0) {
    console.log(consoleMessages);
  } else {
    console.log('No hay errores de consola');
  }

  await browser.close();
  console.log('\n✅ Inspección completada');
})();
