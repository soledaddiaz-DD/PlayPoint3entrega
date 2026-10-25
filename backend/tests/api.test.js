
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { avatarDir, config } from "../src/config.js";

if (!config.db.database.endsWith("_test")) {
  console.error(`\nNo se ejecutan las pruebas: DB_NAME="${config.db.database}" no termina en "_test".\n`);
  process.exit(1);
}

const { createApp } = await import("../src/app.js");
const { pool, query } = await import("../src/db.js");
const { setRateLimitEnabled } = await import("../src/middleware/limiters.js");
setRateLimitEnabled(false); 
const { default: sharp } = await import("sharp");
const PNG = await sharp({ create: { width: 40, height: 40, channels: 4, background: "#ff2d60" } }).png().toBuffer();
const JPG = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#4a90d9" } })
  .jpeg()
  .withExif({ IFD0: { Copyright: "dato-privado", Artist: "Maria" } })
  .toBuffer();

let server;
let base;

const api = async (method, url, { token, json, form } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  const res = await fetch(`${base}${url}`, { method, headers, body });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
};

function registerForm(overrides = {}, file) {
  const fields = {
    username: "maria_p",
    fullName: "María Pérez",
    email: "maria@example.com",
    password: "clave-segura-1",
    birthDate: "2000-05-17",
    gender: "femenino",
    phone: "099 123 456",
    description: "Me encanta el vóley",
    ...overrides,
  };
  const form = new FormData();
  for (const [k, val] of Object.entries(fields)) if (val !== undefined) form.append(k, val);
  if (file) form.append("avatar", new Blob([file.buf], { type: file.type }), file.name);
  return form;
}

const register = (overrides, file) =>
  api("POST", "/api/auth/register", { form: registerForm(overrides, file) });

async function cleanDb() {
  await query("DELETE FROM users");
  await query("DELETE FROM login_events");
  await query("DELETE FROM community_groups WHERE created_by IS NULL AND id LIKE 'grupo-%'");
  await query("DELETE FROM community_groups WHERE id LIKE 'grupo-%'");
  await query("UPDATE workshops SET capacity = 18 WHERE id = 'futbol'");
}

before(async () => {
  await cleanDb();
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await cleanDb();
  await new Promise((r) => server.close(r));
  await pool.end();
});

describe("registro", () => {
  test("rechaza datos inválidos con mensajes claros", async () => {
    let r = await register({ username: "a!" });
    assert.equal(r.status, 400);
    assert.equal(r.data.error.field, "username");

    r = await register({ username: "admin" });
    assert.equal(r.status, 400);

    r = await register({ password: "corta" });
    assert.equal(r.data.error.field, "password");

    r = await register({ email: "no-es-un-correo" });
    assert.equal(r.data.error.field, "email");

    r = await register({ birthDate: "2999-01-01" });
    assert.equal(r.data.error.field, "birthDate");

    r = await register({ gender: "x" });
    assert.equal(r.data.error.field, "gender");

    r = await register({ description: "x".repeat(301) });
    assert.equal(r.data.error.field, "description");
  });

  test("rechaza archivos que no son JPG/PNG aunque digan serlo", async () => {
    let r = await register({}, { buf: Buffer.from("<svg onload=alert(1)>"), type: "image/png", name: "a.png" });
    assert.equal(r.status, 400);
    assert.equal(r.data.error.code, "INVALID_IMAGE");

    r = await register({}, { buf: PNG, type: "image/gif", name: "a.gif" });
    assert.equal(r.status, 400);

    r = await register({}, { buf: Buffer.alloc(2 * 1024 * 1024 + 10, 1), type: "image/png", name: "big.png" });
    assert.equal(r.status, 413);
    assert.equal(r.data.error.code, "FILE_TOO_LARGE");

    const [{ n }] = await query("SELECT COUNT(*) AS n FROM users");
    assert.equal(Number(n), 0, "no debe crearse ningún usuario");
  });

  test("la foto se achica a 512 px y se le borran los metadatos (GPS, autor, etc.)", async () => {
    const r = await register(
      { username: "foto_grande", email: "grande@example.com" },
      { buf: JPG, type: "image/jpeg", name: "celu.jpg" }
    );
    assert.equal(r.status, 201);
    assert.match(r.data.user.avatarUrl, /\.jpg$/);
    const file = await fs.readFile(path.join(avatarDir, r.data.user.avatarUrl.split("/").pop()));
    const meta = await sharp(file).metadata();
    assert.equal(meta.format, "jpeg");
    assert.equal(Math.max(meta.width, meta.height), 512);
    assert.equal(meta.exif, undefined, "sin EXIF");
    assert.equal(file.includes(Buffer.from("dato-privado")), false);
    await query("DELETE FROM users WHERE username = 'foto_grande'");
  });

  test("un archivo con firma de PNG pero contenido falso se rechaza", async () => {
    const fake = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("<script>alert(1)</script>")]);
    const r = await register({ username: "falsa", email: "falsa@example.com" }, { buf: fake, type: "image/png", name: "a.png" });
    assert.equal(r.status, 400);
    assert.equal(r.data.error.code, "INVALID_IMAGE");
  });

  test("crea la cuenta con foto, la guarda en el servidor y no expone la clave", async () => {
    const r = await register({}, { buf: PNG, type: "image/png", name: "yo.png" });
    assert.equal(r.status, 201);
    assert.ok(r.data.token);
    assert.equal(r.data.user.username, "maria_p");
    assert.equal(r.data.user.description, "Me encanta el vóley");
    assert.match(r.data.user.avatarUrl, /^\/uploads\/avatars\/[0-9a-f-]{36}\.png$/);
    assert.equal(JSON.stringify(r.data).includes("password"), false);

    const [row] = await query("SELECT password_hash FROM users WHERE username = 'maria_p'");
    assert.match(row.password_hash, /^\$2[aby]\$12\$/, "bcrypt costo 12");

    const img = await fetch(`${base}${r.data.user.avatarUrl}`);
    assert.equal(img.status, 200);
    assert.equal(img.headers.get("content-type"), "image/png");
    const served = await sharp(Buffer.from(await img.arrayBuffer())).metadata();
    assert.equal(served.format, "png");
    assert.equal(served.width, 40, "las fotos chicas no se agrandan");

    const events = await query("SELECT event_type FROM login_events WHERE email = 'maria@example.com'");
    assert.deepEqual(events.map((e) => e.event_type), ["register"]);
  });

  test("usuario y correo repetidos dan 409 (sin distinguir mayúsculas)", async () => {
    let r = await register({ username: "MARIA_P", email: "otra@example.com" });
    assert.equal(r.status, 409);
    assert.equal(r.data.error.field, "username");

    r = await register({ username: "otra_persona", email: "MARIA@example.com" });
    assert.equal(r.status, 409);
    assert.equal(r.data.error.field, "email");
  });

  test("disponibilidad de usuario", async () => {
    let r = await api("GET", "/api/auth/username-available?username=maria_p");
    assert.equal(r.data.available, false);
    r = await api("GET", "/api/auth/username-available?username=libre_123");
    assert.equal(r.data.available, true);
    r = await api("GET", "/api/auth/username-available?username=a");
    assert.equal(r.data.available, false);
  });
});

describe("login", () => {
  test("entra con las credenciales correctas y deja registro", async () => {
    const r = await api("POST", "/api/auth/login", {
      json: { email: " Maria@Example.com ", password: "clave-segura-1" },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.username, "maria_p");

    const me = await api("GET", "/api/me", { token: r.data.token });
    assert.equal(me.status, 200);
    assert.equal(me.data.user.email, "maria@example.com");
  });

  test("clave mala y correo inexistente dan el mismo error y quedan registrados", async () => {
    const bad = await api("POST", "/api/auth/login", {
      json: { email: "maria@example.com", password: "incorrecta" },
    });
    const ghost = await api("POST", "/api/auth/login", {
      json: { email: "nadie@example.com", password: "incorrecta" },
    });
    assert.equal(bad.status, 401);
    assert.equal(ghost.status, 401);
    assert.deepEqual(bad.data, ghost.data);

    const fails = await query("SELECT user_id FROM login_events WHERE event_type = 'login_failed' ORDER BY id");
    assert.equal(fails.length, 2);
    assert.ok(fails[0].user_id !== null);
    assert.equal(fails[1].user_id, null);
  });

  test("sin token o con token falso no se entra", async () => {
    assert.equal((await api("GET", "/api/me")).status, 401);
    assert.equal((await api("GET", "/api/me", { token: "falso.falso.falso" })).status, 401);
  });
});

describe("configuración: usuario cada 15 días, foto cada 30 minutos", () => {
  let token;
  before(async () => {
    const r = await api("POST", "/api/auth/login", {
      json: { email: "maria@example.com", password: "clave-segura-1" },
    });
    token = r.data.token;
  });

  test("al registrarse, /me informa cuánto falta", async () => {
    const { data } = await api("GET", "/api/me", { token });
    const l = data.user.limits;
    assert.equal(l.usernameCooldownDays, 15);
    assert.equal(l.avatarCooldownMinutes, 30);
    assert.ok(l.usernameRetryAfterSec > 14 * 86400 && l.usernameRetryAfterSec <= 15 * 86400);
    assert.ok(l.avatarRetryAfterSec > 29 * 60 && l.avatarRetryAfterSec <= 30 * 60);
  });

  test("no deja cambiar el usuario antes de 15 días", async () => {
    const r = await api("PATCH", "/api/me/username", { token, json: { username: "maria_nueva" } });
    assert.equal(r.status, 429);
    assert.equal(r.data.error.code, "COOLDOWN");
    assert.ok(r.data.error.retryAfterSec > 14 * 86400);
    assert.ok(Number(r.headers.get("retry-after")) > 14 * 86400);
  });

  test("deja cambiarlo pasados 15 días, y vuelve a bloquear", async () => {
    await query("UPDATE users SET username_changed_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 14 DAY) WHERE username = 'maria_p'");
    let r = await api("PATCH", "/api/me/username", { token, json: { username: "maria_nueva" } });
    assert.equal(r.status, 429, "a los 14 días todavía no");

    await query("UPDATE users SET username_changed_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 DAY) WHERE username = 'maria_p'");
    r = await api("PATCH", "/api/me/username", { token, json: { username: "maria_nueva" } });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.username, "maria_nueva");
    assert.ok(r.data.user.limits.usernameRetryAfterSec > 14 * 86400);

    r = await api("PATCH", "/api/me/username", { token, json: { username: "maria_otra" } });
    assert.equal(r.status, 429);
  });

  test("no deja tomar un usuario ajeno (aunque cambien mayúsculas)", async () => {
    await register({ username: "juan_g", email: "juan@example.com" });
    await query("UPDATE users SET username_changed_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 20 DAY) WHERE username = 'maria_nueva'");
    const r = await api("PATCH", "/api/me/username", { token, json: { username: "JUAN_G" } });
    assert.equal(r.status, 409);
    assert.equal(r.data.error.code, "USERNAME_TAKEN");
  });

  test("foto: bloquea antes de 30 min y deja después, borrando la anterior", async () => {
    const png = { buf: PNG, type: "image/png", name: "a.png" };
    const jpg = { buf: JPG, type: "image/jpeg", name: "b.jpg" };
    const upload = (f) => {
      const form = new FormData();
      form.append("avatar", new Blob([f.buf], { type: f.type }), f.name);
      return api("POST", "/api/me/avatar", { token, form });
    };

    let r = await upload(jpg);
    assert.equal(r.status, 429, "se registró con foto hace segundos");
    assert.equal(r.data.error.code, "COOLDOWN");

    const [before] = await query("SELECT avatar_path FROM users WHERE username = 'maria_nueva'");
    await query("UPDATE users SET avatar_changed_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 29 MINUTE) WHERE username = 'maria_nueva'");
    assert.equal((await upload(jpg)).status, 429, "a los 29 min todavía no");

    await query("UPDATE users SET avatar_changed_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 31 MINUTE) WHERE username = 'maria_nueva'");
    r = await upload(jpg);
    assert.equal(r.status, 200);
    assert.match(r.data.user.avatarUrl, /\.jpg$/);
    assert.ok(r.data.user.limits.avatarRetryAfterSec > 29 * 60);

    await assert.rejects(fs.access(path.join(avatarDir, before.avatar_path)), "la foto vieja se borra del disco");
    assert.equal((await upload(png)).status, 429);
  });

  test("quien no tiene foto puede subir la primera enseguida; archivo falso no", async () => {
    const reg = await register({ username: "sin_foto", email: "sinfoto@example.com" });
    const t = reg.data.token;
    assert.equal(reg.data.user.avatarUrl, null);
    assert.equal(reg.data.user.limits.avatarRetryAfterSec, 0);

    const fake = new FormData();
    fake.append("avatar", new Blob([Buffer.from("MZ not an image")], { type: "image/png" }), "x.png");
    let r = await api("POST", "/api/me/avatar", { token: t, form: fake });
    assert.equal(r.status, 400);

    const ok = new FormData();
    ok.append("avatar", new Blob([PNG], { type: "image/png" }), "x.png");
    r = await api("POST", "/api/me/avatar", { token: t, form: ok });
    assert.equal(r.status, 200);
    assert.ok(r.data.user.avatarUrl);
  });

  test("editar datos del perfil", async () => {
    const r = await api("PATCH", "/api/me", {
      token,
      json: { fullName: "María P. Gómez", city: "Montevideo", description: "Nueva descripción" },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.city, "Montevideo");
    assert.equal(r.data.user.fullName, "María P. Gómez");
  });
});

describe("talleres (deportes)", () => {
  let a, b;
  before(async () => {
    a = (await api("POST", "/api/auth/login", { json: { email: "maria@example.com", password: "clave-segura-1" } })).data.token;
    b = (await api("POST", "/api/auth/login", { json: { email: "juan@example.com", password: "clave-segura-1" } })).data.token;
  });
  const body = { fullName: "María", email: "maria@example.com", phone: "099 123 456", comments: "hola" };

  test("se inscribe, no se repite, y aparece en sus inscripciones", async () => {
    let r = await api("POST", "/api/workshops/futbol/enroll", { token: a, json: body });
    assert.equal(r.status, 201);
    r = await api("POST", "/api/workshops/futbol/enroll", { token: a, json: body });
    assert.equal(r.status, 409);
    assert.equal(r.data.error.code, "ALREADY_ENROLLED");

    r = await api("GET", "/api/me/enrollments", { token: a });
    assert.equal(r.data.workshops.length, 1);
    assert.equal(r.data.workshops[0].workshopId, "futbol");

    r = await api("GET", "/api/workshops", { token: a });
    const futbol = r.data.workshops.find((w) => w.id === "futbol");
    assert.equal(futbol.enrolled, 1);
    assert.equal(futbol.available, 17);
    assert.equal(futbol.isEnrolled, true);
  });

  test("respeta los cupos, aun con pedidos simultáneos", async () => {
    await query("UPDATE workshops SET capacity = 2 WHERE id = 'futbol'");
    const users = [];
    for (let i = 0; i < 4; i++) {
      const r = await register({ username: `jugador${i}`, email: `j${i}@example.com` });
      users.push(r.data.token);
    }
    const results = await Promise.all(
      users.map((t) => api("POST", "/api/workshops/futbol/enroll", { token: t, json: body }))
    );
    const ok = results.filter((r) => r.status === 201).length;
    const full = results.filter((r) => r.data?.error?.code === "FULL").length;
    assert.equal(ok, 1, "María ya ocupaba 1 de los 2 lugares");
    assert.equal(full, 3);
    const [{ n }] = await query("SELECT COUNT(*) AS n FROM workshop_enrollments WHERE workshop_id='futbol' AND status='activa'");
    assert.equal(Number(n), 2);
  });

  test("cancelar libera el cupo y permite volver a anotarse", async () => {
    let r = await api("DELETE", "/api/workshops/futbol/enroll", { token: a });
    assert.equal(r.status, 204);
    r = await api("DELETE", "/api/workshops/futbol/enroll", { token: a });
    assert.equal(r.status, 404);
    r = await api("POST", "/api/workshops/futbol/enroll", { token: b, json: body });
    assert.ok([201, 409].includes(r.status));
    r = await api("POST", "/api/workshops/inexistente/enroll", { token: a, json: body });
    assert.equal(r.status, 404);
  });

  test("exige sesión", async () => {
    const r = await api("POST", "/api/workshops/futbol/enroll", { json: body });
    assert.equal(r.status, 401);
  });
});

describe("torneos", () => {
  let a;
  before(async () => {
    a = (await api("POST", "/api/auth/login", { json: { email: "maria@example.com", password: "clave-segura-1" } })).data.token;
  });
  const body = { fullName: "María", email: "maria@example.com", phone: "099 123 456", teamName: "Las Cracks", membersCount: 6 };

  test("se inscribe y queda guardado", async () => {
    let r = await api("POST", "/api/tournaments/1/register", { token: a, json: body });
    assert.equal(r.status, 201);
    r = await api("POST", "/api/tournaments/1/register", { token: a, json: body });
    assert.equal(r.status, 409);

    const rows = await query("SELECT team_name, members_count, status FROM tournament_registrations");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].team_name, "Las Cracks");

    r = await api("GET", "/api/tournaments", { token: a });
    assert.equal(r.data.tournaments.find((t) => t.id === 1).isRegistered, true);
  });

  test("torneo finalizado, inexistente o con datos raros", async () => {
    let r = await api("POST", "/api/tournaments/4/register", { token: a, json: body });
    assert.equal(r.status, 409);
    assert.equal(r.data.error.code, "CLOSED");
    r = await api("POST", "/api/tournaments/999/register", { token: a, json: body });
    assert.equal(r.status, 404);
    r = await api("POST", "/api/tournaments/2/register", { token: a, json: { ...body, membersCount: 500 } });
    assert.equal(r.status, 400);
  });

  test("cancelar y volver a inscribirse", async () => {
    assert.equal((await api("DELETE", "/api/tournaments/1/register", { token: a })).status, 204);
    assert.equal((await api("POST", "/api/tournaments/1/register", { token: a, json: body })).status, 201);
  });
});

describe("comunidad (grupos)", () => {
  let a, b;
  before(async () => {
    a = (await api("POST", "/api/auth/login", { json: { email: "maria@example.com", password: "clave-segura-1" } })).data.token;
    b = (await api("POST", "/api/auth/login", { json: { email: "juan@example.com", password: "clave-segura-1" } })).data.token;
  });

  test("lista los grupos oficiales y permite crear, unirse y salir", async () => {
    let r = await api("GET", "/api/groups");
    assert.ok(r.data.groups.length >= 4);
    assert.equal(r.data.groups.find((g) => g.id === "voley").official, true);

    r = await api("POST", "/api/groups", {
      token: a,
      json: { name: "Tenis del Parque", sport: "Tenis", description: "Jugamos los sábados" },
    });
    assert.equal(r.status, 201);
    const id = r.data.group.id;
    assert.equal(r.data.group.memberCount, 1);
    assert.equal(r.data.group.isMember, true);
    assert.equal(r.data.group.emoji, "🎾");

    r = await api("POST", `/api/groups/${id}/join`, { token: b });
    assert.equal(r.data.group.memberCount, 2);
    r = await api("POST", `/api/groups/${id}/join`, { token: b });
    assert.equal(r.data.group.memberCount, 2, "unirse dos veces no duplica");
    assert.deepEqual(r.data.group.members.map((m) => m.username).sort(), ["juan_g", "maria_nueva"]);

    r = await api("DELETE", `/api/groups/${id}/join`, { token: b });
    assert.equal(r.data.group.memberCount, 1);
    assert.equal(r.data.group.isMember, false);

    r = await api("GET", `/api/groups/${id}`);
    assert.equal(r.status, 200);
    assert.equal((await api("GET", "/api/groups/no-existe")).status, 404);
  });

  test("valida el deporte", async () => {
    const r = await api("POST", "/api/groups", {
      token: a,
      json: { name: "Grupo X", sport: "Ajedrez", description: "lorem ipsum" },
    });
    assert.equal(r.status, 400);
  });
});

describe("reseñas", () => {
  let a, b;
  before(async () => {
    a = (await api("POST", "/api/auth/login", { json: { email: "maria@example.com", password: "clave-segura-1" } })).data.token;
    b = (await api("POST", "/api/auth/login", { json: { email: "juan@example.com", password: "clave-segura-1" } })).data.token;
  });

  test("publicar, responder y mostrar solo el nombre de usuario", async () => {
    let r = await api("POST", "/api/reviews", { token: a, json: { workshopId: "voley", rating: 5, text: "Excelente taller" } });
    assert.equal(r.status, 201);
    const id = r.data.id;

    r = await api("POST", `/api/reviews/${id}/replies`, { token: b, json: { text: "Coincido" } });
    assert.equal(r.status, 201);

    r = await api("GET", "/api/reviews");
    assert.equal(r.status, 200);
    const review = r.data.reviews.find((x) => x.id === id);
    assert.equal(review.author.username, "maria_nueva");
    assert.equal(review.workshopName, "Vóley");
    assert.equal(review.replies[0].author.username, "juan_g");
    const raw = JSON.stringify(r.data);
    assert.equal(raw.includes("@example.com"), false, "no se filtran correos");
    assert.equal(raw.includes("María P. Gómez"), false, "no se filtra el nombre real");

    r = await api("DELETE", `/api/reviews/${id}`, { token: b });
    assert.equal(r.status, 404, "solo el autor puede borrar");
    r = await api("DELETE", `/api/reviews/${id}`, { token: a });
    assert.equal(r.status, 204);
  });

  test("valida puntaje, taller y texto", async () => {
    const send = (json) => api("POST", "/api/reviews", { token: a, json });
    assert.equal((await send({ workshopId: "voley", rating: 6, text: "bien" })).status, 400);
    assert.equal((await send({ workshopId: "voley", rating: 0, text: "bien" })).status, 400);
    assert.equal((await send({ workshopId: "nada", rating: 3, text: "bien" })).status, 400);
    assert.equal((await send({ workshopId: "voley", rating: 3, text: "" })).status, 400);
    assert.equal((await api("POST", "/api/reviews", { json: { workshopId: "voley", rating: 3, text: "bien" } })).status, 401);
  });
});

describe("contraseña y cierre de cuenta", () => {
  test("cambiar la clave cierra las otras sesiones", async () => {
    const login = () => api("POST", "/api/auth/login", { json: { email: "j0@example.com", password: "clave-segura-1" } });
    const s1 = (await login()).data.token;
    const s2 = (await login()).data.token;

    let r = await api("POST", "/api/me/password", { token: s1, json: { currentPassword: "mal", newPassword: "otra-clave-123" } });
    assert.equal(r.status, 403);

    r = await api("POST", "/api/me/password", { token: s1, json: { currentPassword: "clave-segura-1", newPassword: "otra-clave-123" } });
    assert.equal(r.status, 200);
    assert.equal((await api("GET", "/api/me", { token: s2 })).status, 401, "la otra sesión murió");
    assert.equal((await api("GET", "/api/me", { token: r.data.token })).status, 200, "la nueva sirve");

    const again = await api("POST", "/api/auth/login", { json: { email: "j0@example.com", password: "otra-clave-123" } });
    assert.equal(again.status, 200);
  });

  test("eliminar cuenta borra usuario, datos y foto", async () => {
    const reg = await register({ username: "borrame", email: "borrame@example.com" }, { buf: PNG, type: "image/png", name: "p.png" });
    const t = reg.data.token;
    const file = reg.data.user.avatarUrl.split("/").pop();
    await api("POST", "/api/workshops/atletismo/enroll", {
      token: t, json: { fullName: "B", email: "borrame@example.com", phone: "099 123 456" },
    });

    let r = await api("DELETE", "/api/me", { token: t, json: { password: "mal" } });
    assert.equal(r.status, 403);

    r = await api("DELETE", "/api/me", { token: t, json: { password: "clave-segura-1" } });
    assert.equal(r.status, 204);

    const [{ n }] = await query("SELECT COUNT(*) AS n FROM users WHERE username='borrame'");
    assert.equal(Number(n), 0);
    const [{ e }] = await query("SELECT COUNT(*) AS e FROM workshop_enrollments WHERE email='borrame@example.com'");
    assert.equal(Number(e), 0);
    await assert.rejects(fs.access(path.join(avatarDir, file)));
    assert.equal((await api("GET", "/api/me", { token: t })).status, 401);
  });
});

describe("límite de intentos", () => {
  test("frena el adivinar contraseñas pero no al que entra bien", async () => {
    setRateLimitEnabled(true);
    try {
      const wrong = () =>
        api("POST", "/api/auth/login", { json: { email: "maria@example.com", password: "equivocada" } });
      const codes = [];
      for (let i = 0; i < 9; i++) codes.push((await wrong()).status);
      assert.deepEqual(codes, [401, 401, 401, 401, 401, 401, 401, 401, 429]);

      // otro correo desde la misma IP sigue pudiendo entrar
      const other = await api("POST", "/api/auth/login", {
        json: { email: "juan@example.com", password: "clave-segura-1" },
      });
      assert.equal(other.status, 200);
    } finally {
      setRateLimitEnabled(false);
    }
  });
});

describe("seguridad básica", () => {
  test("cabeceras y rutas", async () => {
    const r = await fetch(`${base}/api/health`);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("x-powered-by"), null);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal((await api("GET", "/api/no-existe")).status, 404);
  });

  test("las inyecciones SQL en el login no funcionan", async () => {
    const r = await api("POST", "/api/auth/login", { json: { email: "' OR '1'='1", password: "' OR '1'='1" } });
    assert.equal(r.status, 401);
  });

  test("JSON roto responde 400, no 500", async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{malo",
    });
    assert.equal(res.status, 400);
  });

  test("CORS: solo responde a los orígenes permitidos", async () => {
    const ok = await fetch(`${base}/api/health`, { headers: { Origin: config.corsOrigins[0] ?? "http://x" } });
    const bad = await fetch(`${base}/api/health`, { headers: { Origin: "https://sitio-malo.example" } });
    if (config.corsOrigins.length) {
      assert.equal(ok.headers.get("access-control-allow-origin"), config.corsOrigins[0]);
      assert.equal(bad.headers.get("access-control-allow-origin"), null);
    }
  });
});
