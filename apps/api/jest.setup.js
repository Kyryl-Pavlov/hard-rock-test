// Env required by src/config.ts, so modules can be imported in tests.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret';
