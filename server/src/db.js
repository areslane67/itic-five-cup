import pg from 'pg';
import { config } from './config.js';

// TIMESTAMP renvoyé en texte « AAAA-MM-JJ HH:MM:SS » (comme dateStrings de mysql2)
pg.types.setTypeParser(1114, (v) => v.slice(0, 19));

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });

// Les requêtes sont écrites avec des « ? » : convertis en $1, $2… pour PostgreSQL
const toPg = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

// Exécute une requête (SELECT / RETURNING => tableau de lignes, UPDATE/DELETE => { affectedRows })
export async function query(sql, params = [], conn = pool) {
  const r = await conn.query(toPg(sql), params);
  if (r.fields.length) return r.rows;
  return { affectedRows: r.rowCount };
}

// Transaction : commit si tout passe, rollback sinon
export async function withTx(fn) {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    const result = await fn(conn);
    await conn.query('COMMIT');
    return result;
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
}

export async function checkDatabase() {
  try {
    await query('SELECT 1 FROM event LIMIT 1');
  } catch (e) {
    console.error(`\nBase PostgreSQL inaccessible ou vide (${e.code || e.message}).`);
    console.error(`Vérifie DATABASE_URL dans .env et exécute bdd.sql sur la base.\n`);
    process.exit(1);
  }
}

const TEAMS_BASE = `
SELECT t.id, t.name, t.code, t.manage_token AS "manageToken", t.promo, t.max_players AS "maxPlayers", t.closed,
  (SELECT COUNT(*) FROM participants p WHERE p.team_id = t.id AND p.status = 'pre_registered') AS "memberCount"
FROM teams t`;

// Équipes avec leur effectif. `suffix` permet d'ajouter FOR UPDATE (verrou) dans une transaction.
export async function fetchTeams(where = '', params = [], conn = pool, suffix = '') {
  const rows = await query(`${TEAMS_BASE} ${where} ${suffix}`, params, conn);
  return rows.map((t) => ({
    id: t.id, name: t.name, code: t.code, manageToken: t.manageToken, promo: t.promo,
    max: t.maxPlayers, count: Number(t.memberCount), closed: !!t.closed,
  }));
}

export const toPublicTeam = (t) => ({
  name: t.name, code: t.code, promo: t.promo, count: t.count, max: t.max, full: t.count >= t.max,
});

export async function getEvent(conn = pool) {
  const [e] = await query('SELECT * FROM event WHERE id = 1', [], conn);
  return { registrationsOpen: !!e.registrations_open, date: e.date, venue: e.venue, price: e.price };
}
