// ========================================
// Server Dashboard - Theme Toggle
// ========================================

(function () {
  "use strict";
  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("dashboard-theme");
  const isDark = savedTheme === "light" ? false : true; // Default to dark

  // DOM is already updated by inline script in head, just set up toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("dashboard-theme", isDark ? "dark" : "light");
    });
  }
})();
