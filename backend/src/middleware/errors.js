import multer from "multer";
import { config } from "../config.js";

/** Error "esperado" que se le muestra al usuario con un código HTTP y un mensaje en español. */
export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Ruta no encontrada." } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    if (err.extra.retryAfterSec) res.set("Retry-After", String(err.extra.retryAfterSec));
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, ...err.extra } });
  }

  if (err instanceof multer.MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    const mb = Math.round(config.limits.maxAvatarBytes / 1024 / 1024);
    return res.status(tooBig ? 413 : 400).json({
      error: {
        code: tooBig ? "FILE_TOO_LARGE" : "INVALID_UPLOAD",
        message: tooBig ? `La foto no puede pesar más de ${mb} MB.` : "No se pudo leer el archivo.",
        field: "avatar",
      },
    });
  }

  if (err?.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: { code: "BAD_JSON", message: "El cuerpo de la petición no es válido." } });
  }
  if (err?.type === "entity.too.large") {
    return res
      .status(413)
      .json({ error: { code: "TOO_LARGE", message: "La petición es demasiado grande." } });
  }

  console.error("[error]", req.method, req.originalUrl, err);
  res
    .status(500)
    .json({ error: { code: "INTERNAL", message: "Ocurrió un error en el servidor. Probá de nuevo." } });
}
