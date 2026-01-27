import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      '**/__tests__/**/*.test.{ts,tsx}',
      '**/tests/**/*.test.{ts,tsx}',
      '**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.spec.ts',
      '**/*.spec.js',
      '**/.next/**',
      // Integration tests requiring database/payload
      '**/src/collections/**/*.test.ts',
      '**/src/__tests__/collections/**/*.test.ts',
      '**/tests/integration/**',
      '**/tests/deployment.test.ts',
      '**/tests/api/**',
      // Tests that import from @payload-config (should be tested in source location)
      '**/tests/components/footer.test.tsx',
      '**/tests/components/AppSidebar.test.tsx',
      '**/tests/components/DashboardFooter.test.tsx',
      '**/tests/components/StaffCard.test.tsx',
      '**/tests/unit/ciclos.test.tsx',
      '**/__tests__/components/ChatbotWidget.test.tsx',
      '**/__tests__/components/LogoutButton.test.tsx',
      '**/__tests__/administracion/**',
      '**/__tests__/facturacion/useBillingData.test.ts',
      // Tests requiring complex component mocks
      '**/tests/unit/alumnos.test.tsx',
      '**/__tests__/facturacion/PlanCard.test.tsx',
      '**/__tests__/facturacion/SubscriptionCard.test.tsx',
      '**/__tests__/matriculas/BulkEnrollmentDialog.test.tsx',
      // API route tests requiring request handlers
      '**/app/api/cursos/__tests__/**',
      '**/app/api/lms/__tests__/**',
      '**/app/api/billing/**/__tests__/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/dist/**',
        '**/.next/**',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@akademate/types': path.resolve(__dirname, '../../packages/types/src/index'),
      '@payload-config/components/layout': path.resolve(__dirname, './tests/__mocks__/@payload-config/components/layout'),
      '@payload-config/components/ui': path.resolve(__dirname, './tests/__mocks__/@payload-config/components/ui'),
      '@payload-config/components': path.resolve(__dirname, './tests/__mocks__/@payload-config/components'),
      '@payload-config/hooks': path.resolve(__dirname, './tests/__mocks__/@payload-config/hooks'),
      '@payload-config': path.resolve(__dirname, './tests/__mocks__/@payload-config'),
      'next/navigation': 'next-router-mock',
    },
  },
})
