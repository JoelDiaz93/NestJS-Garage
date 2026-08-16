type Env = Record<string, unknown>;

const trueValues = new Set(['true', '1', 'yes', 'on']);

export function envBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  return trueValues.has(String(value).toLowerCase());
}

export function validateEnvironment(config: Env): Env {
  const databaseUrl = String(config.DATABASE_URL ?? '').trim();
  const discreteDatabaseKeys = ['DB_HOST', 'DB_NAME', 'DB_USERNAME', 'DB_PASSWORD'];
  const missingDatabaseKeys = databaseUrl
    ? []
    : discreteDatabaseKeys.filter((key) => !String(config[key] ?? '').trim());

  if (missingDatabaseKeys.length) {
    throw new Error(
      `Configure DATABASE_URL or the database variables: ${missingDatabaseKeys.join(', ')}`,
    );
  }

  if (!String(config.JWT_SECRET ?? '').trim()) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  const jwtSecret = String(config.JWT_SECRET);
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  const nodeEnv = String(config.NODE_ENV ?? 'development').toLowerCase();
  const isProduction = nodeEnv === 'production';
  const demoMode = envBoolean(config.DEMO_MODE, false);

  if (isProduction && envBoolean(config.DB_SYNC)) {
    throw new Error('DB_SYNC must be false in production. Use migrations instead.');
  }

  if (isProduction && envBoolean(config.SEED_ENABLED) && !demoMode) {
    throw new Error('SEED_ENABLED is only allowed in production when DEMO_MODE=true');
  }

  if (isProduction && String(config.CORS_ORIGIN ?? '').trim() === '*') {
    throw new Error('CORS_ORIGIN cannot be * in production');
  }

  const storage = String(config.MEDIA_STORAGE ?? 'local').toLowerCase();
  if (!['local', 'cloudinary'].includes(storage)) {
    throw new Error('MEDIA_STORAGE must be either local or cloudinary');
  }

  if (storage === 'cloudinary') {
    const cloudinaryKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = cloudinaryKeys.filter((key) => !String(config[key] ?? '').trim());
    if (missing.length) {
      throw new Error(`Cloudinary storage requires: ${missing.join(', ')}`);
    }
  }

  const taxRate = Number(config.TAX_RATE ?? 0.15);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new Error('TAX_RATE must be a decimal between 0 and 1');
  }

  const poolMax = Number(config.DB_POOL_MAX ?? 5);
  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 20) {
    throw new Error('DB_POOL_MAX must be an integer between 1 and 20');
  }

  return config;
}
