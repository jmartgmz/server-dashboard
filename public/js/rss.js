// ========================================
// Server Dashboard - RSS Feed
// ========================================

(function () {
  "use strict";

  const animeList = document.getElementById("rss-anime-list");
  const animeEmptyState = document.getElementById("rss-anime-empty");

  const mangaList = document.getElementById("rss-manga-list");
  const mangaEmptyState = document.getElementById("rss-manga-empty");

  const ANIME_RSS_URL = "https://rfa.mnpn.dev/anime/karyio";
  const MANGA_RSS_URL = "https://rfa.mnpn.dev/manga/karyio";

  async function fetchFeed(url, listEl, emptyEl) {
    try {
      const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Failed to fetch RSS");
      const items = await res.json();
      renderRSS(items.slice(0, 10), listEl, emptyEl);
    } catch (err) {
      console.error(err);
      if (emptyEl) {
        emptyEl.innerHTML = `<p style="color: #f87171">Failed to load feeds</p>`;
        emptyEl.style.display = "flex";
      }
    }
  }

  async function fetchAllFeeds() {
    await Promise.all([
      fetchFeed(ANIME_RSS_URL, animeList, animeEmptyState),
      fetchFeed(MANGA_RSS_URL, mangaList, mangaEmptyState),
    ]);
  }

  function renderRSS(items, listEl, emptyEl) {
    if (!items || items.length === 0) {
      if (emptyEl) emptyEl.style.display = "flex";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";
    if (!listEl) return;

    listEl.innerHTML = "";
    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "rss-item";

      const link = document.createElement("a");
      link.className = "rss-link";
      link.href = item.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      if (item.coverImage) {
        const cover = document.createElement("div");
        cover.className = "rss-cover";
        const img = document.createElement("img");
        img.src = item.coverImage;
        img.loading = "lazy";
        cover.appendChild(img);
        link.appendChild(cover);
      }

      const content = document.createElement("div");
      content.className = "rss-content";

      const title = document.createElement("div");
      title.className = "rss-title";
      title.textContent = item.title;

      const activity = document.createElement("div");
      activity.className = "rss-activity";
      activity.textContent =
        item.contentSnippet || item.content || "Unknown Status";

      const meta = document.createElement("div");
      meta.className = "rss-meta";
      const date = new Date(item.pubDate);
      meta.textContent = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      content.appendChild(title);
      content.appendChild(activity);
      content.appendChild(meta);
      link.appendChild(content);
      div.appendChild(link);
      listEl.appendChild(div);
    });
  }

  fetchAllFeeds();
  setInterval(fetchAllFeeds, 300000); // 5 mins
})();
