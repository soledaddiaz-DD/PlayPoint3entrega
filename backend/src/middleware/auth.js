import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { query } from "../db.js";
import { HttpError } from "./errors.js";

export function signToken(userRow) {
  return jwt.sign({ sub: String(userRow.id), tv: Number(userRow.token_version) }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: config.jwtExpiresIn,
  });
}

/** Devuelve el id del usuario si el token es válido y sigue vigente; si no, null. */
async function userIdFromRequest(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;

  let payload;
  try {
    payload = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    return null;
  }

  const rows = await query("SELECT id, token_version FROM users WHERE id = ?", [payload.sub]);
  const user = rows[0];
  // Si cambió la contraseña (token_version distinto), las sesiones viejas dejan de servir.
  if (!user || Number(user.token_version) !== Number(payload.tv)) return null;
  return Number(user.id);
}

export async function requireAuth(req, res, next) {
  const id = await userIdFromRequest(req);
  if (!id) {
    throw new HttpError(401, "UNAUTHENTICATED", "Iniciá sesión para continuar.");
  }
  req.userId = id;
  next();
}

export async function optionalAuth(req, res, next) {
  req.userId = await userIdFromRequest(req);
  next();
}
