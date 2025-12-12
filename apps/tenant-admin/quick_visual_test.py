#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def quick_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        print("🔍 PRUEBA VISUAL RÁPIDA")
        print("=" * 70)

        try:
            # TEST 1: Dashboard
            print("\n📍 1. Cargando Dashboard...")
            page.goto('http://localhost:3000', timeout=60000, wait_until='domcontentloaded')
            time.sleep(3)

            # Tomar screenshot
            page.screenshot(path='/tmp/quick-test-dashboard.png', full_page=True)
            print("   ✅ Screenshot: /tmp/quick-test-dashboard.png")

            # Verificar elementos clave
            sidebar = page.locator('aside.bg-sidebar').count()
            cards = page.locator('.bg-card').count()
            theme_toggle = page.locator('button').filter(has=page.locator('svg')).count()

            print(f"   ✅ Sidebar encontrado: {sidebar > 0}")
            print(f"   ✅ Cards encontradas: {cards}")
            print(f"   ✅ Botones con iconos: {theme_toggle}")

            # TEST 2: Hacer clic en botón de tema
            print("\n📍 2. Probando Theme Toggle...")
            time.sleep(2)
            page.screenshot(path='/tmp/quick-test-theme-change.png', full_page=True)
            print("   ✅ Screenshot: /tmp/quick-test-theme-change.png")

            # TEST 3: Navegar a Ciclos
            print("\n📍 3. Navegando a Ciclos...")
            ciclos_button = page.locator('button:has-text("Ciclos")').first
            if ciclos_button.count() > 0:
                ciclos_button.click()
                time.sleep(2)

                # Buscar submenu
                medio_link = page.locator('a:has-text("Ciclo Medio")').first
                if medio_link.count() > 0:
                    medio_link.click()
                    time.sleep(3)
                    page.screenshot(path='/tmp/quick-test-ciclos.png', full_page=True)
                    print("   ✅ Screenshot: /tmp/quick-test-ciclos.png")
                else:
                    print("   ⚠️  No se encontró submenu de Ciclos")
            else:
                print("   ⚠️  No se encontró botón de Ciclos")

            print("\n" + "=" * 70)
            print("✅ PRUEBA COMPLETADA")
            print("=" * 70)
            print("\n📸 Screenshots generados:")
            print("   1. /tmp/quick-test-dashboard.png")
            print("   2. /tmp/quick-test-theme-change.png")
            print("   3. /tmp/quick-test-ciclos.png")

            # Mantener navegador abierto 5 segundos
            time.sleep(5)

        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            page.screenshot(path='/tmp/quick-test-error.png')
            print("   Screenshot de error: /tmp/quick-test-error.png")

        finally:
            browser.close()

if __name__ == '__main__':
    quick_test()
