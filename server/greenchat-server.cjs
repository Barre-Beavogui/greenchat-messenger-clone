const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8787);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = process.env.GREENCHAT_DATA_DIR
  ? path.resolve(process.env.GREENCHAT_DATA_DIR)
  : path.join(ROOT, ".data");
const DB_PATH = path.join(DATA_DIR, "greenchat-db.json");
const MAX_BODY_BYTES = 512 * 1024;

const clients = new Map();
let saveTimer = null;
let db = loadDb();

function loadDb() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
      return { users: {}, messages: [] };
    }
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    return {
      users: parsed.users && typeof parsed.users === "object" ? parsed.users : {},
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch (error) {
    console.error("Failed to load DB:", error);
    return { users: {}, messages: [] };
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }, 80);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function json(res, status, payload) {
  setCors(res);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function isSafeId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

function isPublicKey(value) {
  return Boolean(value && typeof value === "object" && value.kty && value.crv && value.x && value.y);
}

function notify(userId, eventName, payload) {
  const bucket = clients.get(userId);
  if (!bucket) return;
  const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of bucket) {
    res.write(data);
  }
}

function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
  res.on("close", () => {
    const bucket = clients.get(userId);
    if (!bucket) return;
    bucket.delete(res);
    if (bucket.size === 0) clients.delete(userId);
  });
}

async function handleApi(req, res, url) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, {
      ok: true,
      users: Object.keys(db.users).length,
      messages: db.messages.length,
      uptime: process.uptime(),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/register") {
    const body = await readBody(req);
    if (!isSafeId(body.userId) || !isPublicKey(body.publicKey)) {
      json(res, 400, { error: "Invalid registration payload" });
      return;
    }

    db.users[body.userId] = {
      publicKey: body.publicKey,
      label: typeof body.label === "string" ? body.label.slice(0, 80) : "",
      updatedAt: new Date().toISOString(),
    };
    scheduleSave();
    json(res, 200, { ok: true, userId: body.userId });
    return;
  }

  const keyMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/public-key$/);
  if (req.method === "GET" && keyMatch) {
    const userId = keyMatch[1];
    if (!isSafeId(userId) || !db.users[userId]) {
      json(res, 404, { error: "User key not found" });
      return;
    }
    json(res, 200, {
      userId,
      publicKey: db.users[userId].publicKey,
      updatedAt: db.users[userId].updatedAt,
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/messages") {
    const body = await readBody(req);
    if (
      !isSafeId(body.id) ||
      !isSafeId(body.from) ||
      !isSafeId(body.to) ||
      typeof body.iv !== "string" ||
      typeof body.payload !== "string" ||
      !isPublicKey(body.senderPublicKey)
    ) {
      json(res, 400, { error: "Invalid encrypted message payload" });
      return;
    }

    const exists = db.messages.some((message) => message.id === body.id);
    const envelope = {
      id: body.id,
      from: body.from,
      to: body.to,
      iv: body.iv,
      payload: body.payload,
      senderPublicKey: body.senderPublicKey,
      sentAt: typeof body.sentAt === "number" ? body.sentAt : Date.now(),
      storedAt: Date.now(),
    };

    if (!exists) {
      db.messages.push(envelope);
      if (db.messages.length > 20000) {
        db.messages = db.messages.slice(-20000);
      }
      scheduleSave();
      notify(envelope.to, "message", envelope);
      notify(envelope.from, "message", envelope);
    }

    json(res, 200, { ok: true, duplicate: exists });
    return;
  }

  const messagesMatch = url.pathname.match(/^\/api\/messages\/([^/]+)$/);
  if (req.method === "GET" && messagesMatch) {
    const userId = messagesMatch[1];
    if (!isSafeId(userId)) {
      json(res, 400, { error: "Invalid user id" });
      return;
    }
    const since = Number(url.searchParams.get("since") || 0);
    const messages = db.messages.filter((message) => {
      return (message.to === userId || message.from === userId) && message.storedAt > since;
    });
    json(res, 200, { messages, serverTime: Date.now() });
    return;
  }

  const eventsMatch = url.pathname.match(/^\/api\/events\/([^/]+)$/);
  if (req.method === "GET" && eventsMatch) {
    const userId = eventsMatch[1];
    if (!isSafeId(userId)) {
      json(res, 400, { error: "Invalid user id" });
      return;
    }
    setCors(res);
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, userId })}\n\n`);
    addClient(userId, res);
    return;
  }

  json(res, 404, { error: "Not found" });
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (!filePath.startsWith(ROOT) || filePath.includes(`${path.sep}.data${path.sep}`)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType(filePath),
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  Promise.resolve()
    .then(() => {
      if (url.pathname === "/health" || url.pathname.startsWith("/api/")) {
        return handleApi(req, res, url);
      }
      return serveStatic(req, res, url);
    })
    .catch((error) => {
      console.error("Request failed:", error);
      json(res, error.message === "Payload too large" ? 413 : 500, { error: error.message || "Server error" });
    });
});

const ping = setInterval(() => {
  for (const bucket of clients.values()) {
    for (const res of bucket) {
      res.write(`event: ping\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`);
    }
  }
}, 25000);

server.listen(PORT, () => {
  console.log(`GreenChat server listening on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  clearInterval(ping);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  server.close(() => process.exit(0));
});
