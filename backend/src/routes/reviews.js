import { Router } from "express";
import { query } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/limiters.js";
import { avatarUrlFor } from "../lib/users.js";
import * as v from "../lib/validate.js";

const router = Router();

const author = (row, me) => ({
  username: row.username,
  avatarUrl: avatarUrlFor(row.avatar_path),
  isMe: me !== null && Number(row.user_id) === me,
});

/* GET /api/reviews — las últimas 100 con sus respuestas.
   Públicamente se muestra el nombre de usuario (no el nombre real). */
router.get("/", optionalAuth, async (req, res) => {
  const reviews = await query(
    `SELECT r.id, r.rating, r.body, r.created_at, r.workshop_id, w.name AS workshop_name,
            u.id AS user_id, u.username, u.avatar_path
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN workshops w ON w.id = r.workshop_id
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT 100`
  );

  const repliesByReview = new Map();
  if (reviews.length) {
    const marks = reviews.map(() => "?").join(",");
    const replies = await query(
      `SELECT p.id, p.review_id, p.body, p.created_at, u.id AS user_id, u.username, u.avatar_path
         FROM review_replies p
         JOIN users u ON u.id = p.user_id
        WHERE p.review_id IN (${marks})
        ORDER BY p.created_at ASC, p.id ASC`,
      reviews.map((r) => r.id)
    );
    for (const p of replies) {
      const key = Number(p.review_id);
      if (!repliesByReview.has(key)) repliesByReview.set(key, []);
      repliesByReview.get(key).push({
        id: Number(p.id),
        text: p.body,
        createdAt: p.created_at,
        author: author(p, req.userId),
      });
    }
  }

  res.json({
    reviews: reviews.map((r) => ({
      id: Number(r.id),
      rating: r.rating,
      text: r.body,
      workshopId: r.workshop_id,
      workshopName: r.workshop_name,
      createdAt: r.created_at,
      author: author(r, req.userId),
      replies: repliesByReview.get(Number(r.id)) ?? [],
    })),
  });
});

/* POST /api/reviews   { workshopId, rating, text } */
router.post("/", requireAuth, writeLimiter, async (req, res) => {
  const b = req.body ?? {};
  const rating = v.intInRange(b.rating, "rating", "La puntuación", 1, 5);
  const text = v.paragraph(b.text, "text", "La reseña", { min: 3, max: 1000 });
  if (typeof b.workshopId !== "string") {
    throw new HttpError(400, "VALIDATION", "Elegí un taller.", { field: "workshopId" });
  }
  const [workshop] = await query("SELECT id FROM workshops WHERE id = ? AND active = 1", [b.workshopId]);
  if (!workshop) throw new HttpError(400, "VALIDATION", "Elegí un taller de la lista.", { field: "workshopId" });

  const result = await query(
    `INSERT INTO reviews (user_id, workshop_id, rating, body, created_at)
     VALUES (?, ?, ?, ?, UTC_TIMESTAMP())`,
    [req.userId, workshop.id, rating, text]
  );
  res.status(201).json({ id: Number(result.insertId) });
});

/* POST /api/reviews/:id/replies   { text } */
router.post("/:id/replies", requireAuth, writeLimiter, async (req, res) => {
  const reviewId = v.positiveId(req.params.id, "Reseña");
  const text = v.paragraph(req.body?.text, "text", "La respuesta", { min: 1, max: 600 });

  const [review] = await query("SELECT id FROM reviews WHERE id = ?", [reviewId]);
  if (!review) throw new HttpError(404, "NOT_FOUND", "Reseña no encontrada.");

  const result = await query(
    "INSERT INTO review_replies (review_id, user_id, body, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())",
    [reviewId, req.userId, text]
  );
  res.status(201).json({ id: Number(result.insertId) });
});

/* DELETE /api/reviews/replies/:id — solo el autor */
router.delete("/replies/:id", requireAuth, async (req, res) => {
  const id = v.positiveId(req.params.id, "Respuesta");
  const result = await query("DELETE FROM review_replies WHERE id = ? AND user_id = ?", [id, req.userId]);
  if (result.affectedRows === 0) throw new HttpError(404, "NOT_FOUND", "Respuesta no encontrada.");
  res.status(204).end();
});

/* DELETE /api/reviews/:id — solo el autor */
router.delete("/:id", requireAuth, async (req, res) => {
  const id = v.positiveId(req.params.id, "Reseña");
  const result = await query("DELETE FROM reviews WHERE id = ? AND user_id = ?", [id, req.userId]);
  if (result.affectedRows === 0) throw new HttpError(404, "NOT_FOUND", "Reseña no encontrada.");
  res.status(204).end();
});

export default router;
