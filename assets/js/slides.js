(function () {
  var source = document.getElementById("deck-source");
  var target = document.getElementById("deck-slides");
  if (!source || !target) return;

  function hasContent(section) {
    return section.textContent.trim() || section.querySelector("img, video, iframe, table, pre");
  }

  function appendSection(section) {
    if (!hasContent(section)) return;
    target.appendChild(section);
  }

  function splitSlides() {
    var section = document.createElement("section");
    var nodes = Array.prototype.slice.call(source.content.childNodes);

    nodes.forEach(function (node) {
      if (node.nodeType === 1 && node.tagName.toLowerCase() === "hr") {
        appendSection(section);
        section = document.createElement("section");
        return;
      }
      section.appendChild(node.cloneNode(true));
    });

    appendSection(section);

    if (!target.children.length) {
      var fallback = document.createElement("section");
      fallback.innerHTML = "<h1>Untitled deck</h1>";
      target.appendChild(fallback);
    }
  }

  function localizeDeckLink() {
    var link = document.querySelector(".deck-home");
    if (!link) return;

    var lang = "zh";
    try {
      lang = localStorage.getItem("site-language") || "zh";
    } catch (error) {}

    link.textContent = lang === "en" ? link.dataset.i18nEn : link.dataset.i18nZh;
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem("slide-theme") || "paper";
    } catch (error) {
      return "paper";
    }
  }

  function applyTheme(theme) {
    var selected = theme || "paper";
    document.body.dataset.slideTheme = selected;
    document.querySelectorAll(".deck-theme-switcher [data-slide-theme]").forEach(function (button) {
      var active = button.dataset.slideTheme === selected;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    try {
      localStorage.setItem("slide-theme", selected);
    } catch (error) {}
  }

  function setupThemeSwitcher() {
    applyTheme(getStoredTheme());

    document.addEventListener("click", function (event) {
      var button = event.target.closest(".deck-theme-switcher [data-slide-theme]");
      if (!button) return;
      applyTheme(button.dataset.slideTheme);
    });
  }

  function typesetMath(attempt) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([target]);
      return;
    }
    if (attempt < 20) window.setTimeout(function () { typesetMath(attempt + 1); }, 120);
  }

  splitSlides();
  localizeDeckLink();
  setupThemeSwitcher();

  Reveal.initialize({
    hash: true,
    controls: true,
    progress: true,
    center: true,
    slideNumber: true,
    transition: "slide",
    width: 1280,
    height: 720,
    margin: 0.06,
    minScale: 0.2,
    maxScale: 1.6,
    plugins: window.RevealHighlight ? [window.RevealHighlight] : []
  }).then(function () {
    typesetMath(0);
  });
})();
