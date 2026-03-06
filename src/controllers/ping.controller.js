const pingService = async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing URL" });

  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const pingRes = await fetch(targetUrl, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const isAlive = pingRes.status < 500;

    res.json({
      status: isAlive ? "online" : "offline",
      latency: Date.now() - start,
      code: pingRes.status,
    });
  } catch (err) {
    res.json({ status: "offline", error: err.message });
  }
};

module.exports = {
  pingService,
};
