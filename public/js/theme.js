// ========================================
// Server Dashboard - Theme Toggle
// ========================================

(function () {
  "use strict";
  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("dashboard-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      localStorage.setItem("dashboard-theme", isDark ? "dark" : "light");
    });
  }
})();
