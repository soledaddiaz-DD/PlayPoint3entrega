# PlayPoint

Sitio de talleres y torneos deportivos: registro con foto y nombre de usuario, inicio de sesión,
inscripciones a talleres y torneos, comunidad y reseñas — todo guardado en SQL.

* **Frontend:** React 19 + Vite (carpeta raíz, `src/`)
* **Backend:** Node.js 20 + Express 5 + MariaDB/MySQL (`backend/`)

## Publicarlo en tu servidor Rocky Linux

Seguí **[GUIA_DESPLIEGUE_ROCKY.md](GUIA_DESPLIEGUE_ROCKY.md)** (paso a paso, con nginx, systemd, HTTPS y respaldos).

## Probarlo en tu PC

Necesitás Node 20+ y MariaDB/MySQL.

```bash
# 1) Base de datos (una vez): editá la clave en backend/setup-db.sql y ejecutá
sudo mysql < backend/setup-db.sql

# 2) Backend
cd backend
cp .env.example .env        # completá DB_PASSWORD y JWT_SECRET; NODE_ENV=development
npm install
npm run db:init             # crea tablas y datos base
npm run dev                 # API en http://127.0.0.1:3000

# 3) Web (otra terminal, en la raíz del proyecto)
npm install
npm run dev                 # http://localhost:5173  (reenvía /api y /uploads al backend)
```

Tests del backend: ver las instrucciones al inicio de `backend/tests/api.test.js` (usan una base `playpoint_test`).

## Reglas de cuenta

* Nombre de usuario: 3–20 caracteres (letras, números, punto o guion bajo); se puede cambiar **una vez cada 15 días**.
* Foto de perfil JPG/PNG (máx. 2 MB, se achica a 512 px y se limpian los metadatos); se puede cambiar **una vez cada 30 minutos**.
