// ========================================
// Server Dashboard - Navigation & Search
// ========================================

(function () {
  "use strict";

  // ── Search / Quick Launch ──────────────
  const searchInput = document.getElementById("search-input");

  if (searchInput) {
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
  }

  // ── SPA Navigation ───────────────────────
  const navOverlayBtn = document.getElementById("nav-overlay-btn");
  const navOverlayIcon = document.getElementById("nav-overlay-icon");
  const viewHome = document.getElementById("view-home");
  const viewPage2 = document.getElementById("view-page2");

  if (navOverlayBtn && navOverlayIcon && viewHome && viewPage2) {
    let isPage2Visible = false;

    navOverlayBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevents the image box click (theme toggle) from firing
      isPage2Visible = !isPage2Visible;

      if (isPage2Visible) {
        viewHome.style.display = "none";
        viewPage2.style.display = "flex"; // Assuming Flex layout from bookmarks
        navOverlayIcon.innerHTML =
          '<polyline points="15 18 9 12 15 6"></polyline>'; // Left chevron
        navOverlayBtn.setAttribute("aria-label", "Go to Home");
      } else {
        viewPage2.style.display = "none";
        viewHome.style.display = "flex";
        navOverlayIcon.innerHTML =
          '<polyline points="9 18 15 12 9 6"></polyline>'; // Right chevron
        navOverlayBtn.setAttribute("aria-label", "Toggle Page 2");
      }
    });
  }
})();
