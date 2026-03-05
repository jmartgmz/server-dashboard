const express = require("express");
const si = require("systeminformation");
const ical = require("node-ical");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 6767;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// System stats API
app.get("/api/stats", async (req, res) => {
  try {
    const [cpuLoad, mem, cpuTemp, time, disk, load] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature(),
      si.time(),
      si.fsSize(),
      si.currentLoad(), // Using currentLoad for loadavg as as it provides easier access to load averages
    ]);

    // Find root partition disk usage
    const rootFs = disk.find((d) => d.mount === "/") || disk[0];

    res.json({
      cpuLoad: Math.round(cpuLoad.currentLoad),
      ramUsage: Math.round(((mem.total - mem.available) / mem.total) * 100),
      coreTemp: cpuTemp.main !== null ? Math.round(cpuTemp.main) : null,
      uptime: time.uptime,
      diskUsage: rootFs ? Math.round(rootFs.use) : null,
      loadAvg: cpuLoad.avgLoad, // 1 min load avg
    });
  } catch (err) {
    console.error("Error fetching system stats:", err);
    res.status(500).json({ error: "Failed to fetch system stats" });
  }
});

// Fetch events from client-provided feeds
app.post("/api/calendar/events", async (req, res) => {
  const { feeds } = req.body;
  if (!feeds || !Array.isArray(feeds) || feeds.length === 0) {
    return res.json([]);
  }

  try {
    const allEvents = [];
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    await Promise.all(
      feeds.map(async (feed) => {
        try {
          const data = await ical.async.fromURL(feed.url);
          for (const key of Object.keys(data)) {
            const ev = data[key];
            if (ev.type !== "VEVENT") continue;

            const start = new Date(ev.start);
            const end = ev.end ? new Date(ev.end) : start;

            // Include events in range
            if (end >= rangeStart && start <= rangeEnd) {
              allEvents.push({
                title: ev.summary || "Untitled",
                start: start.toISOString(),
                end: end.toISOString(),
                location: ev.location || null,
                description: ev.description
                  ? ev.description.substring(0, 200)
                  : null,
                allDay:
                  ev.start && ev.start.dateOnly !== undefined
                    ? ev.start.dateOnly
                    : false,
                feedName: feed.name,
                feedColor: feed.color,
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching feed ${feed.name}:`, err.message);
        }
      }),
    );

    allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    res.json(allEvents);
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Check service status
app.get("/api/ping", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing URL" });

  try {
    const start = Date.now();
    // Use AbortController for a timeout (e.g., 5 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Make a lightweight HEAD request
    const pingRes = await fetch(targetUrl, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // If we get a response and the status is < 500, the web server is up and reachable.
    // (We treat 401/403/404 as online. 500+ usually means gateway/backend is down).
    const isAlive = pingRes.status < 500;

    res.json({
      status: isAlive ? "online" : "offline",
      latency: Date.now() - start,
      code: pingRes.status,
    });
  } catch (err) {
    // Timeout or network error
    res.json({ status: "offline", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server Dashboard running at http://localhost:${PORT}`);
});
