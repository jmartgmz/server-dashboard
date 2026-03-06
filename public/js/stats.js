// ========================================
// Server Dashboard - System Stats
// ========================================

(function () {
  "use strict";

  const cpuLoadEl = document.getElementById("cpu-load");
  const ramUsageEl = document.getElementById("ram-usage");
  const coreTempEl = document.getElementById("core-temp");

  const GAUGE_CIRCUMFERENCE = 97.4; // 2 * π * 15.5

  function setGauge(gaugeId, percent) {
    const gauge = document.getElementById(gaugeId);
    if (!gauge) return;
    const clamped = Math.max(0, Math.min(100, percent));
    const offset = GAUGE_CIRCUMFERENCE * (1 - clamped / 100);
    gauge.style.strokeDashoffset = offset;
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();

      if (cpuLoadEl) {
        animateValue(cpuLoadEl, data.cpuLoad, "%");
        setGauge("cpu-gauge", data.cpuLoad);
      }
      if (ramUsageEl) {
        animateValue(ramUsageEl, data.ramUsage, "%");
        setGauge("ram-gauge", data.ramUsage);
      }
      if (coreTempEl) {
        if (data.coreTemp !== null) {
          animateValue(coreTempEl, data.coreTemp, "°C");
          setGauge("temp-gauge", data.coreTemp);
        } else {
          coreTempEl.textContent = "N/A";
        }
      }

      const diskUsageEl = document.getElementById("disk-usage");
      if (diskUsageEl && data.diskUsage !== null) {
        animateValue(diskUsageEl, data.diskUsage, "%");
        setGauge("disk-gauge", data.diskUsage);
      }

      const uptimeEl = document.getElementById("uptime");
      if (uptimeEl && data.uptime) {
        uptimeEl.textContent = formatUptime(data.uptime);
      }

      const loadAvgEl = document.getElementById("load-avg");
      if (loadAvgEl && data.loadAvg !== undefined) {
        loadAvgEl.textContent = data.loadAvg.toFixed(2);
      }
    } catch (err) {
      console.warn("Failed to fetch stats:", err);
    }
  }

  function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function animateValue(el, newVal, suffix) {
    if (!el) return;
    const currentText = el.textContent.replace(/[^0-9]/g, "");
    const currentVal = parseInt(currentText) || 0;

    if (currentVal === newVal) return;

    const diff = newVal - currentVal;
    const steps = Math.min(Math.abs(diff), 15);
    const stepSize = diff / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const val = Math.round(currentVal + stepSize * step);
      el.textContent = `${val} ${suffix}`;
      if (step >= steps) {
        el.textContent = `${newVal} ${suffix}`;
        clearInterval(interval);
      }
    }, 30);
  }

  fetchStats();
  setInterval(fetchStats, 5000);
})();
