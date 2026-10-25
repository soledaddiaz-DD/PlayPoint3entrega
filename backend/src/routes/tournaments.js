import { Router } from "express";
import { query, withTransaction } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/limiters.js";
import * as v from "../lib/validate.js";

const router = Router();

/* GET /api/tournaments */
router.get("/", optionalAuth, async (req, res) => {
  const rows = await query(
    `SELECT t.id, t.title, t.category, t.dates_label, t.location, t.status,
            (SELECT COUNT(*) FROM tournament_registrations r
              WHERE r.tournament_id = t.id AND r.status = 'activa') AS registered
       FROM tournaments t
      ORDER BY t.id`
  );

  let mine = new Set();
  if (req.userId) {
    const own = await query(
      "SELECT tournament_id FROM tournament_registrations WHERE user_id = ? AND status = 'activa'",
      [req.userId]
    );
    mine = new Set(own.map((r) => Number(r.tournament_id)));
  }

  res.json({
    tournaments: rows.map((t) => ({
      id: Number(t.id),
      title: t.title,
      category: t.category,
      dates: t.dates_label,
      location: t.location,
      status: t.status,
      registered: Number(t.registered),
      isRegistered: mine.has(Number(t.id)),
    })),
  });
});

/* POST /api/tournaments/:id/register   { fullName, email, phone, teamName?, membersCount } */
router.post("/:id/register", requireAuth, writeLimiter, async (req, res) => {
  const id = v.positiveId(req.params.id, "Torneo");
  const b = req.body ?? {};
  const data = {
    fullName: v.text(b.fullName, "fullName", "El nombre", { min: 2, max: 80 }),
    email: v.email(b.email),
    phone: v.phone(b.phone),
    teamName: v.text(b.teamName, "teamName", "El nombre del equipo", { max: 60, optional: true }),
    membersCount: v.intInRange(b.membersCount ?? 1, "membersCount", "Los integrantes", 1, 30),
  };

  await withTransaction(async (tx) => {
    const [tournament] = await tx.query("SELECT id, status FROM tournaments WHERE id = ? FOR UPDATE", [id]);
    if (!tournament) throw new HttpError(404, "NOT_FOUND", "Torneo no encontrado.");
    if (tournament.status === "finalizado") {
      throw new HttpError(409, "CLOSED", "Este torneo ya finalizó. Las inscripciones están cerradas.");
    }

    const [existing] = await tx.query(
      "SELECT id, status FROM tournament_registrations WHERE user_id = ? AND tournament_id = ? FOR UPDATE",
      [req.userId, id]
    );
    if (existing?.status === "activa") {
      throw new HttpError(409, "ALREADY_REGISTERED", "Ya estás inscripto en este torneo.");
    }

    if (existing) {
      await tx.query(
        `UPDATE tournament_registrations
            SET full_name = ?, email = ?, phone = ?, team_name = ?, members_count = ?,
                status = 'activa', created_at = UTC_TIMESTAMP(), cancelled_at = NULL
          WHERE id = ?`,
        [data.fullName, data.email, data.phone, data.teamName, data.membersCount, existing.id]
      );
    } else {
      await tx.query(
        `INSERT INTO tournament_registrations
           (user_id, tournament_id, full_name, email, phone, team_name, members_count, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'activa', UTC_TIMESTAMP())`,
        [req.userId, id, data.fullName, data.email, data.phone, data.teamName, data.membersCount]
      );
    }
  });

  res.status(201).json({ ok: true });
});

/* DELETE /api/tournaments/:id/register — cancelar mi inscripción */
router.delete("/:id/register", requireAuth, async (req, res) => {
  const id = v.positiveId(req.params.id, "Torneo");
  const [tournament] = await query("SELECT status FROM tournaments WHERE id = ?", [id]);
  if (!tournament) throw new HttpError(404, "NOT_FOUND", "Torneo no encontrado.");
  if (tournament.status === "finalizado") {
    throw new HttpError(409, "CLOSED", "Este torneo ya finalizó.");
  }

  const result = await query(
    `UPDATE tournament_registrations
        SET status = 'cancelada', cancelled_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND tournament_id = ? AND status = 'activa'`,
    [req.userId, id]
  );
  if (result.affectedRows === 0) {
    throw new HttpError(404, "NOT_FOUND", "No estás inscripto en este torneo.");
  }
  res.status(204).end();
});

export default router;
