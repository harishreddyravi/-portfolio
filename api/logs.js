const fs   = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const secret = process.env.LOG_SECRET;
  if (!secret || req.query.token !== secret) {
    return res.status(401).send('401 Unauthorized');
  }

  let entries = [];
  let source  = 'file';

  // Vercel KV (production)
  if (process.env.KV_REST_API_URL) {
    try {
      const { kv } = require('@vercel/kv');
      const raw = await kv.lrange('chat-logs', 0, -1); // newest first (lpush)
      entries = raw.map(e => (typeof e === 'string' ? JSON.parse(e) : e));
      source = 'kv';
    } catch (e) {
      return res.status(500).send(`KV error: ${e.message}`);
    }
  } else {
    // Local file
    try {
      const raw = fs.readFileSync(path.join(process.cwd(), 'logs', 'chat-log.jsonl'), 'utf8');
      entries = raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l)).reverse();
    } catch {
      entries = [];
    }
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
  body{font-family:system-ui,sans-serif;background:#f0f4ff;color:#0f172a;padding:2rem;max-width:860px;margin:0 auto}
  h1{font-size:1.4rem;font-weight:700;margin-bottom:.3rem}
  .meta{font-size:.82rem;color:#526080;margin-bottom:2rem}
  .entry{background:#fff;border:1px solid #dde4f2;border-radius:10px;padding:1.2rem 1.4rem;margin-bottom:1rem}
  .ts{font-size:.72rem;color:#8899bb;font-family:monospace;margin-bottom:.7rem}
  .label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.25rem}
  .q .label{color:#1d4ed8}.a .label{color:#059669}
  .q{margin-bottom:.75rem}
  p{font-size:.9rem;line-height:1.6;color:#334}
  .empty{color:#526080;font-size:.95rem}
</style>
</head>
<body>
<h1>AI Chat Logs</h1>
<p class="meta">${entries.length} conversation${entries.length !== 1 ? 's' : ''} &nbsp;·&nbsp; source: ${source} &nbsp;·&nbsp; newest first</p>

${entries.length === 0
  ? `<p class="empty">No conversations logged yet.</p>`
  : entries.map(e => `
<div class="entry">
  <div class="ts">${e.ts}</div>
  <div class="q"><div class="label">Question</div><p>${esc(e.q)}</p></div>
  <div class="a"><div class="label">Response</div><p>${esc(e.a)}</p></div>
</div>`).join('')
}
</body></html>`);
};

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
