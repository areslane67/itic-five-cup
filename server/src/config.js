import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const prod = process.env.NODE_ENV === 'production';

function required(name, devFallback) {
  const v = process.env[name];
  if (v) return v;
  if (prod) {
    console.error(`Variable d'environnement manquante : ${name}`);
    process.exit(1);
  }
  console.warn(`[dev] ${name} absent : valeur de démonstration utilisée.`);
  return devFallback;
}

export const config = {
  prod,
  port: Number(process.env.PORT) || 3001,
  jwtSecret: required('JWT_SECRET', 'dev-secret-a-remplacer'),
  adminPassword: required('ADMIN_PASSWORD', 'bde'),
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : prod,
  databaseUrl: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/itic'),
};
