#!/usr/bin/env python3
"""Inspecciona los estilos CSS aplicados en la página del dashboard."""

from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("📍 Navegando a http://localhost:3000...")
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Screenshot
    print("📸 Capturando screenshot...")
    page.screenshot(path='/tmp/dashboard-screenshot.png', full_page=True)
    print("✅ Screenshot guardado en /tmp/dashboard-screenshot.png")

    # Verificar variables CSS en :root
    print("\n🎨 Variables CSS en :root:")
    root_vars = page.evaluate("""
        () => {
            const root = document.documentElement;
            const style = getComputedStyle(root);
            return {
                '--background': style.getPropertyValue('--background').trim(),
                '--foreground': style.getPropertyValue('--foreground').trim(),
                '--primary': style.getPropertyValue('--primary').trim(),
                '--card': style.getPropertyValue('--card').trim(),
                '--border': style.getPropertyValue('--border').trim(),
                '--radius': style.getPropertyValue('--radius').trim(),
            };
        }
    """)
    for key, value in root_vars.items():
        print(f"  {key}: {value}")

    # Estilos computados del body
    print("\n📐 Estilos computados del <body>:")
    body_styles = page.evaluate("""
        () => {
            const body = document.body;
            const style = getComputedStyle(body);
            return {
                backgroundColor: style.backgroundColor,
                color: style.color,
                fontFamily: style.fontFamily,
            };
        }
    """)
    for key, value in body_styles.items():
        print(f"  {key}: {value}")

    # Estilos del primer Card
    print("\n🃏 Estilos del primer Card:")
    card_styles = page.evaluate("""
        () => {
            const card = document.querySelector('[class*="rounded-xl"][class*="bg-card"]');
            if (!card) return 'Card no encontrado';
            const style = getComputedStyle(card);
            return {
                backgroundColor: style.backgroundColor,
                borderRadius: style.borderRadius,
                borderColor: style.borderColor,
                borderWidth: style.borderWidth,
                padding: style.padding,
                boxShadow: style.boxShadow,
            };
        }
    """)
    if isinstance(card_styles, dict):
        for key, value in card_styles.items():
            print(f"  {key}: {value}")
    else:
        print(f"  {card_styles}")

    # Estilos del primer Button
    print("\n🔘 Estilos del primer Button:")
    button_styles = page.evaluate("""
        () => {
            const button = document.querySelector('button');
            if (!button) return 'Button no encontrado';
            const style = getComputedStyle(button);
            return {
                backgroundColor: style.backgroundColor,
                color: style.color,
                borderRadius: style.borderRadius,
                padding: style.padding,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
            };
        }
    """)
    if isinstance(button_styles, dict):
        for key, value in button_styles.items():
            print(f"  {key}: {value}")
    else:
        print(f"  {button_styles}")

    # Verificar clases Tailwind aplicadas
    print("\n🏷️  Clases aplicadas en elementos clave:")
    classes_info = page.evaluate("""
        () => {
            const body = document.body;
            const card = document.querySelector('[class*="rounded-xl"]');
            const button = document.querySelector('button');

            return {
                body: body ? body.className : 'no encontrado',
                card: card ? card.className.split(' ').slice(0, 10).join(' ') : 'no encontrado',
                button: button ? button.className.split(' ').slice(0, 10).join(' ') : 'no encontrado',
            };
        }
    """)
    for element, classes in classes_info.items():
        print(f"  {element}: {classes}")

    # Verificar errores en consola
    print("\n🐛 Errores de consola:")
    console_errors = []
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.reload()
    page.wait_for_load_state('networkidle')

    if console_errors:
        for error in console_errors:
            print(f"  ❌ {error}")
    else:
        print("  ✅ No hay errores de consola")

    # Verificar archivos CSS cargados
    print("\n📦 Archivos CSS cargados:")
    css_files = page.evaluate("""
        () => {
            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            return links.map(link => link.href);
        }
    """)
    for css_file in css_files:
        print(f"  ✅ {css_file}")

    browser.close()
    print("\n✅ Inspección completada")
    print(f"📸 Screenshot disponible en: /tmp/dashboard-screenshot.png")
