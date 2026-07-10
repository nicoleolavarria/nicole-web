PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE cuentas (
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
INSERT INTO "cuentas" ("id","nombre","email","whatsapp","password","salt","alumno_id","marketing","creada") VALUES('c79b3af557a0152ef599c033122d8989','Andres Salame','andressalame@gmail.com',NULL,'7f7cbb85353c94cd72656d509dfa59635da672cc39a097857b8bf81dec50df06','bc808014b450c210f25194b720e06957',NULL,1,'2026-06-26 01:28:18');
CREATE TABLE sesiones (
  token      TEXT PRIMARY KEY,
  cuenta_id  TEXT NOT NULL,
  creada     TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE
);
INSERT INTO "sesiones" ("token","cuenta_id","creada") VALUES('a26c02ce50cfea80d4f998bd8d746bf1b6aaf08e41938ed09bded9d750ec2d18','c79b3af557a0152ef599c033122d8989','2026-06-26 01:28:18');
INSERT INTO "sesiones" ("token","cuenta_id","creada") VALUES('85bf4c300742bc5d2c6ed359030448ad7bb6a4b40057da2234003f54a5465137','c79b3af557a0152ef599c033122d8989','2026-06-26 01:28:27');
INSERT INTO "sesiones" ("token","cuenta_id","creada") VALUES('117429ae1b538b80e001e88cafe229d3938353f4245d161390f3fdd87bed3eda','c79b3af557a0152ef599c033122d8989','2026-06-26 01:28:55');
INSERT INTO "sesiones" ("token","cuenta_id","creada") VALUES('1b1e3142db6c5c4f361f8c64f2860ddbabd3ffc18fe37c28c611654d1ae4005a','c79b3af557a0152ef599c033122d8989','2026-06-26 01:28:58');
INSERT INTO "sesiones" ("token","cuenta_id","creada") VALUES('1bd8cf179f2e68a651bb762ac807a76fe97498afecf80825291b6808e6bf2956','c79b3af557a0152ef599c033122d8989','2026-06-26 01:29:01');
INSERT INTO "sesiones" ("token","cuenta_id","creada") VALUES('d81cf350e835f87612ba7bb5cf7172ee5739605c8e85266810b0cba8a89f9cf5','c79b3af557a0152ef599c033122d8989','2026-07-05 15:15:17');
CREATE TABLE compras (
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
CREATE TABLE config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL
);
INSERT INTO "config" ("key","value") VALUES('alumnos','[]');
INSERT INTO "config" ("key","value") VALUES('registro','[]');
INSERT INTO "config" ("key","value") VALUES('precios','{"Paquete 4":250,"Paquete 8":450,"Paquete 12":600,"Clase suelta":70}');
