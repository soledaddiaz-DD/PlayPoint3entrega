import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { avatarDir, config } from "../config.js";
import { HttpError } from "../middleware/errors.js";

const MAX_SIDE = 512; // las fotos de perfil se achican a 512 px como máximo
const MAX_PIXELS = 25_000_000; // corta imágenes "bomba" (miles de píxeles que consumen memoria)

const invalid = () =>
  new HttpError(400, "INVALID_IMAGE", "La foto debe ser un JPG o PNG válido.", { field: "avatar" });

/** Middleware que lee UN archivo del campo "avatar" (en memoria, máximo 2 MB). */
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.limits.maxAvatarBytes,
    files: 1,
    fields: 20,
    fieldSize: 4 * 1024,
  },
  fileFilter(req, file, cb) {
    if (file.fieldname !== "avatar") {
      return cb(new HttpError(400, "INVALID_UPLOAD", "Archivo inesperado."));
    }
    // Primer filtro rápido con lo que declara el navegador; la verificación real es abajo.
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      return cb(invalid());
    }
    cb(null, true);
  },
}).single("avatar");

/**
 * Verifica que el archivo sea realmente un JPG o PNG (decodificándolo, no mirando la
 * extensión), lo achica y lo vuelve a codificar. Al re-codificar se borran los metadatos
 * (ubicación GPS, modelo del celular, etc.) y se descarta cualquier contenido escondido.
 */
export async function processAvatar(buffer) {
  let format;
  try {
    ({ format } = await sharp(buffer, { limitInputPixels: MAX_PIXELS }).metadata());
  } catch {
    throw invalid();
  }
  if (format !== "jpeg" && format !== "png") throw invalid();

  try {
    const pipeline = sharp(buffer, { limitInputPixels: MAX_PIXELS })
      .rotate() // respeta la orientación de la cámara antes de borrar los metadatos
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true });

    return format === "png"
      ? { buffer: await pipeline.png({ compressionLevel: 9 }).toBuffer(), ext: "png" }
      : { buffer: await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer(), ext: "jpg" };
  } catch {
    throw invalid();
  }
}

/** Guarda una foto ya procesada con un nombre aleatorio. Devuelve el nombre del archivo. */
export async function saveAvatar({ buffer, ext }) {
  const filename = `${crypto.randomUUID()}.${ext}`;
  await fs.mkdir(avatarDir, { recursive: true });
  await fs.writeFile(path.join(avatarDir, filename), buffer, { flag: "wx", mode: 0o644 });
  return filename;
}

/** Borra una foto guardada. Ignora nombres raros para que nunca se pueda salir de la carpeta. */
export async function removeAvatar(filename) {
  if (!filename || !/^[0-9a-f-]{36}\.(jpg|png)$/.test(filename)) return;
  await fs.unlink(path.join(avatarDir, filename)).catch(() => {});
}
