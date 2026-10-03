/* Delevo sync server — one shared JSON state document, optimistic concurrency, live updates (SSE).
   Zero dependencies. Run: node server.js   (PORT, DATA_FILE env vars optional) */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = +process.env.PORT || 3500;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'state.json');
const MAX_BODY = 8 * 1024 * 1024;

let rev = 0;
let state = null;
try { const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); rev = d.rev || 0; state = d.state || null; } catch (e) {}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      const tmp = DATA_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({ rev, state }));
      fs.renameSync(tmp, DATA_FILE);
    } catch (e) { console.error('save failed', e.message); }
  }, 300);
}

const clients = new Set();
function broadcast() { const msg = `data: ${JSON.stringify({ rev })}\n\n`; clients.forEach((res) => res.write(msg)); }
setInterval(() => clients.forEach((res) => res.write(': ping\n\n')), 25000).unref();

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
const json = (res, code, obj) => { res.writeHead(code, { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

// crude per-IP write limiter (demo-grade): 120 writes / minute
const hits = new Map();
function limited(ip) {
  const now = Date.now(); const h = (hits.get(ip) || []).filter((t) => now - t < 60000);
  h.push(now); hits.set(ip, h); return h.length > 120;
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }

  if (url === '/health') return json(res, 200, { ok: true, rev, clients: clients.size });

  if (url === '/api/state' && req.method === 'GET') return json(res, 200, { rev, state });

  if (url === '/api/events' && req.method === 'GET') {
    res.writeHead(200, { ...cors, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`data: ${JSON.stringify({ rev })}\n\n`);
    clients.add(res); req.on('close', () => clients.delete(res));
    return;
  }

  if (url === '/api/state' && req.method === 'PUT') {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (limited(ip)) return json(res, 429, { error: 'slow down' });
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { json(res, 413, { error: 'too large' }); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return json(res, 400, { error: 'bad json' }); }
      if (!body || typeof body.state !== 'object' || body.state === null) return json(res, 400, { error: 'no state' });
      if (!body.force && body.baseRev !== rev) return json(res, 409, { rev, state });
      rev += 1; state = body.state; save(); broadcast();
      json(res, 200, { ok: true, rev });
    });
    return;
  }

  json(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log(`Delevo sync server on :${PORT} (rev ${rev})`));

process.on('SIGTERM', () => { try { fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true }); fs.writeFileSync(DATA_FILE, JSON.stringify({ rev, state })); } catch (e) {} process.exit(0); });
