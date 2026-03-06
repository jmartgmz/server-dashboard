// ========================================
// Server Dashboard - Service Pinging
// ========================================

(function () {
  "use strict";

  async function pingServices() {
    const serviceCards = document.querySelectorAll(
      ".services-section .service-card",
    );
    for (const card of Array.from(serviceCards)) {
      const url = card.getAttribute("href");
      if (!url) continue;

      try {
        const res = await fetch(`/api/ping?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        const statusEl = card.querySelector(".card-status");
        if (statusEl) {
          if (data.status === "online") {
            statusEl.innerHTML = '<span class="status-dot"></span>RUNNING';
            statusEl.style.color = "var(--accent-teal)";
            const dot = statusEl.querySelector(".status-dot");
            dot.style.background = "var(--accent-teal)";
            dot.style.boxShadow = "0 0 6px rgba(59, 130, 196, 0.5)";
            dot.style.animation = "pulse-dot 2s ease-in-out infinite";
          } else {
            statusEl.innerHTML = '<span class="status-dot"></span>OFFLINE';
            statusEl.style.color = "#f87171"; // Red
            const dot = statusEl.querySelector(".status-dot");
            dot.style.background = "#f87171";
            dot.style.boxShadow = "0 0 6px rgba(248, 113, 113, 0.5)";
            dot.style.animation = "none";
          }
        }
      } catch (err) {
        console.warn("Ping failed for", url, err);
      }
    }
  }

  pingServices();
  setInterval(pingServices, 30000); // Check every 30s
})();
