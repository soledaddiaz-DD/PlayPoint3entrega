-- ============================================================
-- PlayPoint - Paso 1: crear la base de datos y el usuario SQL
-- Se ejecuta UNA vez como administrador del motor (root):
--
--     sudo mysql < setup-db.sql
--
-- ANTES de ejecutarlo, cambiá 'CAMBIAME_CLAVE_LARGA' por una clave
-- real (la misma que vas a poner en DB_PASSWORD dentro de backend/.env).
-- ============================================================

CREATE DATABASE IF NOT EXISTS playpoint
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Usuario que usa SOLO la aplicación, y solo desde el mismo servidor.
CREATE USER IF NOT EXISTS 'playpoint'@'localhost' IDENTIFIED BY 'CAMBIAME_CLAVE_LARGA';

-- Permisos mínimos sobre SU base de datos (nada sobre las demás).
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON playpoint.* TO 'playpoint'@'localhost';

FLUSH PRIVILEGES;
