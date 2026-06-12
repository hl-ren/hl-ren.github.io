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

  function getDeckMeta() {
    return {
      title: document.body.dataset.deckTitle || document.title || "Slides",
      author: document.body.dataset.deckAuthor || "",
      category: document.body.dataset.deckCategory || "Slides",
      logo: document.body.dataset.deckLogo || "",
      logoAlt: document.body.dataset.deckLogoAlt || ""
    };
  }

  function getSlideTopic(section, meta) {
    var kicker = section.querySelector(".section-kicker");
    if (kicker && kicker.textContent.trim()) return kicker.textContent.trim();

    var heading = section.querySelector("h1, h2, h3");
    if (heading && heading.textContent.trim()) return heading.textContent.trim();

    return meta.category;
  }

  function getSlideTitle(section, meta) {
    var heading = section.querySelector("h1, h2, h3");
    if (heading && heading.textContent.trim()) return heading.textContent.trim();

    return meta.title;
  }

  function createNode(className, text) {
    var node = document.createElement("div");
    node.className = className;
    node.textContent = text;
    return node;
  }

  function isHeading(node, level) {
    return node.nodeType === 1 && node.tagName.toLowerCase() === level;
  }

  function applyAutoColumns(content) {
    if (content.querySelector(".slide-columns")) return;

    var nodes = Array.prototype.slice.call(content.childNodes);
    var columnHeadings = nodes.filter(function (node) {
      return isHeading(node, "h3");
    });
    if (columnHeadings.length < 2) return;

    var beforeColumns = document.createDocumentFragment();
    var columns = document.createElement("div");
    var currentColumn = null;
    var startedColumns = false;
    columns.className = "slide-columns slide-auto-columns";

    nodes.forEach(function (node) {
      if (isHeading(node, "h3")) {
        startedColumns = true;
        currentColumn = document.createElement("div");
        currentColumn.className = "slide-auto-column";
        columns.appendChild(currentColumn);
        currentColumn.appendChild(node);
        return;
      }

      if (startedColumns && currentColumn) {
        currentColumn.appendChild(node);
        return;
      }

      beforeColumns.appendChild(node);
    });

    content.appendChild(beforeColumns);
    content.appendChild(columns);
  }

  function applyListFragments(content) {
    Array.prototype.slice.call(content.querySelectorAll("li")).forEach(function (item) {
      if (item.classList.contains("fragment")) return;
      if (item.closest(".no-fragments, [data-no-fragments]")) return;
      item.classList.add("fragment", "fade-up");
    });
  }

  function enhanceSlides() {
    var meta = getDeckMeta();
    var sections = Array.prototype.slice.call(target.children);
    var total = sections.length;

    sections.forEach(function (section, index) {
      var topic = getSlideTopic(section, meta);
      var slideTitle = getSlideTitle(section, meta);
      var content = document.createElement("div");
      content.className = "slide-content";

      var kicker = section.querySelector(".section-kicker");
      if (kicker) kicker.remove();

      var heading = section.querySelector("h1, h2, h3");
      var headingLevel = heading ? heading.tagName.toLowerCase() : "";
      if (heading) heading.remove();

      Array.prototype.slice.call(section.childNodes).forEach(function (child) {
        content.appendChild(child);
      });
      applyAutoColumns(content);
      applyListFragments(content);

      var topbar = document.createElement("div");
      topbar.className = "slide-topbar";
      topbar.appendChild(createNode("slide-current-title", slideTitle));
      if (meta.logo) {
        var logo = document.createElement("img");
        logo.className = "slide-logo";
        logo.src = meta.logo;
        logo.alt = meta.logoAlt || "";
        logo.loading = "eager";
        topbar.appendChild(logo);
      }

      var footer = document.createElement("div");
      footer.className = "slide-footer";
      var footerLeft = document.createElement("div");
      footerLeft.className = "slide-footer-cell slide-author";
      footerLeft.textContent = meta.author;

      var footerCenter = document.createElement("div");
      footerCenter.className = "slide-footer-cell slide-topic";
      footerCenter.textContent = topic;

      var footerRight = document.createElement("div");
      footerRight.className = "slide-footer-cell slide-footer-actions";
      footerRight.appendChild(createNode("slide-page-number", String(index + 1) + " / " + String(total)));

      footer.appendChild(footerLeft);
      footer.appendChild(footerCenter);
      footer.appendChild(footerRight);

      var isTitleSlide = index === 0;
      var isEndSlide = index === total - 1 && total > 1;
      var isSectionSlide = !isTitleSlide && !isEndSlide && headingLevel === "h1";
      section.dataset.slideKind = isTitleSlide ? "title" : isEndSlide ? "end" : isSectionSlide ? "section" : "content";
      section.classList.toggle("title-slide", isTitleSlide);
      section.classList.toggle("section-slide", isSectionSlide);
      section.classList.toggle("content-slide", !isTitleSlide && !isSectionSlide && !isEndSlide);
      section.classList.toggle("end-slide", isEndSlide);
      section.appendChild(topbar);
      section.appendChild(content);
      section.appendChild(footer);
    });
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
    document.querySelectorAll("[data-slide-theme-select]").forEach(function (select) {
      select.value = selected;
    });

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
    document.querySelectorAll("[data-slide-autoplay]").forEach(function (select) {
      select.value = String(interval);
    });
    if (window.Reveal && window.Reveal.configure) {
      window.Reveal.configure({ autoSlide: interval });
    }

    try {
      localStorage.setItem("slide-autoplay", String(interval));
    } catch (error) {}
  }

  function syncFullscreenButton() {
    var active = Boolean(document.fullscreenElement);
    document.querySelectorAll("[data-slide-fullscreen]").forEach(function (button) {
      button.textContent = active ? button.dataset.exitLabel : button.dataset.fullscreenLabel;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function syncSlideStatus() {
    var status = document.querySelector("[data-slide-status]");
    if (!status || !window.Reveal || !window.Reveal.getIndices) return;
    var total = target.children.length || 1;
    var current = window.Reveal.getIndices().h + 1;
    status.textContent = String(current) + " / " + String(total);
  }

  function closeSettingsPanels() {
    document.querySelectorAll(".deck-controls").forEach(function (controls) {
      var panel = controls.querySelector(".deck-settings-panel");
      var button = controls.querySelector("[data-slide-settings-toggle]");
      if (!panel || !button) return;
      panel.hidden = true;
      button.classList.remove("is-active");
      button.setAttribute("aria-expanded", "false");
    });
  }

  function toggleSettings(button, forceOpen) {
    var controls = button && button.closest(".deck-controls");
    var panel = controls && controls.querySelector(".deck-settings-panel");
    if (!panel || !button) return;

    var open = typeof forceOpen === "boolean" ? forceOpen : panel.hasAttribute("hidden");
    closeSettingsPanels();
    panel.hidden = !open;
    button.classList.toggle("is-active", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function attachDeckControls() {
    var template = document.querySelector("[data-slide-controls-template]");
    if (!template) return;

    document.querySelectorAll(".slide-footer-actions").forEach(function (slot, index) {
      var controls = template.cloneNode(true);
      var panel = controls.querySelector(".deck-settings-panel");
      var button = controls.querySelector("[data-slide-settings-toggle]");
      var panelId = "deck-settings-panel-" + String(index + 1);

      controls.removeAttribute("data-slide-controls-template");
      if (panel) {
        panel.id = panelId;
        panel.hidden = true;
      }
      if (button) {
        button.setAttribute("aria-controls", panelId);
        button.setAttribute("aria-expanded", "false");
      }

      slot.insertBefore(controls, slot.firstChild);
    });

    template.remove();
  }

  function setupDeckControls() {
    var autoplay = getStoredAutoplay();
    attachDeckControls();

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-slide-prev]")) {
        window.Reveal.prev();
        return;
      }

      if (event.target.closest("[data-slide-next]")) {
        window.Reveal.next();
        return;
      }

      var settingsButton = event.target.closest("[data-slide-settings-toggle]");
      if (settingsButton) {
        toggleSettings(settingsButton);
        return;
      }

      if (!event.target.closest(".deck-controls")) {
        closeSettingsPanels();
      }

      if (event.target.closest("[data-slide-fullscreen]")) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(function () {});
        } else {
          document.documentElement.requestFullscreen().catch(function () {});
        }
        return;
      }
    });

    document.addEventListener("change", function (event) {
      var select = event.target.closest("[data-slide-autoplay]");
      if (!select) return;
      applyAutoplay(select.value);
    });

    document.addEventListener("fullscreenchange", syncFullscreenButton);
    if (window.Reveal && window.Reveal.on) {
      window.Reveal.on("slidechanged", syncSlideStatus);
      window.Reveal.on("ready", syncSlideStatus);
    }
    syncFullscreenButton();
    syncSlideStatus();
    applyTheme(getStoredTheme());
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
  enhanceSlides();
  localizeDeckLink();
  setupThemeSwitcher();

  Reveal.initialize({
    hash: true,
    controls: false,
    progress: true,
    center: false,
    slideNumber: false,
    transition: "slide",
    width: "100%",
    height: "100%",
    margin: 0,
    minScale: 0.2,
    maxScale: 1.6,
    plugins: window.RevealHighlight ? [window.RevealHighlight] : []
  }).then(function () {
    setupDeckControls();
    typesetMath(0);
  });
})();
