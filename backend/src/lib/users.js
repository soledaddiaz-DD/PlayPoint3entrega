import { query } from "../db.js";
import { config } from "../config.js";

const days = Number(config.limits.usernameCooldownDays);
const mins = Number(config.limits.avatarCooldownMinutes);

/*
  Trae al usuario y, calculado por la base de datos (misma hora para todos),
  cuantos segundos han de faltar para poder cambiar el usuario o la foto.
*/
const USER_SELECT = `
  SELECT u.*,
    GREATEST(0, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(),
      DATE_ADD(u.username_changed_at, INTERVAL ${days} DAY))) AS username_retry_sec,
    CASE WHEN u.avatar_changed_at IS NULL THEN 0 ELSE
      GREATEST(0, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(),
        DATE_ADD(u.avatar_changed_at, INTERVAL ${mins} MINUTE))) END AS avatar_retry_sec
  FROM users u`;

export async function findUserById(id) {
  const rows = await query(`${USER_SELECT} WHERE u.id = ?`, [id]);
  return rows[0] ?? null;
}

export const avatarUrlFor = (filename) => (filename ? `/uploads/avatars/${filename}` : null);

/** se le manda al navegador*/
export function serializeUser(row) {
  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    birthDate: row.birth_date,
    gender: row.gender,
    phone: row.phone,
    city: row.city ?? "",
    description: row.description ?? "",
    avatarUrl: avatarUrlFor(row.avatar_path),
    createdAt: row.created_at,
    limits: {
      usernameCooldownDays: config.limits.usernameCooldownDays,
      avatarCooldownMinutes: config.limits.avatarCooldownMinutes,
      usernameRetryAfterSec: Number(row.username_retry_sec) || 0,
      avatarRetryAfterSec: Number(row.avatar_retry_sec) || 0,
    },
  };
}

/** si falla el inicio de sesion */
export async function logAuthEvent(req, { userId = null, type, email = null }) {
  try {
    await query(
      `INSERT INTO login_events (user_id, event_type, email, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [
        userId,
        type,
        email ? String(email).slice(0, 254) : null,
        req.ip ? String(req.ip).slice(0, 45) : null,
        req.get("user-agent") ? req.get("user-agent").slice(0, 255) : null,
      ]
    );
  } catch (err) {
  
    console.error("[login_events]", err.message);
  }
}
