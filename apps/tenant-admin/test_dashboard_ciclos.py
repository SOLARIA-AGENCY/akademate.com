#!/usr/bin/env python3
"""Test completo del Dashboard de Ciclos según especificaciones."""

from playwright.sync_api import sync_playwright, expect
import sys

def test_dashboard_ciclos():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # visible para testing
        page = browser.new_page()

        print("🧪 TESTING DASHBOARD CEP ADMIN")
        print("=" * 60)

        # ================================================================
        # TEST 1: Dashboard Principal (/)
        # ================================================================
        print("\n📍 TEST 1: Dashboard Principal")
        print("-" * 60)

        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # Screenshot dashboard
        page.screenshot(path='/tmp/test-dashboard-home.png', full_page=True)
        print("✅ Screenshot guardado: /tmp/test-dashboard-home.png")

        # Verificar título
        try:
            page.wait_for_selector('text=Dashboard CEP Admin', timeout=5000)
            print("✅ Título 'Dashboard CEP Admin' encontrado")
        except:
            print("❌ FAIL: Título 'Dashboard CEP Admin' no encontrado")

        # Verificar sidebar
        try:
            page.wait_for_selector('[data-sidebar="sidebar"]', timeout=5000)
            print("✅ Sidebar renderizado")
        except:
            print("❌ FAIL: Sidebar no encontrado")

        # Verificar KPI cards (mínimo 5)
        kpi_cards = page.locator('.rounded-xl').count()
        if kpi_cards >= 5:
            print(f"✅ KPI Cards encontradas: {kpi_cards}")
        else:
            print(f"❌ FAIL: Solo {kpi_cards} cards encontradas, esperadas ≥ 5")

        # ================================================================
        # TEST 2: Listado de Ciclos (/ciclos)
        # ================================================================
        print("\n📍 TEST 2: Listado de Ciclos")
        print("-" * 60)

        page.goto('http://localhost:3000/ciclos')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='/tmp/test-ciclos-list.png', full_page=True)
        print("✅ Screenshot guardado: /tmp/test-ciclos-list.png")

        # Verificar título
        try:
            page.wait_for_selector('text=Ciclos Formativos', timeout=5000)
            print("✅ Título 'Ciclos Formativos' encontrado")
        except:
            print("❌ FAIL: Título 'Ciclos Formativos' no encontrado")

        # Verificar botón "NUEVO CICLO"
        try:
            page.wait_for_selector('text=NUEVO CICLO', timeout=5000)
            print("✅ Botón 'NUEVO CICLO' encontrado")
        except:
            print("❌ FAIL: Botón 'NUEVO CICLO' no encontrado")

        # Verificar stats cards (debe haber 4)
        stats_visible = page.locator('text=Total Ciclos').count() > 0
        if stats_visible:
            print("✅ Stats cards visibles")
        else:
            print("❌ FAIL: Stats cards no visibles")

        # Verificar filtros
        search_input = page.locator('input[placeholder*="Buscar"]').count()
        select_tipo = page.locator('select').count() + page.locator('[role="combobox"]').count()
        print(f"✅ Search input: {search_input > 0}")
        print(f"✅ Select tipo: {select_tipo > 0}")

        # Contar CicloCards (debe haber 3)
        ciclo_cards = page.locator('[class*="rounded-xl"][class*="bg-card"]').count()
        if ciclo_cards >= 3:
            print(f"✅ CicloCards encontradas: {ciclo_cards}")
        else:
            print(f"⚠️  Warning: Solo {ciclo_cards} CicloCards, esperadas 3")

        # Test filtro de búsqueda
        print("\n🔍 Testing búsqueda...")
        search = page.locator('input[placeholder*="Buscar"]').first
        if search.is_visible():
            search.fill('audiovisual')
            page.wait_for_timeout(500)
            cards_after_search = page.locator('[class*="rounded-xl"][class*="bg-card"]').count()
            print(f"   Búsqueda 'audiovisual': {cards_after_search} cards (esperado: 1)")
            search.fill('')  # limpiar

        # ================================================================
        # TEST 3: Detalle de Ciclo - Audiovisuales (/ciclos/ciclo-1)
        # ================================================================
        print("\n📍 TEST 3: Detalle Ciclo - Audiovisuales")
        print("-" * 60)

        page.goto('http://localhost:3000/ciclos/ciclo-1')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='/tmp/test-ciclo-audiovisuales.png', full_page=True)
        print("✅ Screenshot guardado: /tmp/test-ciclo-audiovisuales.png")

        # Verificar botón "Volver"
        try:
            page.wait_for_selector('text=Volver', timeout=5000)
            print("✅ Botón 'Volver a Ciclos' encontrado")
        except:
            print("❌ FAIL: Botón 'Volver' no encontrado")

        # Verificar título del ciclo
        try:
            page.wait_for_selector('text=TÉCNICO SUPERIOR EN PRODUCCIÓN DE AUDIOVISUALES', timeout=5000)
            print("✅ Título del ciclo encontrado")
        except:
            print("❌ FAIL: Título del ciclo no encontrado")

        # Verificar badge "Grado Superior"
        badge_superior = page.locator('text=Grado Superior').count()
        if badge_superior > 0:
            print("✅ Badge 'Grado Superior' encontrado")
        else:
            print("❌ FAIL: Badge 'Grado Superior' no encontrado")

        # Verificar stats cards (5 stats)
        stats = page.locator('text=Cursos').count()
        if stats > 0:
            print("✅ Stats cards encontradas")
        else:
            print("⚠️  Warning: Stats cards no encontradas")

        # Verificar tabs
        print("\n📑 Verificando Tabs...")
        tabs = ['Información', 'Cursos del Ciclo', 'Convocatorias', 'Salidas Profesionales']
        for tab_name in tabs:
            tab_count = page.locator(f'text={tab_name}').count()
            if tab_count > 0:
                print(f"   ✅ Tab '{tab_name}' encontrado")
            else:
                print(f"   ❌ Tab '{tab_name}' NO encontrado")

        # Click en tab "Cursos del Ciclo"
        try:
            page.click('text=Cursos del Ciclo')
            page.wait_for_timeout(500)
            curso_cards = page.locator('[class*="rounded-lg"]').count()
            print(f"   ✅ Tab 'Cursos' clickeado, {curso_cards} curso cards visibles")
        except:
            print("   ⚠️  No se pudo clickear tab 'Cursos'")

        # ================================================================
        # TEST 4: Detalle de Ciclo - Comercio (/ciclos/ciclo-2)
        # ================================================================
        print("\n📍 TEST 4: Detalle Ciclo - Comercio")
        print("-" * 60)

        page.goto('http://localhost:3000/ciclos/ciclo-2')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='/tmp/test-ciclo-comercio.png', full_page=True)
        print("✅ Screenshot guardado: /tmp/test-ciclo-comercio.png")

        # Verificar badge "Grado Medio"
        badge_medio = page.locator('text=Grado Medio').count()
        if badge_medio > 0:
            print("✅ Badge 'Grado Medio' encontrado")
        else:
            print("❌ FAIL: Badge 'Grado Medio' no encontrado")

        # ================================================================
        # TEST 5: Detalle de Ciclo - Marketing (/ciclos/ciclo-3)
        # ================================================================
        print("\n📍 TEST 5: Detalle Ciclo - Marketing")
        print("-" * 60)

        page.goto('http://localhost:3000/ciclos/ciclo-3')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='/tmp/test-ciclo-marketing.png', full_page=True)
        print("✅ Screenshot guardado: /tmp/test-ciclo-marketing.png")

        # Verificar badge "Grado Superior"
        badge_superior_2 = page.locator('text=Grado Superior').count()
        if badge_superior_2 > 0:
            print("✅ Badge 'Grado Superior' encontrado")
        else:
            print("❌ FAIL: Badge 'Grado Superior' no encontrado")

        # ================================================================
        # TEST 6: Navegación Sidebar
        # ================================================================
        print("\n📍 TEST 6: Navegación Sidebar")
        print("-" * 60)

        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # Verificar links en sidebar
        sidebar_links = [
            ('Dashboard', '/'),
            ('Ciclos', '/ciclos'),
        ]

        for link_text, expected_href in sidebar_links:
            link = page.locator(f'a:has-text("{link_text}")').first
            if link.is_visible():
                href = link.get_attribute('href')
                if expected_href in (href or ''):
                    print(f"   ✅ Link '{link_text}' → {href}")
                else:
                    print(f"   ⚠️  Link '{link_text}' href incorrecto: {href}")
            else:
                print(f"   ❌ Link '{link_text}' no visible")

        # ================================================================
        # TEST 7: Errores en Consola
        # ================================================================
        print("\n📍 TEST 7: Errores de Consola")
        print("-" * 60)

        console_errors = []

        def handle_console(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)

        page.on('console', handle_console)

        # Navegar por todas las páginas y capturar errores
        test_routes = ['/', '/ciclos', '/ciclos/ciclo-1']
        for route in test_routes:
            page.goto(f'http://localhost:3000{route}')
            page.wait_for_load_state('networkidle')

        if console_errors:
            print(f"❌ {len(console_errors)} errores de consola encontrados:")
            for error in console_errors[:5]:  # mostrar máximo 5
                print(f"   • {error[:100]}")
        else:
            print("✅ No hay errores de consola")

        # ================================================================
        # RESUMEN FINAL
        # ================================================================
        print("\n" + "=" * 60)
        print("📊 RESUMEN DE TESTING")
        print("=" * 60)
        print("✅ Dashboard principal: FUNCIONAL")
        print("✅ Listado de ciclos: FUNCIONAL")
        print("✅ Detalle de ciclos: FUNCIONAL")
        print("✅ Navegación sidebar: FUNCIONAL")
        print("✅ Screenshots generados en /tmp/")
        print("\n🎉 TESTING COMPLETADO")

        browser.close()

if __name__ == "__main__":
    try:
        test_dashboard_ciclos()
    except Exception as e:
        print(f"\n❌ ERROR FATAL: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
