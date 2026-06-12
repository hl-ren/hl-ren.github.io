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
      logoAlt: document.body.dataset.deckLogoAlt || "",
      themeDefault: document.body.dataset.slideThemeDefault || "paper"
    };
  }

  function getSlideTitle(section, meta) {
    var heading = section.querySelector("h1, h2, h3");
    if (heading && heading.textContent.trim()) return heading.textContent.trim();

    return meta.title;
  }

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/^\s*(section|part|chapter)\s*\d*\s*[:：.-]?\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
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

  function applyCurrentSectionHighlight(content, sectionTitle) {
    var current = normalizeText(sectionTitle);
    if (!current) return;

    Array.prototype.slice.call(content.querySelectorAll("li")).forEach(function (item) {
      var itemText = normalizeText(item.textContent);
      item.classList.toggle("is-current-section", itemText === current || itemText.endsWith(" " + current));
    });
  }

  function buildTitleSlide(content, slideTitle, meta) {
    var originalNodes = Array.prototype.slice.call(content.childNodes);
    var elementNodes = originalNodes.filter(function (node) {
      return node.nodeType === 1 && node.textContent.trim();
    });
    var authorNode = elementNodes[0] || null;
    var authorText = authorNode ? authorNode.textContent.trim() : meta.author;
    var hero = document.createElement("div");
    var textBlock = document.createElement("div");
    var title = createNode("title-slide-heading", slideTitle);
    var author = createNode("title-slide-author", authorText);
    var info = document.createElement("div");

    hero.className = "title-slide-hero";
    textBlock.className = "title-slide-text";
    info.className = "title-slide-info";

    originalNodes.forEach(function (node) {
      if (node === authorNode) return;
      if (node.nodeType === 3 && !node.textContent.trim()) return;
      info.appendChild(node);
    });

    textBlock.appendChild(title);
    if (authorText) textBlock.appendChild(author);
    if (info.childNodes.length) textBlock.appendChild(info);
    hero.appendChild(textBlock);

    if (meta.logo) {
      var logo = document.createElement("img");
      logo.className = "title-slide-logo";
      logo.src = meta.logo;
      logo.alt = meta.logoAlt || "";
      logo.loading = "eager";
      hero.appendChild(logo);
    }

    content.replaceChildren(hero);
  }

  function getSlideTitleFontSize(section) {
    var title = section.querySelector(".slide-current-title, .title-slide-heading");
    var size = title ? parseFloat(window.getComputedStyle(title).fontSize) : 46;
    return Number.isFinite(size) ? size : 46;
  }

  function contentFits(content) {
    return content.scrollHeight <= content.clientHeight + 2 && content.scrollWidth <= content.clientWidth + 2;
  }

  function fitSlideContent(section) {
    var content = section.querySelector(".slide-content");
    if (!content || content.closest(".no-fit, [data-no-fit]")) return;

    var maxSize = Math.min(getSlideTitleFontSize(section), section.classList.contains("title-slide") ? 54 : 46);
    var minSize = 18;
    var low = minSize;
    var high = maxSize;
    var best = minSize;

    content.style.fontSize = String(high) + "px";
    if (contentFits(content)) {
      best = high;
    } else {
      for (var i = 0; i < 9; i += 1) {
        var mid = (low + high) / 2;
        content.style.fontSize = String(mid) + "px";
        if (contentFits(content)) {
          best = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
    }

    content.style.fontSize = String(Math.floor(best * 10) / 10) + "px";
    section.dataset.contentFontSize = content.style.fontSize;
  }

  function fitAllSlideContent() {
    Array.prototype.slice.call(target.children).forEach(fitSlideContent);
  }

  function enhanceSlides() {
    var meta = getDeckMeta();
    var sections = Array.prototype.slice.call(target.children);
    var total = sections.length;
    var currentSectionTitle = meta.category;

    sections.forEach(function (section, index) {
      var slideTitle = getSlideTitle(section, meta);
      var content = document.createElement("div");
      content.className = "slide-content";

      var kicker = section.querySelector(".section-kicker");
      if (kicker) kicker.remove();

      var heading = section.querySelector("h1, h2, h3");
      var headingLevel = heading ? heading.tagName.toLowerCase() : "";
      if (heading) heading.remove();

      var isTitleSlide = index === 0;
      var isEndSlide = index === total - 1 && total > 1;
      var isSectionSlide = !isTitleSlide && !isEndSlide && headingLevel === "h1";
      if (isSectionSlide) currentSectionTitle = slideTitle;
      var topic = isTitleSlide ? meta.title : isEndSlide ? currentSectionTitle : currentSectionTitle;

      Array.prototype.slice.call(section.childNodes).forEach(function (child) {
        content.appendChild(child);
      });
      if (isTitleSlide) {
        buildTitleSlide(content, slideTitle, meta);
      } else {
        applyAutoColumns(content);
        if (isSectionSlide) applyCurrentSectionHighlight(content, slideTitle);
        if (!isSectionSlide) applyListFragments(content);
      }

      var topbarTitle = isSectionSlide ? "Outline" : slideTitle;
      var topbar = document.createElement("div");
      topbar.className = "slide-topbar";
      topbar.appendChild(createNode("slide-current-title", topbarTitle));
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
      return localStorage.getItem("slide-theme") || (document.body.dataset.slideThemeDefault || "paper");
    } catch (error) {
      return document.body.dataset.slideThemeDefault || "paper";
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

  function getColorDatasetKey(region) {
    return {
      topbar: "slideTopbarColor",
      content: "slideContentColor",
      footer: "slideFooterColor"
    }[region];
  }

  function getColorDefault(region) {
    var defaults = {
      topbar: document.body.dataset.slideTopbarDefault,
      content: document.body.dataset.slideContentDefault,
      footer: document.body.dataset.slideFooterDefault
    };
    return defaults[region] || "default";
  }

  function getStoredColor(region) {
    try {
      return localStorage.getItem("slide-" + region + "-color") || getColorDefault(region);
    } catch (error) {
      return getColorDefault(region);
    }
  }

  function applySlideColor(region, value) {
    var key = getColorDatasetKey(region);
    if (!key) return;

    var selected = value || "default";
    document.body.dataset[key] = selected;
    document.querySelectorAll('[data-slide-color-select="' + region + '"]').forEach(function (select) {
      select.value = selected;
    });

    try {
      localStorage.setItem("slide-" + region + "-color", selected);
    } catch (error) {}
  }

  function setupColorSwitchers() {
    ["topbar", "content", "footer"].forEach(function (region) {
      applySlideColor(region, getStoredColor(region));
    });

    document.addEventListener("change", function (event) {
      var select = event.target.closest("[data-slide-color-select]");
      if (!select) return;
      applySlideColor(select.dataset.slideColorSelect, select.value);
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
      window.Reveal.on("slidechanged", fitAllSlideContent);
      window.Reveal.on("ready", syncSlideStatus);
      window.Reveal.on("ready", fitAllSlideContent);
    }
    window.addEventListener("resize", fitAllSlideContent);
    syncFullscreenButton();
    syncSlideStatus();
    applyTheme(getStoredTheme());
    applyAutoplay(autoplay);
  }

  function typesetMath(attempt) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([target]).then(fitAllSlideContent).catch(function () {
        fitAllSlideContent();
      });
      return;
    }
    if (attempt < 20) window.setTimeout(function () { typesetMath(attempt + 1); }, 120);
  }

  splitSlides();
  enhanceSlides();
  localizeDeckLink();
  setupThemeSwitcher();
  setupColorSwitchers();

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
    fitAllSlideContent();
    typesetMath(0);
  });
})();
