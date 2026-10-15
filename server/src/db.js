import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true,
});

// Exécute une requête (SELECT => tableau de lignes, INSERT/UPDATE/DELETE => { insertId, affectedRows })
export async function query(sql, params = [], conn = pool) {
  const [rows] = await conn.query(sql, params);
  return rows;
}

// Transaction : commit si tout passe, rollback sinon
export async function withTx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function checkDatabase() {
  try {
    await query('SELECT 1 FROM event LIMIT 1');
  } catch (e) {
    console.error(`\nBase MySQL inaccessible ou vide (${e.code || e.message}).`);
    console.error(`Vérifie DB_* dans .env et importe database/schema.sql dans la base « ${config.db.database} ».\n`);
    process.exit(1);
  }
}

const TEAMS_BASE = `
SELECT t.id, t.name, t.code, t.manage_token AS manageToken, t.promo, t.max_players AS maxPlayers, t.closed,
  (SELECT COUNT(*) FROM participants p WHERE p.team_id = t.id AND p.status = 'pre_registered') AS memberCount
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
