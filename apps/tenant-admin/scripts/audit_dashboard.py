#!/usr/bin/env python3
"""
CEP Dashboard Audit Script
Tests: Dark mode, auth protection, data connectivity
"""

from playwright.sync_api import sync_playwright
import os

BASE_URL = "http://46.62.222.138"
SCREENSHOTS_DIR = "/tmp/cep_audit"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def audit_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        results = []

        # Test 1: Check login page and dark mode
        print("\n=== TEST 1: Login Page & Dark Mode ===")
        page.goto(f"{BASE_URL}/auth/login")
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f"{SCREENSHOTS_DIR}/01_login_page.png", full_page=True)

        # Check if page has dark class
        html_class = page.locator('html').get_attribute('class') or ''
        body_class = page.locator('body').get_attribute('class') or ''
        is_dark = 'dark' in html_class or 'dark' in body_class
        print(f"  Dark mode active: {is_dark}")
        print(f"  HTML class: {html_class}")

        # Check for theme toggle
        theme_toggle = page.locator('[data-theme-toggle], [aria-label*="theme"], button:has-text("Dark"), button:has-text("Light")').count()
        print(f"  Theme toggle found: {theme_toggle > 0}")
        results.append(('Login Dark Mode', is_dark, 'Expected light mode by default'))
        results.append(('Theme Toggle', theme_toggle > 0, 'No theme selector found'))

        # Test 2: Check if dashboard is protected
        print("\n=== TEST 2: Dashboard Auth Protection ===")
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f"{SCREENSHOTS_DIR}/02_dashboard_no_auth.png", full_page=True)

        current_url = page.url
        redirected_to_login = '/auth/login' in current_url
        print(f"  Current URL: {current_url}")
        print(f"  Redirected to login: {redirected_to_login}")
        results.append(('Dashboard Protected', redirected_to_login, f'Dashboard accessible without auth at {current_url}'))

        # Test 3: Check /cursos protection
        print("\n=== TEST 3: /cursos Auth Protection ===")
        page.goto(f"{BASE_URL}/cursos")
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f"{SCREENSHOTS_DIR}/03_cursos_no_auth.png", full_page=True)

        current_url = page.url
        cursos_protected = '/auth/login' in current_url
        print(f"  Current URL: {current_url}")
        print(f"  Protected: {cursos_protected}")
        results.append(('/cursos Protected', cursos_protected, f'Cursos accessible without auth at {current_url}'))

        # Test 4: Check /sedes protection
        print("\n=== TEST 4: /sedes Auth Protection ===")
        page.goto(f"{BASE_URL}/sedes")
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f"{SCREENSHOTS_DIR}/04_sedes_no_auth.png", full_page=True)

        current_url = page.url
        sedes_protected = '/auth/login' in current_url
        print(f"  Current URL: {current_url}")
        print(f"  Protected: {sedes_protected}")
        results.append(('/sedes Protected', sedes_protected, f'Sedes accessible without auth at {current_url}'))

        # Test 5: Check data connectivity on dashboard
        print("\n=== TEST 5: Dashboard Data Connectivity ===")
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)  # Wait for data to load

        # Check for loading states or empty states
        loading_indicators = page.locator('.loading, .spinner, [data-loading], .animate-spin').count()
        empty_states = page.locator('text=No hay datos, text=Sin datos, text=No data, text=Empty').count()
        error_states = page.locator('text=Error, text=error, .error, [data-error]').count()

        # Check for actual data content
        tables = page.locator('table').count()
        cards_with_data = page.locator('.card, [data-card]').count()
        list_items = page.locator('li, .list-item').count()

        print(f"  Loading indicators: {loading_indicators}")
        print(f"  Empty states: {empty_states}")
        print(f"  Error states: {error_states}")
        print(f"  Tables found: {tables}")
        print(f"  Cards found: {cards_with_data}")

        page.screenshot(path=f"{SCREENSHOTS_DIR}/05_dashboard_data.png", full_page=True)

        has_data = tables > 0 or (cards_with_data > 0 and empty_states == 0)
        results.append(('Dashboard Has Data', has_data, f'Tables: {tables}, Cards: {cards_with_data}, Empty: {empty_states}'))

        # Test 6: Check cursos page data
        print("\n=== TEST 6: Cursos Page Data ===")
        page.goto(f"{BASE_URL}/cursos")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        # Look for course cards or table rows
        course_items = page.locator('[data-course], .course-card, .curso, tr').count()
        empty_cursos = page.locator('text=No hay cursos, text=Sin cursos, text=No courses').count()

        print(f"  Course items found: {course_items}")
        print(f"  Empty states: {empty_cursos}")

        page.screenshot(path=f"{SCREENSHOTS_DIR}/06_cursos_data.png", full_page=True)

        # Get page content for debugging
        page_text = page.inner_text('body')
        print(f"  Page text preview: {page_text[:500]}...")

        browser.close()

        # Summary
        print("\n" + "="*60)
        print("AUDIT SUMMARY")
        print("="*60)

        for name, passed, detail in results:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status} - {name}")
            if not passed:
                print(f"       {detail}")

        print(f"\nScreenshots saved to: {SCREENSHOTS_DIR}")
        return results

if __name__ == "__main__":
    audit_dashboard()
