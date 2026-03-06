// ========================================
// Server Dashboard - Calendar Widget
// ========================================

(function () {
  "use strict";

  const calDays = document.getElementById("cal-days");
  if (!calDays) return;

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

  const calNow = new Date();
  calYear = calNow.getFullYear();
  calMonth = calNow.getMonth();

  function renderCalendar() {
    calMonthLabel.textContent = `${MONTHS[calMonth]} ${calYear}`;
    calDays.innerHTML = "";

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const today = new Date();

    for (let i = firstDay - 1; i >= 0; i--) {
      calDays.appendChild(createDayEl(daysInPrev - i, true, null));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        d === today.getDate() &&
        calMonth === today.getMonth() &&
        calYear === today.getFullYear();
      const dayEvents = calEvents.filter((ev) => {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        const dayStart = new Date(calYear, calMonth, d);
        const dayEnd = new Date(calYear, calMonth, d + 1);
        return start < dayEnd && end > dayStart;
      });
      calDays.appendChild(createDayEl(d, false, dayEvents, isToday));
    }

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
    return div;
  }

  function renderAgenda() {
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
      const id =
        Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const newFeed = {
        id,
        url,
        name: feedNameInput.value.trim() || "Calendar",
        color: feedColorInput.value || "#3db4f2",
      };

      calFeeds.push(newFeed);
      localStorage.setItem("calendar-feeds", JSON.stringify(calFeeds));

      feedUrlInput.value = "";
      feedNameInput.value = "";
      feedColorInput.value = "#3db4f2";

      renderFeedList();
      await fetchEvents();
    } catch (err) {
      console.error("Failed to add feed:", err);
    }

    calAddFeed.textContent = "Add Feed";
    calAddFeed.disabled = false;
  });

  async function deleteFeed(id) {
    try {
      calFeeds = calFeeds.filter((f) => f.id !== id);
      localStorage.setItem("calendar-feeds", JSON.stringify(calFeeds));
      renderFeedList();
      await fetchEvents();
    } catch (err) {
      console.error("Failed to delete feed:", err);
    }
  }

  async function loadFeeds() {
    try {
      const stored = localStorage.getItem("calendar-feeds");
      calFeeds = stored ? JSON.parse(stored) : [];
      renderFeedList();
    } catch (err) {
      console.error("Failed to load feeds:", err);
      calFeeds = [];
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

  async function fetchEvents() {
    try {
      if (calFeeds.length === 0) {
        calEvents = [];
        renderCalendar();
        renderAgenda();
        return;
      }

      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeds: calFeeds }),
      });
      calEvents = await res.json();
      renderCalendar();
      renderAgenda();
    } catch (err) {
      console.error("Failed to fetch events:", err);
      renderCalendar();
      renderAgenda();
    }
  }

  renderCalendar();
  renderAgenda();

  async function initCalendar() {
    await loadFeeds();
    await fetchEvents();
  }

  initCalendar();
  setInterval(fetchEvents, 60000);
})();
