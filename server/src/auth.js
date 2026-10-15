import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { HttpError } from './errors.js';

const COOKIE = 'fivecup_admin';
const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();

export const checkPassword = (p) => crypto.timingSafeEqual(digest(p), digest(config.adminPassword));

export function setSession(res) {
  const token = jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: '8h', algorithm: 'HS256' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 8 * 3600 * 1000,
    path: '/',
  });
}

export const clearSession = (res) => res.clearCookie(COOKIE, { path: '/' });

export function requireAdmin(req, _res, next) {
  try {
    jwt.verify(req.cookies[COOKIE], config.jwtSecret, { algorithms: ['HS256'] });
    next();
  } catch {
    next(new HttpError(401, 'unauthorized', 'Connexion requise.'));
  }
}
