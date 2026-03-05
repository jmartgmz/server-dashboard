// ========================================
// Server Dashboard - Client Logic
// ========================================

(function () {
  "use strict";

  // ── Clock ──────────────────────────────
  const clockTimeEl = document.getElementById("clock-time");
  const clockDateEl = document.getElementById("clock-date");

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const hoursStr = String(hours).padStart(2, "0");
    clockTimeEl.textContent = `${hoursStr}:${minutes} ${ampm}`;

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    clockDateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ── System Stats ───────────────────────
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

      // CPU
      animateValue(cpuLoadEl, data.cpuLoad, "%");
      setGauge("cpu-gauge", data.cpuLoad);

      // RAM
      animateValue(ramUsageEl, data.ramUsage, "%");
      setGauge("ram-gauge", data.ramUsage);

      // Core Temp
      if (data.coreTemp !== null) {
        animateValue(coreTempEl, data.coreTemp, "°C");
        setGauge("temp-gauge", data.coreTemp); // 0-100°C scale
      } else {
        coreTempEl.textContent = "N/A";
      }

      // Disk
      if (data.diskUsage !== null) {
        animateValue(
          document.getElementById("disk-usage"),
          data.diskUsage,
          "%",
        );
        setGauge("disk-gauge", data.diskUsage);
      }

      // Uptime
      if (data.uptime) {
        document.getElementById("uptime").textContent = formatUptime(
          data.uptime,
        );
      }

      // Load Avg
      if (data.loadAvg !== undefined) {
        document.getElementById("load-avg").textContent =
          data.loadAvg.toFixed(2);
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

  // ── Service Pinging ────────────────────
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

  // ── Search / Quick Launch ──────────────
  const searchInput = document.getElementById("search-input");

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      }
    }
  });

  // ⌘K shortcut to focus search
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    // Escape to clear search
    if (e.key === "Escape") {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input"));
      searchInput.blur();
    }
  });

  // ── Dark Mode Toggle ──────────────────
  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("dashboard-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("dashboard-theme", isDark ? "dark" : "light");
  });

  // ── Calendar Widget ────────────────────
  const calDays = document.getElementById("cal-days");
  const calMonthLabel = document.getElementById("cal-month-label");
  const calPrev = document.getElementById("cal-prev");
  const calNext = document.getElementById("cal-next");
  const calAgendaList = document.getElementById("cal-agenda-list");
  const calEmptyState = document.getElementById("cal-empty-state");
  const calManageBtn = document.getElementById("cal-manage-btn");
  const calModalOverlay = document.getElementById("cal-modal-overlay");
  const calModalClose = document.getElementById("cal-modal-close");
  const calAddFeed = document.getElementById("cal-add-feed");
  const calFeedList = document.getElementById("cal-feed-list");
  const feedUrlInput = document.getElementById("feed-url-input");
  const feedNameInput = document.getElementById("feed-name-input");
  const feedColorInput = document.getElementById("feed-color-input");

  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let calYear, calMonth;
  let calEvents = [];
  let calFeeds = [];

  // Initialize to current month
  const calNow = new Date();
  calYear = calNow.getFullYear();
  calMonth = calNow.getMonth();

  // ── Render Month Grid ──
  function renderCalendar() {
    calMonthLabel.textContent = `${MONTHS[calMonth]} ${calYear}`;
    calDays.innerHTML = "";

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const today = new Date();

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      calDays.appendChild(createDayEl(daysInPrev - i, true, null));
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        d === today.getDate() &&
        calMonth === today.getMonth() &&
        calYear === today.getFullYear();
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = calEvents.filter((ev) => {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        const dayStart = new Date(calYear, calMonth, d);
        const dayEnd = new Date(calYear, calMonth, d + 1);
        return start < dayEnd && end > dayStart;
      });
      calDays.appendChild(createDayEl(d, false, dayEvents, isToday));
    }

    // Next month days (fill to 42 cells = 6 rows)
    const totalCells = calDays.children.length;
    const remaining = 42 - totalCells;
    for (let d = 1; d <= remaining; d++) {
      calDays.appendChild(createDayEl(d, true, null));
    }
  }

  function createDayEl(num, otherMonth, events, isToday) {
    const div = document.createElement("div");
    div.className =
      "cal-day" +
      (otherMonth ? " other-month" : "") +
      (isToday ? " today" : "");

    const numSpan = document.createElement("span");
    numSpan.className = "cal-day-num";
    numSpan.textContent = num;
    div.appendChild(numSpan);

    // Event dots removed by user request

    return div;
  }

  // ── Render Agenda ──
  function renderAgenda() {
    // Clear existing events (keep empty state)
    const existingEvents = calAgendaList.querySelectorAll(
      ".cal-event, .cal-event-date-group",
    );
    existingEvents.forEach((el) => el.remove());

    const now = new Date();
    const upcoming = calEvents
      .filter((ev) => new Date(ev.end) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 15);

    if (upcoming.length === 0) {
      calEmptyState.style.display = "";
      return;
    }

    calEmptyState.style.display = "none";

    // Group by date
    const groups = {};
    upcoming.forEach((ev) => {
      const dateKey = new Date(ev.start).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(ev);
    });

    Object.entries(groups).forEach(([dateLabel, events]) => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "cal-event-date-group";

      const label = document.createElement("div");
      label.className = "cal-event-date-label";
      label.textContent = dateLabel;
      groupDiv.appendChild(label);

      events.forEach((ev) => {
        const eventDiv = document.createElement("div");
        eventDiv.className = "cal-event";
        eventDiv.style.borderLeftColor = ev.feedColor;

        const timeSpan = document.createElement("span");
        timeSpan.className = "cal-event-time";
        if (ev.allDay) {
          timeSpan.textContent = "All day";
        } else {
          const start = new Date(ev.start);
          timeSpan.textContent = start.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }

        const infoDiv = document.createElement("div");
        infoDiv.className = "cal-event-info";

        const title = document.createElement("div");
        title.className = "cal-event-title";
        title.textContent = ev.title;
        title.title = ev.title;
        infoDiv.appendChild(title);

        if (ev.location) {
          const meta = document.createElement("div");
          meta.className = "cal-event-meta";
          meta.textContent = ev.location;
          infoDiv.appendChild(meta);
        }

        eventDiv.appendChild(timeSpan);
        eventDiv.appendChild(infoDiv);
        groupDiv.appendChild(eventDiv);
      });

      calAgendaList.appendChild(groupDiv);
    });
  }

  // ── Navigation ──
  calPrev.addEventListener("click", () => {
    calMonth--;
    if (calMonth < 0) {
      calMonth = 11;
      calYear--;
    }
    renderCalendar();
  });

  calNext.addEventListener("click", () => {
    calMonth++;
    if (calMonth > 11) {
      calMonth = 0;
      calYear++;
    }
    renderCalendar();
  });

  // ── Feed Modal ──
  calManageBtn.addEventListener("click", () => {
    calModalOverlay.classList.add("visible");
    loadFeeds();
  });

  calModalClose.addEventListener("click", () => {
    calModalOverlay.classList.remove("visible");
  });

  calModalOverlay.addEventListener("click", (e) => {
    if (e.target === calModalOverlay) {
      calModalOverlay.classList.remove("visible");
    }
  });

  calAddFeed.addEventListener("click", async () => {
    const url = feedUrlInput.value.trim();
    if (!url) return;

    calAddFeed.textContent = "Adding...";
    calAddFeed.disabled = true;

    try {
      const res = await fetch("/api/calendar/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          name: feedNameInput.value.trim() || "Calendar",
          color: feedColorInput.value,
        }),
      });

      if (res.ok) {
        feedUrlInput.value = "";
        feedNameInput.value = "";
        feedColorInput.value = "#3db4f2";
        await loadFeeds();
        await fetchEvents();
      }
    } catch (err) {
      console.error("Failed to add feed:", err);
    }

    calAddFeed.textContent = "Add Feed";
    calAddFeed.disabled = false;
  });

  async function deleteFeed(id) {
    try {
      await fetch(`/api/calendar/feeds/${id}`, { method: "DELETE" });
      await loadFeeds();
      await fetchEvents();
    } catch (err) {
      console.error("Failed to delete feed:", err);
    }
  }

  async function loadFeeds() {
    try {
      const res = await fetch("/api/calendar/feeds");
      calFeeds = await res.json();
      renderFeedList();
    } catch (err) {
      console.error("Failed to load feeds:", err);
    }
  }

  function renderFeedList() {
    calFeedList.innerHTML = "";
    calFeeds.forEach((feed) => {
      const item = document.createElement("div");
      item.className = "cal-feed-item";

      const colorDot = document.createElement("span");
      colorDot.className = "cal-feed-color";
      colorDot.style.background = feed.color;

      const info = document.createElement("div");
      info.className = "cal-feed-info";
      info.innerHTML = `<div class="cal-feed-name">${escapeHtml(feed.name)}</div><div class="cal-feed-url">${escapeHtml(feed.url)}</div>`;

      const delBtn = document.createElement("button");
      delBtn.className = "cal-feed-delete";
      delBtn.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      delBtn.addEventListener("click", () => deleteFeed(feed.id));

      item.appendChild(colorDot);
      item.appendChild(info);
      item.appendChild(delBtn);
      calFeedList.appendChild(item);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Fetch Events ──
  async function fetchEvents() {
    try {
      const res = await fetch("/api/calendar/events");
      calEvents = await res.json();
      renderCalendar();
      renderAgenda();
    } catch (err) {
      console.error("Failed to fetch events:", err);
      renderCalendar();
      renderAgenda();
    }
  }

  // Render calendar grid immediately (before async fetch)
  renderCalendar();
  renderAgenda();

  // Then fetch events in the background
  fetchEvents();
  // Refresh events every 60 seconds
  setInterval(fetchEvents, 60000);
})();
