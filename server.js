require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ENV_PATH = path.join(__dirname, '.env');

app.use(express.json());

// Health — returns whether a key is loaded
app.get('/api/health', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  res.json({ hasKey: !!key });
});

// Save key — writes to .env and loads it into memory immediately
app.post('/api/setkey', (req, res) => {
  const { key } = req.body || {};
  if (!key || !key.startsWith('sk-ant-')) {
    return res.status(400).json({ error: 'Invalid key format. Must start with sk-ant-' });
  }
  fs.writeFileSync(ENV_PATH, `ANTHROPIC_API_KEY=${key.trim()}\n`, 'utf8');
  process.env.ANTHROPIC_API_KEY = key.trim();
  console.log('[server] API key updated and saved to .env');
  res.json({ ok: true });
});

// Logs viewer
app.get('/api/logs', (req, res) => require('./api/logs')(req, res));

// Chat
app.post('/api/chat', (req, res) => {
  console.log('[chat] request received');
  require('./api/chat')(req, res);
});

// Static files last so /api/* routes take priority
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log(`\nPortfolio → http://localhost:${PORT}`);
  console.log(`Key status: ${key ? 'loaded' : 'NOT SET — enter it in the chat widget'}\n`);
});
