import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.resolve(here, "..");

dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });

function fail(msg) {
  console.error(`\n[config] ${msg}\n`);
  process.exit(1);
}

function required(name) {
  const value = process.env[name];
  if (!value) fail(`Falta la variable ${name} en backend/.env (mirá .env.example).`);
  return value;
}

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) {
  fail("JWT_SECRET es muy corta: usá al menos 32 caracteres aleatorios.");
}

const trustProxyRaw = process.env.TRUST_PROXY;
let trustProxy = false;
if (trustProxyRaw) {
  trustProxy = /^\d+$/.test(trustProxyRaw) ? Number(trustProxyRaw) : trustProxyRaw;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  host: process.env.HOST || "127.0.0.1",
  port: Number(process.env.PORT) || 3000,
  trustProxy,

  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || "playpoint",
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
  },

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),

  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(backendRoot, "uploads"),

  limits: {
    usernameCooldownDays: 15,
    avatarCooldownMinutes: 30,
    maxAvatarBytes: 2 * 1024 * 1024,
  },
};

export const avatarDir = path.join(config.uploadDir, "avatars");
