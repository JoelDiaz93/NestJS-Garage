import { validateEnvironment } from '../src/config/env.validation';

const base = {
  NODE_ENV: 'development',
  DB_HOST: 'localhost',
  DB_NAME: 'garageflow',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'local-password',
  JWT_SECRET: '12345678901234567890123456789012',
};

describe('environment validation', () => {
  it('accepts a safe development configuration', () => {
    expect(validateEnvironment({ ...base })).toBeDefined();
  });

  it('rejects synchronize in production', () => {
    expect(() => validateEnvironment({ ...base, NODE_ENV: 'production', DB_SYNC: 'true' }))
      .toThrow('DB_SYNC must be false in production');
  });

  it('rejects wildcard CORS in production', () => {
    expect(() => validateEnvironment({ ...base, NODE_ENV: 'production', CORS_ORIGIN: '*' }))
      .toThrow('CORS_ORIGIN cannot be * in production');
  });
});
