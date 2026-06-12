(function () {
  var dock = document.querySelector("[data-quick-nav]");
  if (!dock) return;

  var toggle = document.querySelector("[data-quick-nav-toggle]");
  if (!toggle) return;

  var storageKey = "quick-nav-collapsed";

  function getStoredState() {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch (error) {
      return false;
    }
  }

  function storeState(collapsed) {
    try {
      localStorage.setItem(storageKey, collapsed ? "true" : "false");
    } catch (error) {}
  }

  function applyState(collapsed) {
    document.body.classList.toggle("quick-nav-collapsed", collapsed);
    dock.classList.toggle("is-collapsed", collapsed);
    toggle.classList.toggle("is-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
  }

  applyState(getStoredState());

  toggle.addEventListener("click", function () {
    var collapsed = !dock.classList.contains("is-collapsed");
    applyState(collapsed);
    storeState(collapsed);
  });
})();
