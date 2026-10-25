import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { config } from "../config.js";
import { HttpError } from "../middleware/errors.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { avatarUpload, processAvatar, removeAvatar, saveAvatar } from "../lib/images.js";
import { findUserById, serializeUser } from "../lib/users.js";
import * as v from "../lib/validate.js";

const router = Router();
router.use(requireAuth);

const days = Number(config.limits.usernameCooldownDays);
const mins = Number(config.limits.avatarCooldownMinutes);

function cooldownError(what, retryAfterSec) {
  const msg =
    what === "username"
      ? `Podés cambiar tu nombre de usuario una vez cada ${days} días.`
      : `Podés cambiar tu foto una vez cada ${mins} minutos.`;
  return new HttpError(429, "COOLDOWN", msg, { field: what === "username" ? "username" : "avatar", retryAfterSec });
}

/* GET /api/me */
router.get("/", async (req, res) => {
  const row = await findUserById(req.userId);
  if (!row) throw new HttpError(401, "UNAUTHENTICATED", "Iniciá sesión para continuar.");
  res.json({ user: serializeUser(row) });
});

/* PATCH /api/me   { fullName?, phone?, city?, description? } */
router.patch("/", async (req, res) => {
  const b = req.body ?? {};
  const sets = [];
  const params = [];

  if (b.fullName !== undefined) {
    sets.push("full_name = ?");
    params.push(v.text(b.fullName, "fullName", "El nombre", { min: 2, max: 80 }));
  }
  if (b.phone !== undefined) {
    sets.push("phone = ?");
    params.push(v.phone(b.phone));
  }
  if (b.city !== undefined) {
    sets.push("city = ?");
    params.push(v.text(b.city, "city", "La ciudad", { max: 80, optional: true }));
  }
  if (b.description !== undefined) {
    sets.push("description = ?");
    params.push(v.paragraph(b.description, "description", "La descripción", { max: 300, optional: true }));
  }
  if (!sets.length) throw new HttpError(400, "VALIDATION", "No hay nada para actualizar.");

  await query(`UPDATE users SET ${sets.join(", ")}, updated_at = UTC_TIMESTAMP() WHERE id = ?`, [
    ...params,
    req.userId,
  ]);
  res.json({ user: serializeUser(await findUserById(req.userId)) });
});

/* PATCH /api/me/username   { username }  — una vez cada 15 días */
router.patch("/username", async (req, res) => {
  const name = v.username(req.body?.username);
  const current = await findUserById(req.userId);

  if (current.username === name) {
    throw new HttpError(400, "UNCHANGED", "Ese ya es tu nombre de usuario.", { field: "username" });
  }
  if (Number(current.username_retry_sec) > 0) {
    throw cooldownError("username", Number(current.username_retry_sec));
  }

  try {
    // La condición va dentro del UPDATE: aunque lleguen dos pedidos a la vez, solo pasa uno.
    const result = await query(
      `UPDATE users
          SET username = ?, username_changed_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
        WHERE id = ?
          AND username_changed_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${days} DAY)`,
      [name, req.userId]
    );
    if (result.affectedRows === 0) {
      const fresh = await findUserById(req.userId);
      throw cooldownError("username", Number(fresh.username_retry_sec) || 1);
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new HttpError(409, "USERNAME_TAKEN", "Ese nombre de usuario ya está en uso.", {
        field: "username",
      });
    }
    throw err;
  }

  res.json({ user: serializeUser(await findUserById(req.userId)) });
});

/* POST /api/me/avatar   (multipart, campo "avatar") — una vez cada 30 minutos */
router.post("/avatar", avatarUpload, async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "VALIDATION", "Elegí una foto JPG o PNG.", { field: "avatar" });
  }

  const current = await findUserById(req.userId);
  if (Number(current.avatar_retry_sec) > 0) {
    throw cooldownError("avatar", Number(current.avatar_retry_sec));
  }

  const newFile = await saveAvatar(await processAvatar(req.file.buffer));
  let result;
  try {
    result = await query(
      `UPDATE users
          SET avatar_path = ?, avatar_changed_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
        WHERE id = ?
          AND (avatar_changed_at IS NULL
               OR avatar_changed_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${mins} MINUTE))`,
      [newFile, req.userId]
    );
  } catch (err) {
    await removeAvatar(newFile);
    throw err;
  }

  if (result.affectedRows === 0) {
    await removeAvatar(newFile);
    const fresh = await findUserById(req.userId);
    throw cooldownError("avatar", Number(fresh.avatar_retry_sec) || 1);
  }

  await removeAvatar(current.avatar_path); // la foto anterior ya no hace falta
  res.json({ user: serializeUser(await findUserById(req.userId)) });
});

/* POST /api/me/password   { currentPassword, newPassword } */
router.post("/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const next = v.password(newPassword, "newPassword");
  if (typeof currentPassword !== "string" || !currentPassword) {
    throw new HttpError(400, "VALIDATION", "Ingresá tu contraseña actual.", { field: "currentPassword" });
  }

  const [row] = await query("SELECT password_hash FROM users WHERE id = ?", [req.userId]);
  if (!(await bcrypt.compare(currentPassword, row.password_hash))) {
    throw new HttpError(403, "WRONG_PASSWORD", "La contraseña actual no es correcta.", {
      field: "currentPassword",
    });
  }

  const hash = await bcrypt.hash(next, 12);
  // token_version + 1 cierra las demás sesiones abiertas con la clave vieja
  await query(
    "UPDATE users SET password_hash = ?, token_version = token_version + 1, updated_at = UTC_TIMESTAMP() WHERE id = ?",
    [hash, req.userId]
  );
  const fresh = await findUserById(req.userId);
  res.json({ token: signToken(fresh) });
});

/* DELETE /api/me   { password } — borra la cuenta y todo lo asociado */
router.delete("/", async (req, res) => {
  const password = req.body?.password;
  if (typeof password !== "string" || !password) {
    throw new HttpError(400, "VALIDATION", "Ingresá tu contraseña para confirmar.", { field: "password" });
  }
  const [row] = await query("SELECT password_hash, avatar_path FROM users WHERE id = ?", [req.userId]);
  if (!(await bcrypt.compare(password, row.password_hash))) {
    throw new HttpError(403, "WRONG_PASSWORD", "La contraseña no es correcta.", { field: "password" });
  }
  await query("DELETE FROM users WHERE id = ?", [req.userId]);
  await removeAvatar(row.avatar_path);
  res.status(204).end();
});

/* GET /api/me/enrollments — talleres y torneos en los que está anotado */
router.get("/enrollments", async (req, res) => {
  const workshops = await query(
    `SELECT e.workshop_id, w.name, e.comments, e.created_at
       FROM workshop_enrollments e
       JOIN workshops w ON w.id = e.workshop_id
      WHERE e.user_id = ? AND e.status = 'activa'
      ORDER BY e.created_at DESC`,
    [req.userId]
  );
  const tournaments = await query(
    `SELECT r.tournament_id, t.title, t.category, t.dates_label, t.location, t.status AS tournament_status,
            r.team_name, r.members_count, r.created_at
       FROM tournament_registrations r
       JOIN tournaments t ON t.id = r.tournament_id
      WHERE r.user_id = ? AND r.status = 'activa'
      ORDER BY r.created_at DESC`,
    [req.userId]
  );

  res.json({
    workshops: workshops.map((w) => ({
      workshopId: w.workshop_id,
      name: w.name,
      comments: w.comments,
      createdAt: w.created_at,
    })),
    tournaments: tournaments.map((t) => ({
      tournamentId: Number(t.tournament_id),
      title: t.title,
      category: t.category,
      dates: t.dates_label,
      location: t.location,
      tournamentStatus: t.tournament_status,
      teamName: t.team_name,
      membersCount: t.members_count,
      createdAt: t.created_at,
    })),
  });
});

export default router;
