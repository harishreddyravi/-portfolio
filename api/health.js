module.exports = (req, res) => {
  res.json({ hasKey: !!process.env.ANTHROPIC_API_KEY });
};
