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
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itic',
  },
};
