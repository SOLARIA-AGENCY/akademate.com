// Global test teardown
// NOTE: This is a globalTeardown function, NOT a test file
// Do not use afterEach/afterAll here - use them in individual test files
export default async function teardown() {
  console.log('🧹 Cleaning up test environment...');
  console.log('✅ All tests completed');

  // Cleanup will be handled by Payload
  // Each test suite should clean up its own data
}
