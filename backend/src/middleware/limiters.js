import { rateLimit, ipKeyGenerator } from "express-rate-limit";

let enabled = true;

export function setRateLimitEnabled(value) {
  enabled = Boolean(value);
}

function limiter({ windowMs, limit, message, keyGenerator, ...rest }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => !enabled,
    keyGenerator,
    handler(req, res) {
      res.status(429).json({ error: { code: "RATE_LIMITED", message } });
    },
    ...rest,
  });
}

const MIN = 60 * 1000;


export const apiLimiter = limiter({
  windowMs: 15 * MIN,
  limit: 600,
  message: "Demasiadas peticiones. Esperá unos minutos e intentá de nuevo.",
});

const loginMessage = "Demasiados intentos fallidos. Esperá 15 minutos antes de volver a probar.";
export const loginAccountLimiter = limiter({
  windowMs: 15 * MIN,
  limit: 8,
  skipSuccessfulRequests: true,
  message: loginMessage,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return `${ipKeyGenerator(req.ip ?? "")}|${email.slice(0, 254)}`;
  },
});
export const loginIpLimiter = limiter({
  windowMs: 15 * MIN,
  limit: 60,
  skipSuccessfulRequests: true,
  message: loginMessage,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
});


export const registerLimiter = limiter({
  windowMs: 60 * MIN,
  limit: 20,
  skipFailedRequests: true,
  message: "Se crearon muchas cuentas desde tu red. Probá de nuevo en un rato.",
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
});

export const lookupLimiter = limiter({
  windowMs: 1 * MIN,
  limit: 30,
  message: "Demasiadas consultas seguidas. Esperá un momento.",
});

/** Para publicar reseñas, respuestas, grupos, inscripciones, todo :))) */
export const writeLimiter = limiter({
  windowMs: 15 * MIN,
  limit: 60,
  message: "Estás publicando muy rápido. Esperá unos minutos.",
});
