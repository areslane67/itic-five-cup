import cookieParser from 'cookie-parser';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { config } from './config.js';
import { checkDatabase } from './db.js';
import { HttpError } from './errors.js';
import { adminRouter } from './routes/admin.js';
import { captainRouter } from './routes/captain.js';
import { publicRouter } from './routes/public.js';

const app = express();
if (config.prod) app.set('trust proxy', 1); // derrière un reverse proxy / hébergeur HTTPS

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'upgrade-insecure-requests': null,
      },
    },
  })
);
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/api/admin', adminRouter);
app.use('/api', captainRouter);
app.use('/api', publicRouter);
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'not_found', 'Route inconnue.')));

// Front React compilé (npm run build) servi par le même serveur
const dist = fileURLToPath(new URL('../../client/dist', import.meta.url));
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile('index.html', { root: dist }));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const fields = {};
    for (const i of err.issues) fields[i.path[0] ?? '_'] ??= i.message;
    return res.status(400).json({
      error: { code: 'validation', message: Object.values(fields)[0] || 'Données invalides.', fields },
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
  }
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: { code: 'bad_request', message: 'Requête invalide.' } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'server_error', message: 'Erreur serveur. Réessaie dans un instant.' } });
});

await checkDatabase();
app.listen(config.port, () => console.log(`ITIC Five Cup — API prête sur http://localhost:${config.port}`));
