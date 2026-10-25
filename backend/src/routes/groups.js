import crypto from "node:crypto";
import { Router } from "express";
import { query, withTransaction } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/limiters.js";
import { avatarUrlFor } from "../lib/users.js";
import * as v from "../lib/validate.js";

const router = Router();

export const SPORT_EMOJI = {
  Running: "🏃",
  Fútbol: "⚽",
  Basketball: "🏀",
  Vóley: "🏐",
  Handball: "🤾",
  Tenis: "🎾",
  Entrenamiento: "💪",
  Otro: "🏅",
};

const GROUP_ID = /^[a-z0-9-]{1,40}$/;

/** Arma los grupos con cantidad de miembros, primeros 3 avatares y si yo soy miembro. */
async function loadGroups(userId, onlyId = null) {
  const where = onlyId ? "WHERE g.id = ?" : "";
  const params = onlyId ? [onlyId] : [];

  const groups = await query(
    `SELECT g.id, g.name, g.sport, g.description, g.emoji, g.created_by, g.created_at,
            (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) AS member_count
       FROM community_groups g
       ${where}
      ORDER BY g.created_at DESC, g.name ASC`,
    params
  );
  if (!groups.length) return [];

  const previews = await query(
    `SELECT t.group_id, t.username, t.avatar_path FROM (
        SELECT m.group_id, u.username, u.avatar_path,
               ROW_NUMBER() OVER (PARTITION BY m.group_id ORDER BY m.joined_at, u.id) AS rn
          FROM group_members m
          JOIN users u ON u.id = m.user_id
     ) t WHERE t.rn <= 3`
  );
  const byGroup = new Map();
  for (const p of previews) {
    if (!byGroup.has(p.group_id)) byGroup.set(p.group_id, []);
    byGroup.get(p.group_id).push({ username: p.username, avatarUrl: avatarUrlFor(p.avatar_path) });
  }

  let mine = new Set();
  if (userId) {
    const own = await query("SELECT group_id FROM group_members WHERE user_id = ?", [userId]);
    mine = new Set(own.map((r) => r.group_id));
  }

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    sport: g.sport,
    description: g.description,
    emoji: g.emoji,
    official: g.created_by === null,
    memberCount: Number(g.member_count),
    members: byGroup.get(g.id) ?? [],
    isMember: mine.has(g.id),
  }));
}

/* GET /api/groups */
router.get("/", optionalAuth, async (req, res) => {
  res.json({ groups: await loadGroups(req.userId) });
});

/* GET /api/groups/:id */
router.get("/:id", optionalAuth, async (req, res) => {
  if (!GROUP_ID.test(req.params.id)) throw new HttpError(404, "NOT_FOUND", "Grupo no encontrado.");
  const [group] = await loadGroups(req.userId, req.params.id);
  if (!group) throw new HttpError(404, "NOT_FOUND", "Grupo no encontrado.");
  res.json({ group });
});

/* POST /api/groups   { name, sport, description } — el creador queda como miembro */
router.post("/", requireAuth, writeLimiter, async (req, res) => {
  const b = req.body ?? {};
  const name = v.text(b.name, "name", "El nombre del grupo", { min: 3, max: 80 });
  const description = v.paragraph(b.description, "description", "La descripción", { min: 5, max: 500 });
  if (!Object.hasOwn(SPORT_EMOJI, b.sport)) {
    throw new HttpError(400, "VALIDATION", "Elegí un deporte de la lista.", { field: "sport" });
  }

  const id = `grupo-${crypto.randomBytes(5).toString("hex")}`;
  await withTransaction(async (tx) => {
    await tx.query(
      `INSERT INTO community_groups (id, name, sport, description, emoji, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [id, name, b.sport, description, SPORT_EMOJI[b.sport], req.userId]
    );
    await tx.query(
      "INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, UTC_TIMESTAMP())",
      [id, req.userId]
    );
  });

  const [group] = await loadGroups(req.userId, id);
  res.status(201).json({ group });
});

/* POST /api/groups/:id/join */
router.post("/:id/join", requireAuth, writeLimiter, async (req, res) => {
  const { id } = req.params;
  const [group] = GROUP_ID.test(id) ? await query("SELECT id FROM community_groups WHERE id = ?", [id]) : [];
  if (!group) throw new HttpError(404, "NOT_FOUND", "Grupo no encontrado.");

  await query(
    "INSERT IGNORE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, UTC_TIMESTAMP())",
    [id, req.userId]
  );
  const [full] = await loadGroups(req.userId, id);
  res.json({ group: full });
});

/* DELETE /api/groups/:id/join */
router.delete("/:id/join", requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!GROUP_ID.test(id)) throw new HttpError(404, "NOT_FOUND", "Grupo no encontrado.");
  await query("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [id, req.userId]);
  const [full] = await loadGroups(req.userId, id);
  if (!full) throw new HttpError(404, "NOT_FOUND", "Grupo no encontrado.");
  res.json({ group: full });
});

export default router;
