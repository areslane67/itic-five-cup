import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { fetchTeams, getEvent, toPublicTeam } from '../db.js';
import { ah, HttpError } from '../errors.js';
import { isTeamNameAvailable, register } from '../services/registration.js';

export const publicRouter = Router();

const PROMO = z.enum(['BTS 1', 'BTS 2']);

publicRouter.get('/event', ah(async (_req, res) => res.json(await getEvent())));

publicRouter.get('/teams', ah(async (req, res) => {
  const promo = PROMO.parse(req.query.promo);
  const rows = await fetchTeams('WHERE t.promo = ? AND t.closed = 0 ORDER BY t.name', [promo]);
  res.json(rows.map(toPublicTeam));
}));

publicRouter.get('/teams/name-available', ah(async (req, res) => {
  const promo = PROMO.parse(req.query.promo);
  const name = z.string().trim().min(1).max(30).parse(req.query.name);
  res.json({ available: await isTeamNameAvailable(name, promo) });
}));

publicRouter.get('/teams/:code', ah(async (req, res) => {
  const code = z.string().regex(/^[A-Za-z0-9]{3,12}$/).safeParse(req.params.code);
  const [t] = code.success ? await fetchTeams('WHERE t.code = ?', [code.data.toUpperCase()]) : [];
  if (!t || t.closed) throw new HttpError(404, 'team_not_found', 'Équipe introuvable.');
  res.json(toPublicTeam(t));
}));

const registrationSchema = z
  .object({
    kind: z.enum(['solo', 'captain', 'member']),
    promo: PROMO,
    firstName: z.string().trim().min(1, 'Indique ton prénom.').max(60),
    lastName: z.string().trim().min(1, 'Indique ton nom.').max(60),
    className: z.string().trim().max(40).default(''),
    level: z.enum(['', 'Loisir', 'Intermédiaire', 'Compétition']).default(''),
    contact: z.string().trim().max(120).default(''),
    consent: z.literal(true, { errorMap: () => ({ message: 'Coche la case pour continuer.' }) }),
    teamName: z.string().trim().min(2, 'Donne un nom à ton équipe (2 caractères minimum).').max(30).optional(),
    teamSize: z.number().int().min(5).max(8).optional(),
    teamCode: z.string().regex(/^[A-Za-z0-9]{3,12}$/).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === 'captain' && (!v.teamName || !v.teamSize)) {
      ctx.addIssue({ code: 'custom', path: ['teamName'], message: 'Nom et taille de l’équipe requis.' });
    }
    if (v.kind === 'member' && !v.teamCode) {
      ctx.addIssue({ code: 'custom', path: ['teamCode'], message: 'Code d’équipe requis.' });
    }
  });

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new HttpError(429, 'rate_limited', 'Trop de tentatives. Réessaie dans un moment ou contacte le BDE.')),
});

publicRouter.post('/registrations', registrationLimiter, ah(async (req, res) => {
  const input = registrationSchema.parse(req.body);
  res.status(201).json(await register(input));
}));
