/**
 * E2E Tests for Courses Catalog and Detail Navigation
 *
 * Tests the complete user flow:
 * 1. View courses catalog with images
 * 2. Click "Ver Curso" button
 * 3. Navigate to detail page
 * 4. View course details
 * 5. Return to catalog
 *
 * Related commits: 22e9718, 799c5c6
 */
/**
 * Test Data Setup
 *
 * Expected test courses in database:
 */
export declare const TEST_COURSES: {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    descripcion: string;
    area: string;
    duracionReferencia: number;
    precioReferencia: number;
}[];
/**
 * Console Log Patterns
 *
 * Expected console output during normal operation:
 */
export declare const EXPECTED_CONSOLE_PATTERNS: {
    catalog_fetch_start: RegExp;
    catalog_fetch_success: RegExp;
    catalog_fetch_error: RegExp;
    detail_fetch_start: RegExp;
    detail_fetch_success: RegExp;
    detail_fetch_error: RegExp;
};
/**
 * Performance Benchmarks
 *
 * Expected response times:
 */
export declare const PERFORMANCE_BENCHMARKS: {
    first_load_max: number;
    cached_load_max: number;
    cache_duration: number;
    stale_while_revalidate: number;
};
//# sourceMappingURL=courses-catalog.test.d.ts.map