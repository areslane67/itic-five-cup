import { Router } from 'express';
import { z } from 'zod';
import { fetchTeams, query, withTx } from '../db.js';
import { ah, HttpError } from '../errors.js';

export const captainRouter = Router();

const TOKEN = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/);
const invalidLink = () => new HttpError(404, 'invalid_link', 'Ce lien est invalide ou a expiré. Contacte le BDE.');

// Espace capitaine : l'accès repose sur le lien secret (manage_token) remis à la création de l'équipe.
captainRouter.get('/captain/:token', ah(async (req, res) => {
  const token = TOKEN.safeParse(req.params.token);
  if (!token.success) throw invalidLink();
  const [team] = await fetchTeams('WHERE t.manage_token = ?', [token.data]);
  if (!team) throw invalidLink();

  const people = await query(
    `SELECT id, first_name AS "firstName", last_name AS "lastName", class_name AS "className", level, mode, status
     FROM participants WHERE team_id = ? AND status IN ('pre_registered','pending')
     ORDER BY created_at, id`,
    [team.id]
  );
  res.json({
    team: { name: team.name, code: team.code, promo: team.promo, count: team.count, max: team.max, full: team.count >= team.max, closed: team.closed },
    members: people.filter((p) => p.status === 'pre_registered'),
    requests: people.filter((p) => p.status === 'pending'),
  });
}));

const decide = (rawToken, personId, action) =>
  withTx(async (c) => {
    const token = TOKEN.safeParse(rawToken);
    if (!token.success) throw invalidLink();
    const [team] = await fetchTeams('WHERE t.manage_token = ?', [token.data], c, 'FOR UPDATE');
    if (!team) throw invalidLink();
    const [p] = await query(
      `SELECT id FROM participants WHERE id = ? AND team_id = ? AND status = 'pending' FOR UPDATE`,
      [personId, team.id], c
    );
    if (!p) throw new HttpError(404, 'not_found', 'Cette demande n’existe plus.');
    if (action === 'accept') {
      if (team.count >= team.max) {
        throw new HttpError(409, 'team_full', 'Ton équipe est complète : tu ne peux plus accepter de joueur.');
      }
      await query(`UPDATE participants SET status = 'pre_registered' WHERE id = ?`, [personId], c);
    } else {
      await query(`UPDATE participants SET status = 'rejected' WHERE id = ?`, [personId], c);
    }
  });

for (const action of ['accept', 'reject']) {
  captainRouter.post(`/captain/:token/requests/:id/${action}`, ah(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    await decide(req.params.token, id, action);
    res.json({ ok: true });
  }));
}

// Suivi de sa propre demande par le joueur (lien secret track_token)
captainRouter.get('/tracking/:token', ah(async (req, res) => {
  const token = TOKEN.safeParse(req.params.token);
  if (!token.success) throw invalidLink();
  const [p] = await query(
    `SELECT p.first_name AS "firstName", p.last_name AS "lastName", p.promo, p.mode, p.status, t.name AS "teamName"
     FROM participants p LEFT JOIN teams t ON t.id = p.team_id WHERE p.track_token = ?`,
    [token.data]
  );
  if (!p) throw invalidLink();
  res.json({ name: `${p.firstName} ${p.lastName}`, promo: p.promo, mode: p.mode, status: p.status, teamName: p.teamName || '' });
}));
