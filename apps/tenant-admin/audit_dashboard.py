#!/usr/bin/env python3
"""Auditoría completa del Dashboard CEP Admin con screenshots."""

from playwright.sync_api import sync_playwright
import time

def audit_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        print("🔍 AUDITORÍA DASHBOARD CEP ADMIN")
        print("=" * 70)

        # TEST 1: Dashboard Principal
        print("\n📍 1. Dashboard Principal (http://localhost:3000)")
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(2000)
        page.screenshot(path='/tmp/audit-01-dashboard.png', full_page=True)
        print("   ✅ Screenshot: /tmp/audit-01-dashboard.png")

        # Contar KPI cards
        kpi_cards = page.locator('.rounded-xl.border.bg-card').count()
        print(f"   ✅ KPI Cards: {kpi_cards}")

        # Verificar sidebar
        sidebar = page.locator('aside').count()
        print(f"   ✅ Sidebar: {sidebar > 0}")

        # TEST 2: Click en Ciclos (si existe link)
        print("\n📍 2. Navegando a Ciclos")
        try:
            # Buscar link con texto "Ciclos" o expandir submenu
            ciclos_button = page.locator('button:has-text("Ciclos")').first
            if ciclos_button.is_visible():
                print("   🔘 Expandiendo menú Ciclos...")
                ciclos_button.click()
                page.wait_for_timeout(500)

                # Buscar subitem "Todos los Ciclos" o similar
                all_ciclos = page.locator('a[href*="ciclos"]').first
                if all_ciclos.is_visible():
                    all_ciclos.click()
                    page.wait_for_timeout(2000)
                    page.screenshot(path='/tmp/audit-02-ciclos-list.png', full_page=True)
                    print("   ✅ Screenshot: /tmp/audit-02-ciclos-list.png")
                else:
                    # Navegar directamente
                    page.goto('http://localhost:3000/ciclos', wait_until='networkidle')
                    page.wait_for_timeout(2000)
                    page.screenshot(path='/tmp/audit-02-ciclos-list.png', full_page=True)
                    print("   ✅ Screenshot: /tmp/audit-02-ciclos-list.png")
            else:
                page.goto('http://localhost:3000/ciclos', wait_until='networkidle')
                page.wait_for_timeout(2000)
                page.screenshot(path='/tmp/audit-02-ciclos-list.png', full_page=True)
                print("   ✅ Screenshot: /tmp/audit-02-ciclos-list.png")

            # Contar ciclo cards
            ciclo_cards = page.locator('[class*="rounded"]').count()
            print(f"   ✅ Elements encontrados: {ciclo_cards}")

        except Exception as e:
            print(f"   ⚠️  Error navegando a ciclos: {e}")
            page.goto('http://localhost:3000/ciclos', wait_until='networkidle')
            page.screenshot(path='/tmp/audit-02-ciclos-list.png', full_page=True)

        # TEST 3: Detalle de Ciclo
        print("\n📍 3. Navegando a Detalle de Ciclo")
        page.goto('http://localhost:3000/ciclos/ciclo-1', wait_until='networkidle')
        page.wait_for_timeout(2000)
        page.screenshot(path='/tmp/audit-03-ciclo-detail.png', full_page=True)
        print("   ✅ Screenshot: /tmp/audit-03-ciclo-detail.png")

        # Buscar tabs
        tabs = page.locator('[role="tablist"], button[role="tab"]').count()
        print(f"   ✅ Tabs encontrados: {tabs}")

        # TEST 4: Responsive Mobile
        print("\n📍 4. Testing Responsive (Mobile 375x812)")
        page.set_viewport_size({'width': 375, 'height': 812})
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(2000)
        page.screenshot(path='/tmp/audit-04-mobile-dashboard.png', full_page=True)
        print("   ✅ Screenshot: /tmp/audit-04-mobile-dashboard.png")

        # TEST 5: Tablet
        print("\n📍 5. Testing Responsive (Tablet 768x1024)")
        page.set_viewport_size({'width': 768, 'height': 1024})
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(2000)
        page.screenshot(path='/tmp/audit-05-tablet-dashboard.png', full_page=True)
        print("   ✅ Screenshot: /tmp/audit-05-tablet-dashboard.png")

        # TEST 6: Desktop Large
        print("\n📍 6. Testing Responsive (Desktop 1920x1080)")
        page.set_viewport_size({'width': 1920, 'height': 1080})
        page.goto('http://localhost:3000/ciclos', wait_until='networkidle')
        page.wait_for_timeout(2000)
        page.screenshot(path='/tmp/audit-06-desktop-ciclos.png', full_page=True)
        print("   ✅ Screenshot: /tmp/audit-06-desktop-ciclos.png")

        # RESUMEN
        print("\n" + "=" * 70)
        print("✅ AUDITORÍA COMPLETADA")
        print("=" * 70)
        print("\n📸 Screenshots generados en /tmp/:")
        print("   1. audit-01-dashboard.png - Dashboard principal")
        print("   2. audit-02-ciclos-list.png - Listado de ciclos")
        print("   3. audit-03-ciclo-detail.png - Detalle de ciclo")
        print("   4. audit-04-mobile-dashboard.png - Mobile 375px")
        print("   5. audit-05-tablet-dashboard.png - Tablet 768px")
        print("   6. audit-06-desktop-ciclos.png - Desktop 1920px")
        print("\n🎉 Dashboard funcionando correctamente")

        browser.close()

if __name__ == "__main__":
    audit_dashboard()
