// Nicole Olavarría — CRM Worker
// Cloudflare Worker + D1. Igual lógica que MVT worker-index-v2.js

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const JSON_CORS = { "Content-Type": "application/json", ...CORS };

function ok(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_CORS });
}
function err(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: JSON_CORS });
}

// ----- crypto -----
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function randomHex(n = 16) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ----- config helpers -----
async function getConfig(db, key) {
  const row = await db.prepare("SELECT value FROM config WHERE key=?").bind(key).first();
  return row ? JSON.parse(row.value) : null;
}
async function setConfig(db, key, value) {
  await db.prepare("INSERT OR REPLACE INTO config (key,value) VALUES (?,?)").bind(key, JSON.stringify(value)).run();
}

// ----- auth helpers -----
async function getTokenAccount(db, req) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const row = await db.prepare(
    "SELECT c.* FROM sesiones s JOIN cuentas c ON c.id=s.cuenta_id WHERE s.token=?"
  ).bind(token).first();
  return row || null;
}
function checkAdmin(req, env) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token === env.ADMIN_TOKEN;
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    const path = url.pathname.replace(/\/$/, "");
    const db = env.DB;

    // =================== STUDENT ENDPOINTS ===================

    // POST /api/registro
    if (path === "/api/registro" && req.method === "POST") {
      const { nombre, email, whatsapp, password, marketing } = await req.json();
      if (!nombre || !email || !password) return err("Datos incompletos");
      if (password.length < 8) return err("La contraseña debe tener al menos 8 caracteres");
      const existing = await db.prepare("SELECT id FROM cuentas WHERE email=?").bind(email.toLowerCase()).first();
      if (existing) return err("Ya existe una cuenta con ese correo");
      const salt = randomHex(16);
      const hash = await hashPassword(password, salt);
      const id = randomHex(16);
      await db.prepare(
        "INSERT INTO cuentas (id,nombre,email,whatsapp,password,salt,marketing) VALUES (?,?,?,?,?,?,?)"
      ).bind(id, nombre.trim(), email.toLowerCase().trim(), whatsapp || null, hash, salt, marketing ? 1 : 0).run();
      const token = randomHex(32);
      await db.prepare("INSERT INTO sesiones (token,cuenta_id) VALUES (?,?)").bind(token, id).run();
      return ok({ token, nombre: nombre.trim() });
    }

    // POST /api/login
    if (path === "/api/login" && req.method === "POST") {
      const { email, password } = await req.json();
      if (!email || !password) return err("Datos incompletos");
      const cuenta = await db.prepare("SELECT * FROM cuentas WHERE email=?").bind(email.toLowerCase().trim()).first();
      if (!cuenta) return err("Correo o contraseña incorrectos");
      const hash = await hashPassword(password, cuenta.salt);
      if (hash !== cuenta.password) return err("Correo o contraseña incorrectos");
      const token = randomHex(32);
      await db.prepare("INSERT INTO sesiones (token,cuenta_id) VALUES (?,?)").bind(token, cuenta.id).run();
      return ok({ token, nombre: cuenta.nombre });
    }

    // POST /api/logout
    if (path === "/api/logout" && req.method === "POST") {
      const auth = req.headers.get("Authorization") || "";
      const token = auth.replace(/^Bearer\s+/i, "").trim();
      if (token) await db.prepare("DELETE FROM sesiones WHERE token=?").bind(token).run();
      return ok({ ok: true });
    }

    // GET /api/me
    if (path === "/api/me" && req.method === "GET") {
      const cuenta = await getTokenAccount(db, req);
      if (!cuenta) return err("No autenticado", 401);
      const alumnos = (await getConfig(db, "alumnos")) || [];
      const alumno = alumnos.find(a => a.id === cuenta.alumno_id) || null;
      const registro = (await getConfig(db, "registro")) || [];
      const misClases = alumno
        ? registro.filter(r => (r.alumnoId || r.alumno_id) === alumno.id && (r.ciclo || 1) === (alumno.ciclo || 1))
        : [];
      const precios = (await getConfig(db, "precios")) || {};
      const compras = await db.prepare(
        "SELECT * FROM compras WHERE cuenta_id=? ORDER BY fecha DESC"
      ).bind(cuenta.id).all();
      return ok({
        nombre: cuenta.nombre,
        email: cuenta.email,
        whatsapp: cuenta.whatsapp,
        alumno,
        registro: misClases,
        precios,
        compras: compras.results || [],
        config: {
          pago_numero: ((await getConfig(db, "config")) || {}).pago_numero || null,
          pago_titular: ((await getConfig(db, "config")) || {}).pago_titular || null,
          calendly_url: ((await getConfig(db, "config")) || {}).calendly_url || null,
        },
      });
    }

    // POST /api/comprar
    if (path === "/api/comprar" && req.method === "POST") {
      const cuenta = await getTokenAccount(db, req);
      if (!cuenta) return err("No autenticado", 401);
      const { paquete, curso, op_numero } = await req.json();
      const precios = (await getConfig(db, "precios")) || {};
      const monto = precios[paquete];
      if (!monto) return err("Paquete no válido");
      const id = randomHex(16);
      await db.prepare(
        "INSERT INTO compras (id,cuenta_id,curso,paquete,monto,op_numero) VALUES (?,?,?,?,?,?)"
      ).bind(id, cuenta.id, curso, paquete, monto, op_numero || null).run();
      return ok({ id, monto, estado: "pendiente" });
    }

    // =================== ADMIN ENDPOINTS ===================

    // GET /api/admin/data
    if (path === "/api/admin/data" && req.method === "GET") {
      if (!checkAdmin(req, env)) return err("No autorizado", 401);
      const [alumnos, registro, precios, cuentasRaw, comprasRaw, cfgRaw] = await Promise.all([
        getConfig(db, "alumnos"),
        getConfig(db, "registro"),
        getConfig(db, "precios"),
        db.prepare("SELECT id,nombre,email,whatsapp,alumno_id,marketing,creada FROM cuentas ORDER BY creada DESC").all(),
        db.prepare("SELECT * FROM compras ORDER BY fecha DESC").all(),
        getConfig(db, "config"),
      ]);
      return ok({
        alumnos: alumnos || [],
        registro: registro || [],
        precios: precios || {},
        cuentas: cuentasRaw.results || [],
        compras: comprasRaw.results || [],
        config: cfgRaw || {},
      });
    }

    // PUT /api/admin/data
    if (path === "/api/admin/data" && req.method === "PUT") {
      if (!checkAdmin(req, env)) return err("No autorizado", 401);
      const { alumnos, registro, precios } = await req.json();
      await Promise.all([
        setConfig(db, "alumnos", alumnos || []),
        setConfig(db, "registro", registro || []),
        setConfig(db, "precios", precios || {}),
      ]);
      return ok({ ok: true });
    }

    // POST /api/admin/config
    if (path === "/api/admin/config" && req.method === "POST") {
      if (!checkAdmin(req, env)) return err("No autorizado", 401);
      const body = await req.json();
      const current = (await getConfig(db, "config")) || {};
      await setConfig(db, "config", { ...current, ...body });
      return ok({ ok: true });
    }

    // POST /api/admin/compra
    if (path === "/api/admin/compra" && req.method === "POST") {
      if (!checkAdmin(req, env)) return err("No autorizado", 401);
      const { id, accion } = await req.json();
      if (!["confirmar", "rechazar"].includes(accion)) return err("Acción inválida");
      const estado = accion === "confirmar" ? "confirmada" : "rechazada";
      const compra = await db.prepare("SELECT * FROM compras WHERE id=?").bind(id).first();
      if (!compra) return err("Compra no encontrada");
      await db.prepare("UPDATE compras SET estado=? WHERE id=?").bind(estado, id).run();
      if (estado === "confirmada") {
        const cuenta = await db.prepare("SELECT * FROM cuentas WHERE id=?").bind(compra.cuenta_id).first();
        if (cuenta && cuenta.alumno_id) {
          const alumnos = (await getConfig(db, "alumnos")) || [];
          const idx = alumnos.findIndex(a => a.id === cuenta.alumno_id);
          if (idx >= 0) {
            alumnos[idx].paquete = compra.paquete;
            alumnos[idx].curso = compra.curso;
            alumnos[idx].pago = "Pagado";
            alumnos[idx].fecha = compra.fecha;
            alumnos[idx].ciclo = (alumnos[idx].ciclo || 1) + 1;
            await setConfig(db, "alumnos", alumnos);
          }
        }
      }
      return ok({ ok: true, estado });
    }

    // POST /api/admin/cuenta
    if (path === "/api/admin/cuenta" && req.method === "POST") {
      if (!checkAdmin(req, env)) return err("No autorizado", 401);
      const { id, accion, alumno_id, password } = await req.json();
      if (accion === "vincular") {
        await db.prepare("UPDATE cuentas SET alumno_id=? WHERE id=?").bind(alumno_id || null, id).run();
        return ok({ ok: true });
      }
      if (accion === "reset") {
        if (!password || password.length < 8) return err("Contraseña muy corta");
        const salt = randomHex(16);
        const hash = await hashPassword(password, salt);
        await db.prepare("UPDATE cuentas SET password=?,salt=? WHERE id=?").bind(hash, salt, id).run();
        await db.prepare("DELETE FROM sesiones WHERE cuenta_id=?").bind(id).run();
        return ok({ ok: true });
      }
      if (accion === "borrar") {
        await db.prepare("DELETE FROM cuentas WHERE id=?").bind(id).run();
        return ok({ ok: true });
      }
      return err("Acción desconocida");
    }

    return err("Ruta no encontrada", 404);
  },
};
