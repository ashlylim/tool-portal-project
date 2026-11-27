// Light/dark theme toggle, shared by every page.
// The default is light. A visitor's choice is remembered in localStorage
// (small per-site storage in the browser). If storage is blocked, the
// toggle still works for the current page.
(function () {
  var root = document.documentElement;
  var button = document.getElementById("theme-toggle");
  if (!button) return;

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  // The button is labelled "Dark theme"; aria-pressed tells screen readers
  // whether it is currently on.
  function updateButton() {
    button.setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false");
  }

  button.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      // Storage unavailable (e.g. private mode): ignore.
    }
    updateButton();
  });

  updateButton();
})();
