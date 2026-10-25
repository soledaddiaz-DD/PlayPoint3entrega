import { Router } from "express";
import { query, withTransaction } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/limiters.js";
import * as v from "../lib/validate.js";

const router = Router();

const ID = /^[a-z0-9-]{1,30}$/;
const checkId = (id) => {
  if (!ID.test(id)) throw new HttpError(404, "NOT_FOUND", "Taller no encontrado.");
  return id;
};

/* GET /api/workshops — talleres con cupos disponibles */
router.get("/", optionalAuth, async (req, res) => {
  const rows = await query(
    `SELECT w.id, w.name, w.capacity,
            (SELECT COUNT(*) FROM workshop_enrollments e
              WHERE e.workshop_id = w.id AND e.status = 'activa') AS enrolled
       FROM workshops w
      WHERE w.active = 1
      ORDER BY w.name`
  );

  let mine = new Set();
  if (req.userId) {
    const own = await query(
      "SELECT workshop_id FROM workshop_enrollments WHERE user_id = ? AND status = 'activa'",
      [req.userId]
    );
    mine = new Set(own.map((r) => r.workshop_id));
  }

  res.json({
    workshops: rows.map((w) => ({
      id: w.id,
      name: w.name,
      capacity: w.capacity,
      enrolled: Number(w.enrolled),
      available: Math.max(0, w.capacity - Number(w.enrolled)),
      isEnrolled: mine.has(w.id),
    })),
  });
});

/* POST /api/workshops/:id/enroll   { fullName, email, phone, comments? } */
router.post("/:id/enroll", requireAuth, writeLimiter, async (req, res) => {
  const id = checkId(req.params.id);
  const b = req.body ?? {};
  const data = {
    fullName: v.text(b.fullName, "fullName", "El nombre", { min: 2, max: 80 }),
    email: v.email(b.email),
    phone: v.phone(b.phone),
    comments: v.paragraph(b.comments, "comments", "Los comentarios", { max: 500, optional: true }) || null,
  };

  await withTransaction(async (tx) => {
    // Bloqueamos el taller mientras contamos cupos: dos personas no pueden quedarse con el último lugar.
    const [workshop] = await tx.query(
      "SELECT id, capacity, active FROM workshops WHERE id = ? FOR UPDATE",
      [id]
    );
    if (!workshop || !workshop.active) {
      throw new HttpError(404, "NOT_FOUND", "Taller no encontrado.");
    }

    const [existing] = await tx.query(
      "SELECT id, status FROM workshop_enrollments WHERE user_id = ? AND workshop_id = ? FOR UPDATE",
      [req.userId, id]
    );
    if (existing?.status === "activa") {
      throw new HttpError(409, "ALREADY_ENROLLED", "Ya estás inscripto en este taller.");
    }

    const [{ n }] = await tx.query(
      "SELECT COUNT(*) AS n FROM workshop_enrollments WHERE workshop_id = ? AND status = 'activa'",
      [id]
    );
    if (Number(n) >= workshop.capacity) {
      throw new HttpError(409, "FULL", "Este taller ya no tiene cupos disponibles.");
    }

    if (existing) {
      await tx.query(
        `UPDATE workshop_enrollments
            SET full_name = ?, email = ?, phone = ?, comments = ?, status = 'activa',
                created_at = UTC_TIMESTAMP(), cancelled_at = NULL
          WHERE id = ?`,
        [data.fullName, data.email, data.phone, data.comments, existing.id]
      );
    } else {
      await tx.query(
        `INSERT INTO workshop_enrollments
           (user_id, workshop_id, full_name, email, phone, comments, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'activa', UTC_TIMESTAMP())`,
        [req.userId, id, data.fullName, data.email, data.phone, data.comments]
      );
    }
  });

  res.status(201).json({ ok: true });
});

/* DELETE /api/workshops/:id/enroll — cancelar mi inscripción */
router.delete("/:id/enroll", requireAuth, async (req, res) => {
  const id = checkId(req.params.id);
  const result = await query(
    `UPDATE workshop_enrollments
        SET status = 'cancelada', cancelled_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND workshop_id = ? AND status = 'activa'`,
    [req.userId, id]
  );
  if (result.affectedRows === 0) {
    throw new HttpError(404, "NOT_FOUND", "No estás inscripto en este taller.");
  }
  res.status(204).end();
});

export default router;
