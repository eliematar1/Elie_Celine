/**
 * IT Help Desk — local dev server (Week 1 preview)
 * Serves wireframes, diagrams, and project hub on http://localhost:8080
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8',
  '.drawio': 'application/xml',
};

function send(res, status, body, type = 'text/html; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded === '/' ? '/index.html' : decoded;
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT)) return null;
  return full;
}

const hubHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>IT Help Desk — Project Hub</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:40px 24px}
    .wrap{max-width:720px;margin:0 auto}
    h1{font-size:1.75rem;margin-bottom:8px}
    .sub{color:#94a3b8;margin-bottom:28px;font-size:.95rem}
    .badge{display:inline-block;background:#3b82f6;color:#fff;padding:4px 10px;border-radius:6px;font-size:.75rem;font-weight:700;margin-bottom:24px}
    section{margin-bottom:28px}
    section h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:12px}
    a.card{display:block;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 18px;margin-bottom:10px;color:#f1f5f9;text-decoration:none;transition:border-color .15s}
    a.card:hover{border-color:#3b82f6}
    a.card strong{display:block;margin-bottom:4px}
    a.card span{font-size:.85rem;color:#94a3b8}
    .note{margin-top:32px;padding:14px;background:#1e3a5f;border-radius:8px;font-size:.85rem;color:#bae6fd}
    code{background:#334155;padding:2px 6px;border-radius:4px;font-size:.8rem}
  </style>
</head>
<body>
  <div class="wrap">
    <span class="badge">WEEK 1 — RUNNING LOCALLY</span>
    <h1>IT Help Desk &amp; Ticketing</h1>
    <p class="sub">Celine Mortada &amp; Elie Matar · React + ASP.NET Core + SQL Server (planned)</p>

    <section>
      <h2>UI wireframes</h2>
      <a class="card" href="/wireframes/index.html"><strong>Wireframes home</strong><span>Login, dashboard, tickets, admin, reports…</span></a>
      <a class="card" href="/wireframes/dashboard.html"><strong>Dashboard</strong><span>Main agent/employee view</span></a>
      <a class="card" href="/wireframes/create-ticket.html"><strong>Create ticket</strong><span>New support request form</span></a>
    </section>

    <section>
      <h2>Database &amp; ERD</h2>
      <a class="card" href="/diagrams/erd-visual.html"><strong>ERD diagram (visual)</strong><span>Screenshot-ready entity relationship diagram</span></a>
      <a class="card" href="/diagrams/database-tables-visual.html"><strong>Database schema overview</strong><span>All tables and relationships</span></a>
      <a class="card" href="/database/ITHelpDesk-COMPLETE.sql"><strong>SQL script (download)</strong><span>Full schema + seed data for SSMS</span></a>
    </section>

    <section>
      <h2>Documentation</h2>
      <a class="card" href="/docs/00-project-proposal.md"><strong>Project proposal</strong></a>
      <a class="card" href="/docs/02-system-workflows.md"><strong>System workflows</strong></a>
      <a class="card" href="/docs/WEEK1-SUBMISSION.md"><strong>Week 1 checklist</strong></a>
    </section>

    <p class="note">
      <strong>Status:</strong> Week 1 = planning, wireframes, SQL schema. API + React app start in Week 2.<br/>
      Install <a href="https://dotnet.microsoft.com/download" style="color:#7dd3fc">.NET 8 SDK</a> + SQL Server Express to run the backend next.<br/>
      Server: <code>http://localhost:${PORT}</code>
    </p>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const filePath = safePath(req.url);
  if (!filePath) return send(res, 403, 'Forbidden');

  if (req.url === '/' || req.url === '/index.html') {
    return send(res, 200, hubHtml);
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      if (req.url.endsWith('/') || !path.extname(filePath)) {
        const indexTry = path.join(filePath, 'index.html');
        return fs.stat(indexTry, (e2, s2) => {
          if (e2 || !s2.isFile()) return send(res, 404, 'Not found');
          streamFile(indexTry, res);
        });
      }
      return send(res, 404, 'Not found');
    }
    streamFile(filePath, res);
  });
});

function streamFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(filePath)
    .on('error', () => {
      if (!res.headersSent) send(res, 500, 'Error');
      else res.end();
    })
    .pipe(res);
}

server.listen(PORT, () => {
  console.log('');
  console.log('  IT Help Desk — local server running');
  console.log('  -------------------------------------');
  console.log(`  Hub:        http://localhost:${PORT}`);
  console.log(`  Wireframes: http://localhost:${PORT}/wireframes/index.html`);
  console.log(`  ERD:        http://localhost:${PORT}/diagrams/erd-visual.html`);
  console.log(`  Schema:     http://localhost:${PORT}/diagrams/database-tables-visual.html`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
