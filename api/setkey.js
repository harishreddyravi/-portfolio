const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key } = req.body || {};
  if (!key || !key.startsWith('sk-ant-')) {
    return res.status(400).json({ error: 'Invalid key — must start with sk-ant-' });
  }

  // On Vercel the filesystem is read-only; the key must be set as an env var in the dashboard
  const envPath = path.join(process.cwd(), '.env');
  try {
    fs.writeFileSync(envPath, `ANTHROPIC_API_KEY=${key.trim()}\n`, 'utf8');
    process.env.ANTHROPIC_API_KEY = key.trim();
    res.json({ ok: true });
  } catch {
    // Running on Vercel (read-only FS) — key must be set in the Vercel dashboard
    res.status(200).json({
      ok: false,
      vercel: true,
      message: 'Add ANTHROPIC_API_KEY in Vercel Dashboard → Project Settings → Environment Variables, then redeploy.'
    });
  }
};
