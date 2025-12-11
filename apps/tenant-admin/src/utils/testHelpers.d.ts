import { Express } from 'express';
interface MockPayload {
    create: (options: any) => Promise<any>;
    find: (options: any) => Promise<any>;
    findByID: (options: any) => Promise<any>;
    update: (options: any) => Promise<any>;
    delete: (options: any) => Promise<any>;
}
export interface TestContext {
    payload: MockPayload;
    app: Express;
    adminToken: string;
}
/**
 * Creates a test context with Payload instance and Express app
 * Initializes a test database and provides authentication tokens
 */
export declare function createTestContext(): Promise<TestContext>;
/**
 * Cleanup test context and reset mock data
 */
export declare function cleanupTestContext(): Promise<void>;
/**
 * Authenticates as admin and returns JWT token
 * @param app - Express application instance
 * @returns JWT authentication token
 */
export declare function loginAsAdmin(app: Express): Promise<string>;
/**
 * Authenticates as a specific role and returns JWT token
 * @param app - Express application instance
 * @param role - User role to login as
 * @returns JWT authentication token
 */
export declare function loginAsRole(app: Express, role: string): Promise<string>;
/**
 * Creates a test cycle for testing purposes
 * @param payload - Payload instance
 * @returns Created cycle document
 */
export declare function createTestCycle(payload: Payload): Promise<any>;
/**
 * Creates a test campus for testing purposes
 * @param payload - Payload instance
 * @returns Created campus document
 */
export declare function createTestCampus(payload: Payload): Promise<any>;
/**
 * Creates a test course for testing purposes
 * @param payload - Payload instance
 * @param cycleId - ID of the cycle to associate with
 * @returns Created course document
 */
export declare function createTestCourse(payload: Payload, cycleId: number | string): Promise<any>;
/**
 * Cleans up test data from a collection
 * @param payload - MockPayload instance
 * @param collection - Collection name to clean
 */
export declare function cleanupCollection(payload: MockPayload, collection: string): Promise<void>;
export {};
//# sourceMappingURL=testHelpers.d.ts.map