const express = require("express");
const si = require("systeminformation");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [cpuLoad, mem, cpuTemp, time, disk, load] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature(),
      si.time(),
      si.fsSize(),
      si.currentLoad(),
    ]);

    const rootFs = disk.find((d) => d.mount === "/") || disk[0];

    res.json({
      cpuLoad: Math.round(cpuLoad.currentLoad),
      ramUsage: Math.round(((mem.total - mem.available) / mem.total) * 100),
      coreTemp: cpuTemp.main !== null ? Math.round(cpuTemp.main) : null,
      uptime: time.uptime,
      diskUsage: rootFs ? Math.round(rootFs.use) : null,
      loadAvg: cpuLoad.avgLoad,
    });
  } catch (err) {
    console.error("Error fetching system stats:", err);
    res.status(500).json({ error: "Failed to fetch system stats" });
  }
});

module.exports = router;
