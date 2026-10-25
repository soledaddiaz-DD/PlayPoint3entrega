import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import {
  loginAccountLimiter,
  loginIpLimiter,
  lookupLimiter,
  registerLimiter,
} from "../middleware/limiters.js";
import { avatarUpload, processAvatar, removeAvatar, saveAvatar } from "../lib/images.js";
import { findUserById, logAuthEvent, serializeUser } from "../lib/users.js";
import * as v from "../lib/validate.js";

const router = Router();
const BCRYPT_COST = 12;

let dummyHash;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash("playpoint-dummy", BCRYPT_COST));


router.post("/register", registerLimiter, avatarUpload, async (req, res) => {
  const b = req.body ?? {};

  const data = {
    username: v.username(b.username),
    fullName: v.text(b.fullName, "fullName", "El nombre", { min: 2, max: 80 }),
    email: v.email(b.email),
    password: v.password(b.password),
    birthDate: v.birthDate(b.birthDate),
    gender: v.gender(b.gender),
    phone: v.phone(b.phone),
    description: v.paragraph(b.description, "description", "La descripción", {
      max: 300,
      optional: true,
    }),
  };
  const photo = req.file ? await processAvatar(req.file.buffer) : null; 

  // 2) Avisar de forma clara si ya está en uso
  const taken = await query(
    "SELECT username, email FROM users WHERE username = ? OR email = ? LIMIT 2",
    [data.username, data.email]
  );
  for (const row of taken) {
    if (row.username.toLowerCase() === data.username.toLowerCase()) {
      throw new HttpError(409, "USERNAME_TAKEN", "Ese nombre de usuario ya está en uso.", {
        field: "username",
      });
    }
    if (row.email === data.email) {
      throw new HttpError(409, "EMAIL_TAKEN", "Ya existe una cuenta con ese correo.", {
        field: "email",
      });
    }
  }


  const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);
  const avatarFile = photo ? await saveAvatar(photo) : null;

  let userId;
  try {
    const result = await query(
      `INSERT INTO users
         (username, email, password_hash, full_name, birth_date, gender, phone, description,
          avatar_path, username_changed_at, avatar_changed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(),
               ${avatarFile ? "UTC_TIMESTAMP()" : "NULL"}, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [
        data.username, data.email, passwordHash, data.fullName, data.birthDate,
        data.gender, data.phone, data.description, avatarFile,
      ]
    );
    userId = Number(result.insertId);
  } catch (err) {
    await removeAvatar(avatarFile);
    if (err.code === "ER_DUP_ENTRY") {
      const field = /username/i.test(err.message) ? "username" : "email";
      throw new HttpError(
        409,
        field === "username" ? "USERNAME_TAKEN" : "EMAIL_TAKEN",
        field === "username"
          ? "Ese nombre de usuario ya está en uso."
          : "Ya existe una cuenta con ese correo.",
        { field }
      );
    }
    throw err;
  }

  await logAuthEvent(req, { userId, type: "register", email: data.email });

  const row = await findUserById(userId);
  res.status(201).json({ token: signToken(row), user: serializeUser(row) });
});


router.post("/login", loginIpLimiter, loginAccountLimiter, async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password || password.length > 200) {
    throw new HttpError(400, "VALIDATION", "Ingresá tu correo y tu contraseña.");
  }

  const rows = await query("SELECT id, password_hash FROM users WHERE email = ?", [email]);
  const found = rows[0];
  const hashOk = await bcrypt.compare(password, found?.password_hash ?? (await getDummyHash()));

  if (!found || !hashOk) {
    await logAuthEvent(req, { userId: found ? Number(found.id) : null, type: "login_failed", email });
    throw new HttpError(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos.");
  }

  await logAuthEvent(req, { userId: Number(found.id), type: "login", email });
  const row = await findUserById(found.id);
  res.json({ token: signToken(row), user: serializeUser(row) });
});

router.post("/logout", requireAuth, async (req, res) => {
  await logAuthEvent(req, { userId: req.userId, type: "logout" });
  res.status(204).end();
});


router.get("/username-available", lookupLimiter, async (req, res) => {
  let name;
  try {
    name = v.username(req.query.username);
  } catch (err) {
    if (err instanceof HttpError) return res.json({ available: false, reason: err.message });
    throw err;
  }
  const rows = await query("SELECT id FROM users WHERE username = ?", [name]);
  res.json(
    rows.length
      ? { available: false, reason: "Ese nombre de usuario ya está en uso." }
      : { available: true }
  );
});

export default router;
