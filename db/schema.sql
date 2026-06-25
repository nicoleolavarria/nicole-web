-- Nicole Olavarría — CRM portal schema
-- D1 (SQLite). Correr una sola vez: wrangler d1 execute nicole-crm --file=db/schema.sql

CREATE TABLE IF NOT EXISTS cuentas (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  whatsapp   TEXT,
  password   TEXT NOT NULL,   -- PBKDF2-SHA256, hex
  salt       TEXT NOT NULL,
  alumno_id  TEXT,            -- FK a alumnos.id (guardados en KV/D1 por admin)
  marketing  INTEGER DEFAULT 0,
  creada     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  token      TEXT PRIMARY KEY,
  cuenta_id  TEXT NOT NULL,
  creada     TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compras (
  id         TEXT PRIMARY KEY,
  cuenta_id  TEXT NOT NULL,
  curso      TEXT NOT NULL,
  paquete    TEXT NOT NULL,
  monto      REAL NOT NULL,
  op_numero  TEXT,
  estado     TEXT DEFAULT 'pendiente',  -- pendiente | confirmada | rechazada
  fecha      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL
);

-- Datos iniciales de config
INSERT OR IGNORE INTO config (key, value) VALUES
  ('alumnos',   '[]'),
  ('registro',  '[]'),
  ('precios',   '{"Paquete 4":250,"Paquete 8":450,"Paquete 12":600,"Clase suelta":70}');
