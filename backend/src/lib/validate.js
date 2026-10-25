import { HttpError } from "../middleware/errors.js";

const bad = (field, message) => new HttpError(400, "VALIDATION", message, { field });

export function text(value, field, label, { min = 1, max, optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return null;
    throw bad(field, `${label} es obligatorio.`);
  }
  if (typeof value !== "string") throw bad(field, `${label} no es válido.`);
  const v = value.trim().replace(/\s+/g, " ");
  if (!v && optional) return null;
  if (v.length < min) throw bad(field, `${label} es muy corto (mínimo ${min} caracteres).`);
  if (v.length > max) throw bad(field, `${label} es muy largo (máximo ${max} caracteres).`);
  return v;
}

export function paragraph(value, field, label, { min = 0, max, optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) return "";
    throw bad(field, `${label} es obligatorio.`);
  }
  if (typeof value !== "string") throw bad(field, `${label} no es válido.`);
  const v = value.replace(/\r\n/g, "\n").trim();
  if (!v && optional) return "";
  if (v.length < Math.max(min, optional ? 0 : 1)) {
    throw bad(field, `${label} es muy corto (mínimo ${min || 1} caracteres).`);
  }
  if (v.length > max) throw bad(field, `${label} es muy largo (máximo ${max} caracteres).`);
  return v;
}

const RESERVED = new Set([
  "admin", "administrador", "administrator", "root", "playpoint", "soporte",
  "support", "moderador", "mod", "staff", "sistema", "system", "null", "undefined",
]);

export function username(value) {
  if (typeof value !== "string") throw bad("username", "Elegí un nombre de usuario.");
  const v = value.trim();
  if (!/^[A-Za-z0-9_.]{3,20}$/.test(v)) {
    throw bad(
      "username",
      "El usuario debe tener entre 3 y 20 caracteres: letras, números, punto o guion bajo."
    );
  }
  if (/^[._]|[._]$/.test(v) || /[._]{2}/.test(v)) {
    throw bad("username", "No puede empezar ni terminar con punto o guion bajo, ni repetirlos.");
  }
  if (RESERVED.has(v.toLowerCase())) {
    throw bad("username", "Ese nombre de usuario no está disponible.");
  }
  return v;
}

export function email(value) {
  if (typeof value !== "string") throw bad("email", "Ingresá tu correo.");
  const v = value.trim().toLowerCase();
  if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    throw bad("email", "Ingresá un correo válido.");
  }
  return v;
}

export function password(value, field = "password") {
  if (typeof value !== "string") throw bad(field, "Ingresá una contraseña.");
  if (value.length < 8) throw bad(field, "La contraseña debe tener al menos 8 caracteres.");
  if (Buffer.byteLength(value, "utf8") > 72) {
    throw bad(field, "La contraseña es demasiado larga (máximo 72 caracteres).");
  }
  return value;
}

export function phone(value) {
  if (typeof value !== "string") throw bad("phone", "Ingresá tu teléfono.");
  const v = value.trim();
  if (!/^[0-9+()\-\s]{6,20}$/.test(v) || (v.match(/\d/g) || []).length < 6) {
    throw bad("phone", "Ingresá un teléfono válido.");
  }
  return v;
}

export function birthDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw bad("birthDate", "Ingresá tu fecha de nacimiento.");
  }
  const d = new Date(`${value}T00:00:00Z`);
  const valid = !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  const now = new Date();
  const oldest = new Date(Date.UTC(now.getUTCFullYear() - 120, 0, 1));
  if (!valid || d > now || d < oldest) {
    throw bad("birthDate", "La fecha de nacimiento no es válida.");
  }
  return value;
}

export const GENDERS = ["femenino", "masculino", "otro", "prefiero-no-decir"];
export function gender(value) {
  if (!GENDERS.includes(value)) throw bad("gender", "Elegí una opción de género.");
  return value;
}

export function intInRange(value, field, label, min, max) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw bad(field, `${label} debe ser un número entre ${min} y ${max}.`);
  }
  return n;
}

export function positiveId(value, label = "Identificador") {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > Number.MAX_SAFE_INTEGER) {
    throw new HttpError(400, "VALIDATION", `${label} no válido.`);
  }
  return n;
}
