// API mínima sin dependencias (solo Node). Persiste en server/db.json.
// Trucos para probar estados de la UI:
//   - email que contenga "error500"  -> el POST devuelve 500
//   - email repetido                 -> 409 con field:"email"
//   - GET /api/crew?chaos=1          -> añade registros corruptos (bonus Zod)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "db.json");
const PORT = 3001;
const DELAY_MS = 700; // latencia artificial para que se vean los estados de carga
const ROLES = ["comandante", "piloto", "ingeniero", "cientifico", "medico"];

const now = () => new Date().toISOString();

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    const seed = [
      { id: randomUUID(), fullName: "Valentina Tereshkova", email: "valentina@canada.space", age: 34, role: "comandante", missionCode: "MC-1963", createdAt: now() },
      { id: randomUUID(), fullName: "Ellen Ochoa", email: "ellen@canada.space", age: 41, role: "ingeniero", missionCode: "MC-1993", createdAt: now() },
    ];
    save(seed);
    return seed;
  }
}
const save = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Registros deliberadamente rotos para demostrar safeParse en el cliente
const corruptRecords = () => [
  { id: "no-es-un-uuid", fullName: "", email: "esto-no-es-un-email", age: "treinta", role: "alienigena", missionCode: "XX", createdAt: "ayer" },
  { id: randomUUID(), fullName: "Registro sin edad ni rol", email: "roto@canada.space", missionCode: "MC-0000", createdAt: now() },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body === undefined ? undefined : JSON.stringify(body));
};
const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); }
    });
  });

function validate(b) {
  if (typeof b.fullName !== "string" || b.fullName.trim().length < 3) return "Nombre inválido";
  if (typeof b.email !== "string" || !/^\S+@\S+\.\S+$/.test(b.email)) return "Email inválido";
  if (!Number.isInteger(b.age) || b.age < 21 || b.age > 65) return "Edad fuera de rango";
  if (!ROLES.includes(b.role)) return "Rol inválido";
  if (typeof b.missionCode !== "string" || !/^MC-\d{4}$/i.test(b.missionCode)) return "Código de misión inválido";
  if (typeof b.password !== "string" || b.password.length < 8) return "Contraseña demasiado corta";
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  await sleep(DELAY_MS);

  if (req.method === "GET" && url.pathname === "/api/crew") {
    const role = url.searchParams.get("role");
    let list = load();
    if (role && role !== "all") list = list.filter((m) => m.role === role);
    list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (url.searchParams.get("chaos") === "1") list = [...list, ...corruptRecords()];
    return send(res, 200, list);
  }

  if (req.method === "POST" && url.pathname === "/api/crew") {
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { message: "JSON inválido" }); }

    if (String(body.email).includes("error500")) {
      return send(res, 500, { message: "Fallo simulado del servidor. Inténtalo de nuevo." });
    }
    const problem = validate(body);
    if (problem) return send(res, 422, { message: problem });

    const list = load();
    if (list.some((m) => m.email.toLowerCase() === body.email.toLowerCase())) {
      return send(res, 409, { message: "Ya hay un tripulante registrado con este email", field: "email" });
    }
    // La contraseña NO se guarda ni se devuelve (en un caso real: hash + tabla de usuarios)
    const member = {
      id: randomUUID(),
      fullName: body.fullName.trim(),
      email: body.email.trim(),
      age: body.age,
      role: body.role,
      missionCode: body.missionCode.toUpperCase(),
      createdAt: now(),
    };
    save([...list, member]);
    return send(res, 201, member);
  }

  const del = url.pathname.match(/^\/api\/crew\/([\w-]+)$/);
  if (req.method === "DELETE" && del) {
    const list = load();
    if (!list.some((m) => m.id === del[1])) return send(res, 404, { message: "Tripulante no encontrado" });
    save(list.filter((m) => m.id !== del[1]));
    return send(res, 204);
  }

  send(res, 404, { message: "Ruta no encontrada" });
});

server.listen(PORT, () => console.log(`API de la misión escuchando en http://localhost:${PORT}`));
