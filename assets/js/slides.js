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
    var select = document.querySelector("[data-slide-theme-select]");
    if (select) select.value = selected;

    try {
      localStorage.setItem("slide-theme", selected);
    } catch (error) {}
  }

  function setupThemeSwitcher() {
    applyTheme(getStoredTheme());

    document.addEventListener("change", function (event) {
      var select = event.target.closest("[data-slide-theme-select]");
      if (!select) return;
      applyTheme(select.value);
    });
  }

  function getStoredAutoplay() {
    try {
      return localStorage.getItem("slide-autoplay") || "0";
    } catch (error) {
      return "0";
    }
  }

  function applyAutoplay(value) {
    var selected = value || "0";
    var interval = parseInt(selected, 10) || 0;
    var select = document.querySelector("[data-slide-autoplay]");
    if (select) select.value = String(interval);
    if (window.Reveal && window.Reveal.configure) {
      window.Reveal.configure({ autoSlide: interval });
    }

    try {
      localStorage.setItem("slide-autoplay", String(interval));
    } catch (error) {}
  }

  function syncFullscreenButton() {
    var button = document.querySelector("[data-slide-fullscreen]");
    if (!button) return;
    var active = Boolean(document.fullscreenElement);
    button.textContent = active ? button.dataset.exitLabel : button.dataset.fullscreenLabel;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }

  function setupDeckControls() {
    var autoplay = getStoredAutoplay();

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-slide-prev]")) {
        window.Reveal.prev();
        return;
      }

      if (event.target.closest("[data-slide-next]")) {
        window.Reveal.next();
        return;
      }

      if (event.target.closest("[data-slide-fullscreen]")) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(function () {});
        } else {
          document.documentElement.requestFullscreen().catch(function () {});
        }
      }
    });

    document.addEventListener("change", function (event) {
      var select = event.target.closest("[data-slide-autoplay]");
      if (!select) return;
      applyAutoplay(select.value);
    });

    document.addEventListener("fullscreenchange", syncFullscreenButton);
    syncFullscreenButton();
    applyAutoplay(autoplay);
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
    controls: false,
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
    setupDeckControls();
    typesetMath(0);
  });
})();
