import fs from "node:fs/promises";
import { avatarDir, config } from "./config.js";
import { pool, query } from "./db.js";
import { createApp } from "./app.js";

await fs.mkdir(avatarDir, { recursive: true });

try {
  await query("SELECT 1");
  const [{ n }] = await query(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'",
    [config.db.database]
  );
  if (!Number(n)) {
    console.error("\n[db] Conectó a la base, pero faltan las tablas. Ejecutá:  npm run db:init\n");
    process.exit(1);
  }
} catch (err) {
  console.error(`\n[db] No se pudo conectar a la base de datos: ${err.message}`);
  console.error("     Revisá DB_HOST / DB_USER / DB_PASSWORD / DB_NAME en backend/.env\n");
  process.exit(1);
}

const app = createApp();
const server = app.listen(config.port, config.host, () => {
  console.log(`PlayPoint API escuchando en http://${config.host}:${config.port} (${config.env})`);
});

function shutdown(signal) {
  console.log(`\n${signal} recibido: cerrando...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
