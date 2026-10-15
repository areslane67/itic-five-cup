import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { checkPassword, clearSession, requireAdmin, setSession } from '../auth.js';
import { fetchTeams, getEvent, query, withTx } from '../db.js';
import { ah, HttpError } from '../errors.js';

export const adminRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new HttpError(429, 'rate_limited', 'Trop de tentatives de connexion. Réessaie dans 15 minutes.')),
});

adminRouter.post('/login', loginLimiter, (req, res) => {
  const { password } = z.object({ password: z.string().max(200) }).parse(req.body);
  if (!checkPassword(password)) throw new HttpError(401, 'bad_password', 'Mot de passe incorrect.');
  setSession(res);
  res.json({ ok: true });
});

adminRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

adminRouter.use(requireAdmin);

const PEOPLE_SQL = `
SELECT p.id, p.first_name AS firstName, p.last_name AS lastName, p.promo, p.class_name AS className,
       p.level, p.contact, p.mode, p.status, p.team_id AS teamId, p.created_at AS createdAt,
       t.name AS teamName, t.code AS teamCode
FROM participants p LEFT JOIN teams t ON t.id = p.team_id`;

adminRouter.get('/dashboard', ah(async (_req, res) => {
  const participants = await query(`${PEOPLE_SQL} WHERE p.status IN ('pre_registered','pending') ORDER BY p.created_at DESC, p.id DESC`);
  const teams = await fetchTeams('ORDER BY t.promo, t.name');
  res.json({
    event: await getEvent(),
    stats: {
      total: participants.filter((p) => p.status === 'pre_registered').length,
      pending: participants.filter((p) => p.status === 'pending').length,
      solos: participants.filter((p) => !p.teamId && p.status === 'pre_registered').length,
      bts1: participants.filter((p) => p.promo === 'BTS 1' && p.status === 'pre_registered').length,
      bts2: participants.filter((p) => p.promo === 'BTS 2' && p.status === 'pre_registered').length,
      openTeams: teams.filter((t) => !t.closed && t.count < t.max).length,
      fullTeams: teams.filter((t) => t.count >= t.max).length,
    },
    participants,
    teams,
  });
}));

adminRouter.patch('/event', ah(async (req, res) => {
  const b = z
    .object({
      registrationsOpen: z.boolean().optional(),
      date: z.string().trim().max(100).optional(),
      venue: z.string().trim().max(150).optional(),
      price: z.string().trim().max(60).optional(),
    })
    .parse(req.body);
  const next = { ...(await getEvent()), ...b };
  await query('UPDATE event SET registrations_open = ?, `date` = ?, venue = ?, price = ? WHERE id = 1', [
    next.registrationsOpen ? 1 : 0, next.date, next.venue, next.price,
  ]);
  res.json(await getEvent());
}));

const assign = (personId, teamId) =>
  withTx(async (c) => {
    const [p] = await query(`SELECT * FROM participants WHERE id = ? AND status = 'pre_registered' FOR UPDATE`, [personId], c);
    if (!p) throw new HttpError(404, 'not_found', 'Participant introuvable.');
    if (p.mode === 'captain') throw new HttpError(400, 'captain', 'Un capitaine ne peut pas être déplacé.');
    const [t] = await fetchTeams('WHERE t.id = ?', [teamId], c, 'FOR UPDATE');
    if (!t) throw new HttpError(404, 'not_found', 'Équipe introuvable.');
    if (t.promo !== p.promo) throw new HttpError(400, 'promo_mismatch', 'Les promotions ne correspondent pas.');
    if (t.closed) throw new HttpError(409, 'team_closed', 'Cette équipe est fermée.');
    if (t.count >= t.max) throw new HttpError(409, 'team_full', 'Cette équipe est complète.');
    await query(`UPDATE participants SET team_id = ?, mode = 'team_member' WHERE id = ?`, [teamId, personId], c);
  });

adminRouter.patch('/participants/:id', ah(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { teamId } = z.object({ teamId: z.number().int().positive() }).parse(req.body);
  await assign(id, teamId);
  res.json({ ok: true });
}));

adminRouter.delete('/participants/:id', ah(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const r = await query(`UPDATE participants SET status = 'cancelled' WHERE id = ? AND status IN ('pre_registered','pending')`, [id]);
  if (!r.affectedRows) throw new HttpError(404, 'not_found', 'Participant introuvable.');
  res.json({ ok: true });
}));

adminRouter.patch('/teams/:id', ah(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { closed } = z.object({ closed: z.boolean() }).parse(req.body);
  const r = await query('UPDATE teams SET closed = ? WHERE id = ?', [closed ? 1 : 0, id]);
  if (!r.affectedRows) throw new HttpError(404, 'not_found', 'Équipe introuvable.');
  res.json({ ok: true });
}));

// Export CSV : UTF-8 avec BOM, séparateur « ; » (ouverture directe dans Excel FR).
// Les cellules commençant par = + - @ sont neutralisées (injection de formules).
const cell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

adminRouter.get('/export.csv', ah(async (_req, res) => {
  const rows = await query(`${PEOPLE_SQL} WHERE p.status = 'pre_registered' ORDER BY p.promo, t.name, p.last_name`);
  const modeLabel = { solo: 'Solo', captain: 'Capitaine', team_member: 'Équipe' };
  const head = ['Prénom', 'Nom', 'Promotion', 'Classe', 'Niveau', 'Contact', 'Participation', 'Équipe', 'Code équipe', 'Inscrit le'];
  const lines = [head.map(cell).join(';')];
  for (const p of rows) {
    lines.push(
      [p.firstName, p.lastName, p.promo, p.className, p.level, p.contact, modeLabel[p.mode], p.teamName, p.teamCode, p.createdAt]
        .map(cell).join(';')
    );
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="itic-five-cup-participants.csv"');
  res.send('\uFEFF' + lines.join('\r\n'));
}));
