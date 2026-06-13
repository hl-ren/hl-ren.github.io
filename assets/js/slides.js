(function () {
  var source = document.getElementById("deck-source");
  var target = document.getElementById("deck-slides");
  if (!source || !target) return;

  function isRevealPrintPage() {
    try {
      return new URLSearchParams(window.location.search).has("print-pdf");
    } catch (error) {
      return window.location.search.indexOf("print-pdf") !== -1;
    }
  }

  function isPdfExportPage() {
    try {
      return new URLSearchParams(window.location.search).has("export-pdf");
    } catch (error) {
      return window.location.search.indexOf("export-pdf") !== -1;
    }
  }

  function shouldAutoPrintPdf() {
    try {
      return new URLSearchParams(window.location.search).has("download-pdf");
    } catch (error) {
      return window.location.search.indexOf("download-pdf") !== -1;
    }
  }

  if (isRevealPrintPage()) document.body.classList.add("is-print-pdf");
  if (isPdfExportPage()) document.body.classList.add("is-export-pdf");

  function isHandheldViewport() {
    return window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none) and (max-width: 1100px)").matches;
  }

  function syncViewportMode() {
    var handheld = isHandheldViewport();
    var portrait = handheld && window.innerHeight > window.innerWidth;
    var viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var stageScale = 1;

    if (handheld) {
      stageScale = portrait ?
        Math.min(viewportWidth / 720, viewportHeight / 1280) :
        Math.min(viewportWidth / 1280, viewportHeight / 720);
      stageScale = Math.max(0.1, Math.min(1, stageScale));
    }

    document.body.classList.toggle("is-handheld", handheld);
    document.body.classList.toggle("is-handheld-portrait", portrait);
    document.body.style.setProperty("--slide-stage-scale", String(stageScale));

    window.requestAnimationFrame(function () {
      if (window.Reveal && window.Reveal.layout) window.Reveal.layout();
      fitAllSlideContent();
      if (document.querySelector(".reveal.overview")) layoutOverviewGrid();
    });
  }

  function lockLandscapeOrientation() {
    if (!screen.orientation || !screen.orientation.lock) return;
    if (!document.fullscreenElement) return;

    screen.orientation.lock("landscape").catch(function () {});
  }

  function unlockOrientation() {
    if (!screen.orientation || !screen.orientation.unlock) return;
    try {
      screen.orientation.unlock();
    } catch (error) {}
  }

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
      subtitle: document.body.dataset.deckSubtitle || "",
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

  function clearBulletFragments(section) {
    section.querySelectorAll(".slide-content li, .slide-content").forEach(function (node) {
      if (!node.dataset.slideAutoFragment) return;
      node.classList.remove("fragment", "fade-up", "visible", "current-fragment");
      node.removeAttribute("data-fragment-index");
      delete node.dataset.slideAutoFragment;
    });
  }

  function applyBulletModeToSlide(section, mode) {
    if (section.classList.contains("title-slide") || section.classList.contains("section-slide")) return;

    clearBulletFragments(section);
    if (mode === "off") return;

    var content = section.querySelector(".slide-content");
    if (!content || content.closest(".no-fragments, [data-no-fragments]")) return;

    if (mode === "page") {
      content.classList.add("fragment", "fade-up");
      content.dataset.slideAutoFragment = "true";
      return;
    }

    Array.prototype.slice.call(content.querySelectorAll("li")).forEach(function (item) {
      if (item.closest(".no-fragments, [data-no-fragments]")) return;
      if (item.classList.contains("fragment") && !item.dataset.slideAutoFragment) return;
      item.classList.add("fragment", "fade-up");
      item.dataset.slideAutoFragment = "true";
    });
  }

  function applyBulletMode(mode) {
    var selected = mode || "item";
    document.body.dataset.slideBullets = selected;
    Array.prototype.slice.call(target.children).forEach(function (section) {
      applyBulletModeToSlide(section, selected);
    });
    document.querySelectorAll("[data-slide-bullets]").forEach(function (select) {
      select.value = selected;
    });

    if (window.Reveal && window.Reveal.sync) window.Reveal.sync();
    fitAllSlideContent();

    try {
      localStorage.setItem("slide-bullets", selected);
    } catch (error) {}
  }

  function getStoredBulletMode() {
    try {
      return localStorage.getItem("slide-bullets") || (document.body.dataset.slideBulletsDefault || "item");
    } catch (error) {
      return document.body.dataset.slideBulletsDefault || "item";
    }
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
    hero.classList.toggle("has-title-slide-subtitle", Boolean(meta.subtitle));
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
    if (meta.subtitle) hero.appendChild(createNode("title-slide-subtitle", meta.subtitle));
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
        var titleControlsSlot = document.createElement("div");
        titleControlsSlot.className = "title-slide-controls";
        content.appendChild(titleControlsSlot);
      } else {
        applyAutoColumns(content);
        if (isSectionSlide) applyCurrentSectionHighlight(content, slideTitle);
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
      section.dataset.slideTitle = slideTitle;
      section.dataset.slideTopic = topic;
      section.classList.toggle("title-slide", isTitleSlide);
      section.classList.toggle("section-slide", isSectionSlide);
      section.classList.toggle("content-slide", !isTitleSlide && !isSectionSlide && !isEndSlide);
      section.classList.toggle("end-slide", isEndSlide);
      section.appendChild(topbar);
      section.appendChild(content);
      section.appendChild(footer);
    });
  }

  function buildThumbnailTray() {
    var tray = document.createElement("nav");
    var grid = document.createElement("div");
    tray.className = "slide-thumbnails";
    tray.setAttribute("aria-label", "Slide thumbnails");
    grid.className = "slide-thumbnail-grid";

    Array.prototype.slice.call(target.children).forEach(function (section, index) {
      var button = document.createElement("button");
      var number = document.createElement("span");
      var title = document.createElement("span");
      button.type = "button";
      button.className = "slide-thumbnail";
      button.dataset.slideIndex = String(index);
      button.setAttribute("aria-label", "Go to slide " + String(index + 1));
      number.className = "slide-thumbnail-number";
      number.textContent = String(index + 1);
      title.className = "slide-thumbnail-title";
      title.textContent = section.dataset.slideTitle || "Slide";
      button.appendChild(number);
      button.appendChild(title);
      button.addEventListener("click", function () {
        if (window.Reveal && window.Reveal.slide) window.Reveal.slide(index);
        closeSettingsPanels();
        syncThumbnailState();
      });
      grid.appendChild(button);
    });

    tray.appendChild(grid);
    document.querySelector(".reveal").insertAdjacentElement("afterend", tray);
  }

  function syncThumbnailState() {
    if (!window.Reveal || !window.Reveal.getIndices) return;
    var current = window.Reveal.getIndices().h || 0;
    document.querySelectorAll(".slide-thumbnail").forEach(function (button) {
      var active = Number(button.dataset.slideIndex) === current;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function getOverviewSpacer() {
    var reveal = document.querySelector(".reveal");
    var spacer = document.querySelector(".overview-grid-spacer");
    if (!reveal) return null;

    if (!spacer) {
      spacer = document.createElement("div");
      spacer.className = "overview-grid-spacer";
      reveal.appendChild(spacer);
    }

    return spacer;
  }

  function getOverviewScale(revealWidth, slideWidth) {
    var targetWidth = revealWidth < 720 ? 180 : 340;
    var minScale = revealWidth < 720 ? 0.28 : 0.16;
    var maxScale = revealWidth < 720 ? 0.42 : 0.22;
    var scale = targetWidth / Math.max(slideWidth, 1);

    scale = Math.max(minScale, Math.min(maxScale, scale));
    return Math.min(scale, (revealWidth - 28) / Math.max(slideWidth, 1));
  }

  function layoutOverviewGrid() {
    var reveal = document.querySelector(".reveal");
    var slides = document.querySelector(".reveal .slides");
    var sections = Array.prototype.slice.call(target.children);
    if (!reveal || !slides || !sections.length || !reveal.classList.contains("overview")) return;

    document.body.classList.add("is-overview");

    var revealWidth = Math.max(reveal.clientWidth, 1);
    var revealHeight = Math.max(reveal.clientHeight, 1);
    var slideWidth = revealWidth;
    var slideHeight = revealHeight;
    var gap = revealWidth < 720 ? 10 : 18;
    var pad = revealWidth < 720 ? 10 : 18;
    var scale = getOverviewScale(revealWidth, slideWidth);
    var tileWidth = slideWidth * scale;
    var tileHeight = slideHeight * scale;
    var columns = Math.max(1, Math.floor((revealWidth - pad * 2 + gap) / (tileWidth + gap)));
    var rows = Math.ceil(sections.length / columns);
    var stepX = (tileWidth + gap) / scale;
    var stepY = (tileHeight + gap) / scale;
    var spacer = getOverviewSpacer();

    reveal.classList.add("overview-grid");
    slides.style.left = "0";
    slides.style.top = "0";
    slides.style.right = "auto";
    slides.style.bottom = "auto";
    slides.style.width = String(slideWidth) + "px";
    slides.style.height = String(slideHeight) + "px";
    slides.style.transformOrigin = "0 0";
    slides.style.transform = "scale(" + String(scale) + ")";

    sections.forEach(function (section, index) {
      var column = index % columns;
      var row = Math.floor(index / columns);
      section.dataset.overviewGrid = "true";
      section.style.width = String(slideWidth) + "px";
      section.style.height = String(slideHeight) + "px";
      section.style.transform = "translate3d(" +
        String(pad / scale + column * stepX) + "px, " +
        String(pad / scale + row * stepY) + "px, 0)";
    });

    if (spacer) {
      spacer.style.width = String(pad * 2 + columns * tileWidth + Math.max(0, columns - 1) * gap) + "px";
      spacer.style.height = String(pad * 2 + rows * tileHeight + Math.max(0, rows - 1) * gap) + "px";
    }
  }

  function resetOverviewGrid() {
    var reveal = document.querySelector(".reveal");
    var slides = document.querySelector(".reveal .slides");
    var spacer = document.querySelector(".overview-grid-spacer");

    if (reveal) reveal.classList.remove("overview-grid");
    document.body.classList.remove("is-overview");
    if (spacer) spacer.remove();
    if (slides) {
      slides.style.left = "";
      slides.style.top = "";
      slides.style.right = "";
      slides.style.bottom = "";
      slides.style.width = "";
      slides.style.height = "";
      slides.style.transformOrigin = "";
      slides.style.transform = "";
    }

    Array.prototype.slice.call(target.children).forEach(function (section) {
      if (!section.dataset.overviewGrid) return;
      section.style.width = "";
      section.style.height = "";
      delete section.dataset.overviewGrid;
    });

    window.requestAnimationFrame(function () {
      if (window.Reveal && window.Reveal.layout) window.Reveal.layout();
      fitAllSlideContent();
    });
  }

  function setupOverviewGrid() {
    if (!window.Reveal || !window.Reveal.on) return;

    window.Reveal.on("overviewshown", function () {
      window.requestAnimationFrame(layoutOverviewGrid);
    });
    window.Reveal.on("overviewhidden", resetOverviewGrid);
    window.addEventListener("resize", function () {
      if (document.querySelector(".reveal.overview")) layoutOverviewGrid();
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

  function getPdfExportUrl() {
    var url = new URL(window.location.href);
    url.searchParams.delete("print-pdf");
    url.searchParams.set("export-pdf", "");
    url.searchParams.set("download-pdf", "");
    url.hash = window.location.hash || "";
    return url.toString();
  }

  function openPdfExport() {
    closeSettingsPanels();

    var opened = window.open(getPdfExportUrl(), "_blank", "noopener");
    if (!opened) window.location.href = getPdfExportUrl();
  }

  function syncFullscreenButton() {
    var active = Boolean(document.fullscreenElement);
    document.body.classList.toggle("is-fullscreen", active);
    if (active) {
      lockLandscapeOrientation();
    } else {
      unlockOrientation();
    }
    document.querySelectorAll("[data-slide-fullscreen]").forEach(function (button) {
      button.textContent = active ? button.dataset.exitLabel : button.dataset.fullscreenLabel;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    syncViewportMode();
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

    document.querySelectorAll(".title-slide-controls").forEach(function (slot, index) {
      var controls = template.cloneNode(true);
      var panel = controls.querySelector(".deck-settings-panel");
      var button = controls.querySelector("[data-slide-settings-toggle]");
      var panelId = "deck-settings-panel-title-" + String(index + 1);

      controls.removeAttribute("data-slide-controls-template");
      if (panel) {
        panel.id = panelId;
        panel.hidden = true;
      }
      if (button) {
        button.setAttribute("aria-controls", panelId);
        button.setAttribute("aria-expanded", "false");
      }

      slot.appendChild(controls);
    });

    template.remove();
  }

  function setupDeckControls() {
    var autoplay = getStoredAutoplay();
    var bulletMode = getStoredBulletMode();
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
          document.documentElement.requestFullscreen()
            .then(lockLandscapeOrientation)
            .catch(function () {});
        }
        return;
      }

      if (event.target.closest("[data-slide-export-pdf]")) {
        openPdfExport();
        return;
      }

      if (
        document.fullscreenElement &&
        !event.target.closest("button, a, input, select, textarea, label, .deck-controls, .deck-settings-panel")
      ) {
        window.Reveal.next();
      }
    });

    document.addEventListener("change", function (event) {
      var select = event.target.closest("[data-slide-autoplay]");
      if (!select) return;
      applyAutoplay(select.value);
    });

    document.addEventListener("change", function (event) {
      var select = event.target.closest("[data-slide-bullets]");
      if (!select) return;
      applyBulletMode(select.value);
    });

    document.addEventListener("fullscreenchange", syncFullscreenButton);
    if (window.Reveal && window.Reveal.on) {
      window.Reveal.on("slidechanged", syncSlideStatus);
      window.Reveal.on("slidechanged", syncThumbnailState);
      window.Reveal.on("slidechanged", fitAllSlideContent);
      window.Reveal.on("ready", syncSlideStatus);
      window.Reveal.on("ready", syncThumbnailState);
      window.Reveal.on("ready", fitAllSlideContent);
    }
    window.addEventListener("resize", syncViewportMode);
    window.addEventListener("orientationchange", syncViewportMode);
    syncFullscreenButton();
    syncViewportMode();
    syncSlideStatus();
    syncThumbnailState();
    applyTheme(getStoredTheme());
    applyBulletMode(bulletMode);
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

  function autoPrintPdf(attempt) {
    if (!isPdfExportPage() || !shouldAutoPrintPdf()) return;

    var imagesReady = Array.prototype.slice.call(document.images).every(function (image) {
      return image.complete;
    });
    var ready = target.children.length > 0 && imagesReady;
    if (ready || attempt > 80) {
      window.setTimeout(function () {
        window.print();
      }, 200);
      return;
    }

    window.setTimeout(function () {
      autoPrintPdf(attempt + 1);
    }, 150);
  }

  function showAllFragmentsForExport() {
    document.querySelectorAll(".fragment").forEach(function (node) {
      node.classList.add("visible");
      node.classList.remove("current-fragment");
      node.removeAttribute("data-fragment-index");
    });
  }

  function preparePdfExport() {
    var template = document.querySelector("[data-slide-controls-template]");
    if (template) template.remove();

    showAllFragmentsForExport();
    applyTheme(getStoredTheme());
    ["topbar", "content", "footer"].forEach(function (region) {
      applySlideColor(region, getStoredColor(region));
    });
    fitAllSlideContent();
    typesetMath(0);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        fitAllSlideContent();
        autoPrintPdf(0);
      });
      return;
    }

    autoPrintPdf(0);
  }

  splitSlides();
  enhanceSlides();

  if (isPdfExportPage()) {
    preparePdfExport();
    return;
  }

  buildThumbnailTray();
  localizeDeckLink();
  setupThemeSwitcher();
  setupColorSwitchers();
  syncViewportMode();

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
    pdfSeparateFragments: false,
    pdfMaxPagesPerSlide: 1,
    plugins: window.RevealHighlight ? [window.RevealHighlight] : []
  }).then(function () {
    setupOverviewGrid();
    setupDeckControls();
    fitAllSlideContent();
    typesetMath(0);
    autoPrintPdf(0);
  });
})();
