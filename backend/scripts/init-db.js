
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { backendRoot, config } from "../src/config.js";

const sql = await fs.readFile(path.join(backendRoot, "schema.sql"), "utf8");

let conn;
try {
  conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset: "utf8mb4",
    multipleStatements: true,
  });
  await conn.query(sql);
  const [tables] = await conn.query("SHOW TABLES");
  console.log(`Listo. Tablas en "${config.db.database}": ${tables.length}`);
  for (const row of tables) console.log("  -", Object.values(row)[0]);
} catch (err) {
  console.error(`\nNo se pudo preparar la base: ${err.message}\n`);
  process.exitCode = 1;
} finally {
  await conn?.end();
}
