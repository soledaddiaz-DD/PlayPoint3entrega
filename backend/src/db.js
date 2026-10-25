import mysql from "mysql2/promise";
import { config } from "./config.js";


export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  charset: "utf8mb4",
  timezone: "Z",
  dateStrings: ["DATE"],
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}


export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn({
      query: async (sql, params = []) => (await conn.execute(sql, params))[0],
    });
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}
