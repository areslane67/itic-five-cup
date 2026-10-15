import crypto from 'node:crypto';
import { fetchTeams, getEvent, query, withTx } from '../db.js';
import { HttpError } from '../errors.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1
const secret = (bytes) => crypto.randomBytes(bytes).toString('base64url');

async function newCode(c) {
  for (let i = 0; i < 25; i++) {
    let code = '';
    for (let j = 0; j < 6; j++) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
    if (!(await query('SELECT 1 FROM teams WHERE code = ?', [code], c)).length) return code;
  }
  throw new Error('Impossible de générer un code unique');
}

export async function isTeamNameAvailable(name, promo) {
  const rows = await query('SELECT 1 FROM teams WHERE LOWER(name) = LOWER(?) AND promo = ?', [name.trim(), promo]);
  return rows.length === 0;
}

// Tout se passe dans une transaction, avec verrou sur la ligne de l'équipe.
// Rejoindre une équipe crée une DEMANDE (status « pending ») que le capitaine doit accepter.
export const register = (v) =>
  withTx(async (c) => {
    if (!(await getEvent(c)).registrationsOpen) {
      throw new HttpError(403, 'closed', 'Les préinscriptions sont fermées pour le moment.');
    }

    // Les demandes refusées ou annulées ne bloquent pas une nouvelle inscription
    const dup = await query(
      `SELECT 1 FROM participants
       WHERE LOWER(first_name) = LOWER(?) AND LOWER(LEFT(last_name, 1)) = LOWER(?)
         AND promo = ? AND status IN ('pre_registered','pending')`,
      [v.firstName, v.lastName[0], v.promo], c
    );
    if (dup.length) {
      throw new HttpError(
        409, 'duplicate',
        'Une inscription très proche existe déjà. Si c’est bien toi, pas besoin de recommencer ; sinon, contacte le BDE pour que l’on règle ça ensemble.'
      );
    }

    let team = null;
    let mode = 'solo';
    let status = 'pre_registered';
    let manageToken = '';

    if (v.kind === 'member') {
      [team] = await fetchTeams('WHERE t.code = ?', [v.teamCode.toUpperCase()], c, 'FOR UPDATE');
      if (!team || team.closed) throw new HttpError(404, 'team_not_found', 'Ce code d’invitation ne correspond à aucune équipe ouverte.');
      if (team.promo !== v.promo) throw new HttpError(400, 'promo_mismatch', 'Tu ne peux rejoindre que les équipes de ta promotion.');
      if (team.count >= team.max) throw new HttpError(409, 'team_full', 'Cette équipe vient de se remplir. Choisis-en une autre.');
      mode = 'team_member';
      status = 'pending';
    }

    if (v.kind === 'captain') {
      const code = await newCode(c);
      manageToken = secret(24);
      try {
        const r = await query(
          'INSERT INTO teams (name, promo, code, manage_token, max_players) VALUES (?, ?, ?, ?, ?)',
          [v.teamName, v.promo, code, manageToken, v.teamSize], c
        );
        team = { id: r.insertId, name: v.teamName, code };
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          throw new HttpError(409, 'team_name_taken', 'Ce nom existe déjà dans ta promotion. Choisis-en un autre.');
        }
        throw e;
      }
      mode = 'captain';
    }

    const trackToken = secret(18);
    await query(
      `INSERT INTO participants
         (first_name, last_name, promo, class_name, level, contact, mode, team_id, status, track_token, consent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [v.firstName, v.lastName, v.promo, v.className, v.level, v.contact, mode, team ? team.id : null, status, trackToken], c
    );

    return {
      name: `${v.firstName} ${v.lastName}`,
      promo: v.promo,
      kind: v.kind,
      status,
      teamName: team ? team.name : '',
      code: v.kind === 'captain' ? team.code : '',
      manageToken,
      trackToken,
    };
  });
