/*
  Conexión de la web con el servidor (backend).

  VITE_API_URL = dirección del servidor, SIN "/api" al final.
    - Vacío (lo normal): la web y la API están en el mismo dominio/IP
      (nginx reparte /api hacia el backend). Ej: https://playpoint.ejemplo.com
    - Si la web está en otro sitio: VITE_API_URL=https://api.playpoint.ejemplo.com
  Se define en el archivo ".env.production" antes de hacer "npm run build".
*/
const ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const API = `${ORIGIN}/api`;

/** Convierte "/uploads/avatars/xxx.png" en una dirección completa que el navegador pueda cargar. */
export const assetUrl = (path) => (path ? `${ORIGIN}${path}` : null);

/* ---------- Sesión (token) ---------- */
const TOKEN_KEY = "pp_token";

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const getToken = () =>
  safe(() => sessionStorage.getItem(TOKEN_KEY)) || safe(() => localStorage.getItem(TOKEN_KEY));

/** remember = true -> sigue iniciada al cerrar el navegador. false -> solo mientras dure la pestaña. */
export function setToken(token, remember) {
  clearToken();
  safe(() => (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token));
}

/** Cambia el token (p. ej. tras cambiar la contraseña) conservando dónde estaba guardado. */
export function replaceToken(token) {
  const recordado = Boolean(safe(() => localStorage.getItem(TOKEN_KEY)));
  setToken(token, recordado);
}

export function clearToken() {
  safe(() => sessionStorage.removeItem(TOKEN_KEY));
  safe(() => localStorage.removeItem(TOKEN_KEY));
}

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

/* ---------- Errores ---------- */
export class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = extra.field;
    this.retryAfterSec = extra.retryAfterSec;
  }
}

async function request(method, path, { json, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form; // el navegador arma solo el Content-Type multipart
  }

  let res;
  try {
    res = await fetch(`${API}${path}`, { method, headers, body });
  } catch {
    throw new ApiError(
      0,
      "NETWORK",
      "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo."
    );
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin JSON */
  }

  if (!res.ok) {
    const e = data?.error;
    if (res.status === 401 && token && e?.code === "UNAUTHENTICATED") onUnauthorized?.();
    throw new ApiError(res.status, e?.code ?? "ERROR", e?.message ?? "Ocurrió un error inesperado.", {
      field: e?.field,
      retryAfterSec: e?.retryAfterSec,
    });
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, json) => request("POST", path, { json }),
  patch: (path, json) => request("PATCH", path, { json }),
  del: (path, json) => request("DELETE", path, { json }),
  upload: (path, form, method = "POST") => request(method, path, { form }),
};

/* ---------- Formato de tiempos ("2 días 3 h", "24 min 10 s") ---------- */
export function formatDuration(totalSec) {
  const s = Math.max(0, Math.ceil(totalSec));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d >= 1) return h ? `${d} ${d === 1 ? "día" : "días"} y ${h} h` : `${d} ${d === 1 ? "día" : "días"}`;
  if (h >= 1) return m ? `${h} h ${m} min` : `${h} h`;
  if (m >= 1) return `${m} min ${String(sec).padStart(2, "0")} s`;
  return `${sec} s`;
}

/** "Hace 5 min", "Hace 2 días"... a partir de una fecha ISO. */
export function tiempoRelativo(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "Recién";
  if (min < 60) return `Hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
  return new Date(iso).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" });
}
