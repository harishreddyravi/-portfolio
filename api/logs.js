const fs   = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const secret = process.env.LOG_SECRET;
  if (!secret || req.query.token !== secret) {
    return res.status(401).send('401 Unauthorized');
  }

  let entries = [];
  let isVercel = false;

  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'logs', 'chat-log.jsonl'), 'utf8');
    entries = raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l)).reverse();
  } catch {
    isVercel = true;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Chat Logs</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f0f4ff;color:#0f172a;padding:2rem}
  h1{font-size:1.4rem;font-weight:700;margin-bottom:.4rem}
  .meta{font-size:.82rem;color:#526080;margin-bottom:2rem}
  .entry{background:#fff;border:1px solid #dde4f2;border-radius:10px;padding:1.2rem 1.4rem;margin-bottom:1rem}
  .ts{font-size:.72rem;color:#8899bb;font-family:monospace;margin-bottom:.6rem}
  .label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.25rem}
  .q .label{color:#1d4ed8}
  .a .label{color:#059669}
  .q,.a{margin-bottom:.75rem}
  .q:last-child,.a:last-child{margin-bottom:0}
  p{font-size:.9rem;line-height:1.6;color:#334}
  .empty{color:#526080;font-size:.95rem}
  .vercel-note{background:#fff8e1;border:1px solid #f59e0b;border-radius:8px;padding:1rem 1.2rem;font-size:.88rem;color:#92400e}
</style>
</head>
<body>
<h1>AI Chat Logs</h1>
<p class="meta">${entries.length} conversation${entries.length !== 1 ? 's' : ''} recorded &nbsp;·&nbsp; newest first</p>

${isVercel
  ? `<div class="vercel-note">Running on Vercel — logs are written to the <strong>Vercel Dashboard → Project → Functions → Logs</strong>. Each entry is prefixed with <code>[chat-log]</code>.</div>`
  : entries.length === 0
    ? `<p class="empty">No conversations logged yet.</p>`
    : entries.map(e => `
<div class="entry">
  <div class="ts">${e.ts}</div>
  <div class="q"><div class="label">Question</div><p>${esc(e.q)}</p></div>
  <div class="a"><div class="label">Response</div><p>${esc(e.a)}</p></div>
</div>`).join('')
}
</body>
</html>`);
};

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}
