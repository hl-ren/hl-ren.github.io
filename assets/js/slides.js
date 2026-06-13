(function () {
  var source = document.getElementById("deck-source");
  var target = document.getElementById("deck-slides");
  if (!source || !target) return;

  var SELECTORS = {
    reveal: ".reveal",
    controlsTemplate: "[data-slide-controls-template]",
    settingsPanel: ".deck-settings-panel",
    settingsToggle: "[data-slide-settings-toggle]",
    thumbnail: ".slide-thumbnail",
    slideSection: "#deck-slides > section",
    overviewReveal: ".reveal.overview",
    overviewSlide: "#deck-slides > section[data-overview-grid]"
  };

  var STORAGE_KEYS = {
    theme: "slide-theme",
    aspect: "slide-aspect",
    bullets: "slide-bullets",
    autoplay: "slide-autoplay"
  };

  var deckState = {
    meta: null,
    total: 0,
    currentIndex: 0
  };

  function hasQueryFlag(name) {
    try {
      return new URLSearchParams(window.location.search).has(name);
    } catch (error) {
      return window.location.search.indexOf(name) !== -1;
    }
  }

  function isRevealPrintPage() {
    return hasQueryFlag("print-pdf");
  }

  function isPdfExportPage() {
    return hasQueryFlag("export-pdf");
  }

  function shouldAutoPrintPdf() {
    return hasQueryFlag("download-pdf");
  }

  var Preferences = {
    read: function (key, fallback) {
      try {
        return localStorage.getItem(key) || fallback;
      } catch (error) {
        return fallback;
      }
    },

    write: function (key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {}
    },

    syncSelect: function (selector, value) {
      document.querySelectorAll(selector).forEach(function (select) {
        select.value = value;
      });
    }
  };

  var Slides = {
    all: function () {
      return Array.prototype.slice.call(target.children);
    },

    count: function () {
      return deckState.total || target.children.length || 1;
    },

    currentIndex: function () {
      if (!window.Reveal || !window.Reveal.getIndices) return deckState.currentIndex || 0;
      return window.Reveal.getIndices().h || 0;
    },

    normalizeIndex: function (index) {
      var total = Slides.count();
      return ((index % total) + total) % total;
    }
  };

  if (isRevealPrintPage()) document.body.classList.add("is-print-pdf");
  if (isPdfExportPage()) document.body.classList.add("is-export-pdf");

  function isHandheldViewport() {
    return window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none) and (max-width: 1100px)").matches;
  }

  function getCssPixelValue(name, fallback) {
    var value = window.getComputedStyle(document.body).getPropertyValue(name);
    var parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getSlideStageSize() {
    return {
      width: getCssPixelValue("--slide-print-width", 1280),
      height: getCssPixelValue("--slide-print-height", 720)
    };
  }

  function syncViewportMode() {
    var handheld = isHandheldViewport();
    var viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var fullscreen = Boolean(document.fullscreenElement);
    var portrait = handheld && fullscreen && window.innerHeight > window.innerWidth;
    var thumbnailHeight = getCssPixelValue("--slide-thumbnails-height", 142);
    var thumbnailsVisible = !fullscreen && !handheld;
    var availableHeight = Math.max(1, viewportHeight - (thumbnailsVisible ? thumbnailHeight : 0));
    var stageSize = getSlideStageSize();
    var stageWidth = portrait ? stageSize.height : stageSize.width;
    var stageHeight = portrait ? stageSize.width : stageSize.height;
    var stageScale = 1;

    stageScale = Math.min(viewportWidth / stageWidth, availableHeight / stageHeight);
    stageScale = Math.max(0.1, Math.min(2, stageScale));

    document.body.classList.toggle("is-scaled-stage", !isRevealPrintPage() && !isPdfExportPage());
    document.body.classList.toggle("is-handheld", handheld);
    document.body.classList.toggle("is-handheld-portrait", portrait);
    document.body.style.setProperty("--slide-stage-scale", String(stageScale));
    document.body.style.setProperty("--slide-stage-left", String(viewportWidth / 2) + "px");
    document.body.style.setProperty("--slide-stage-top", String(availableHeight / 2) + "px");

    window.requestAnimationFrame(function () {
      if (window.Reveal && window.Reveal.layout) window.Reveal.layout();
      fitAllSlideContent();
      if (document.querySelector(SELECTORS.overviewReveal)) layoutOverviewGrid();
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
    if (deckState.meta) return deckState.meta;

    deckState.meta = {
      title: document.body.dataset.deckTitle || document.title || "Slides",
      subtitle: document.body.dataset.deckSubtitle || "",
      author: document.body.dataset.deckAuthor || "",
      category: document.body.dataset.deckCategory || "Slides",
      logo: document.body.dataset.deckLogo || "",
      logoAlt: document.body.dataset.deckLogoAlt || "",
      themeDefault: document.body.dataset.slideThemeDefault || "paper"
    };

    return deckState.meta;
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
    Slides.all().forEach(function (section) {
      applyBulletModeToSlide(section, selected);
    });
    Preferences.syncSelect("[data-slide-bullets]", selected);

    if (window.Reveal && window.Reveal.sync) window.Reveal.sync();
    fitAllSlideContent();

    Preferences.write(STORAGE_KEYS.bullets, selected);
  }

  function getStoredBulletMode() {
    return Preferences.read(STORAGE_KEYS.bullets, document.body.dataset.slideBulletsDefault || "item");
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

  function hasDenseSlideContent(content) {
    return Boolean(content.querySelector(
      ".slide-columns, .slide-auto-columns, .equation-box, .slide-env, " +
      "mjx-container, table, pre, img, video"
    ));
  }

  function fitSlideContent(section) {
    var content = section.querySelector(".slide-content");
    if (!content || content.closest(".no-fit, [data-no-fit]")) return;

    var sectionRect = section.getBoundingClientRect();
    var sectionWidth = section.clientWidth || sectionRect.width || 1280;
    var sectionHeight = section.clientHeight || sectionRect.height || 720;
    var hasColumns = Boolean(content.querySelector(".slide-columns, .slide-auto-columns"));
    var hasDenseContent = hasDenseSlideContent(content);
    var pageBase = Math.min(sectionWidth / 27.826, sectionHeight / 15.652);
    var maxRatio = section.classList.contains("title-slide") ? 0.075 : 0.064;
    var minRatio = hasDenseContent ? 0.018 : 0.025;
    if (hasColumns) {
      maxRatio = Math.min(maxRatio, 0.044);
      pageBase *= 0.72;
    }
    var maxSize = Math.min(
      getSlideTitleFontSize(section),
      sectionHeight * maxRatio,
      pageBase
    );
    var minSize = Math.max(hasDenseContent ? 10 : 14, Math.min(sectionHeight * minRatio, maxSize));
    var low = minSize;
    var high = maxSize;
    var best = minSize;

    content.classList.remove("is-overflowing");
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
    content.classList.toggle("is-overflowing", !contentFits(content));
    section.dataset.contentFontSize = content.style.fontSize;
  }

  function fitAllSlideContent() {
    Slides.all().forEach(fitSlideContent);
  }

  function scheduleFitAllSlideContent(delay) {
    window.setTimeout(fitAllSlideContent, delay || 0);
  }

  function bindDynamicContentFit() {
    Array.prototype.slice.call(target.querySelectorAll("img")).forEach(function (image) {
      if (image.dataset.slideFitBound) return;
      image.dataset.slideFitBound = "true";
      image.addEventListener("load", function () {
        scheduleFitAllSlideContent(0);
      });
    });

    Array.prototype.slice.call(target.querySelectorAll("video")).forEach(function (video) {
      if (video.dataset.slideFitBound) return;
      video.dataset.slideFitBound = "true";
      video.addEventListener("loadedmetadata", function () {
        scheduleFitAllSlideContent(0);
      });
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        scheduleFitAllSlideContent(0);
      });
    }
  }

  function enhanceSlides() {
    var meta = getDeckMeta();
    var sections = Slides.all();
    var total = sections.length;
    var currentSectionTitle = meta.category;
    deckState.total = total;

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

    Slides.all().forEach(function (section, index) {
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
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        goToSlide(index);
        closeSettingsPanels();
        syncThumbnailState();
      });
      grid.appendChild(button);
    });

    tray.appendChild(grid);
    document.querySelector(SELECTORS.reveal).insertAdjacentElement("afterend", tray);
  }

  function syncThumbnailState() {
    var current = Slides.currentIndex();
    document.querySelectorAll(SELECTORS.thumbnail).forEach(function (button) {
      var active = Number(button.dataset.slideIndex) === current;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function getOverviewSpacer() {
    var reveal = document.querySelector(SELECTORS.reveal);
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
    var reveal = document.querySelector(SELECTORS.reveal);
    var slides = document.querySelector(SELECTORS.reveal + " .slides");
    var sections = Slides.all();
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
    var reveal = document.querySelector(SELECTORS.reveal);
    var slides = document.querySelector(SELECTORS.reveal + " .slides");
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

    Slides.all().forEach(function (section) {
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
      if (document.querySelector(SELECTORS.overviewReveal)) layoutOverviewGrid();
    });
  }

  function localizeDeckLink() {
    var link = document.querySelector(".deck-home");
    if (!link) return;

    var lang = Preferences.read("site-language", "zh");

    link.textContent = lang === "en" ? link.dataset.i18nEn : link.dataset.i18nZh;
  }

  function getStoredTheme() {
    return Preferences.read(STORAGE_KEYS.theme, document.body.dataset.slideThemeDefault || "paper");
  }

  function applyTheme(theme) {
    var selected = theme || "paper";
    document.body.dataset.slideTheme = selected;
    Preferences.syncSelect("[data-slide-theme-select]", selected);

    Preferences.write(STORAGE_KEYS.theme, selected);
  }

  function normalizeAspect(value) {
    return value === "4:3" ? "4:3" : "16:9";
  }

  function getStoredAspect() {
    return normalizeAspect(Preferences.read(STORAGE_KEYS.aspect, document.body.dataset.slideAspectDefault || "16:9"));
  }

  function applyAspect(aspect) {
    var selected = normalizeAspect(aspect);
    document.body.dataset.slideAspect = selected;
    Preferences.syncSelect("[data-slide-aspect-select]", selected);

    if (window.Reveal && window.Reveal.layout) window.Reveal.layout();
    syncViewportMode();
    fitAllSlideContent();
    if (document.querySelector(SELECTORS.overviewReveal)) layoutOverviewGrid();

    Preferences.write(STORAGE_KEYS.aspect, selected);
  }

  function setupAspectSwitcher() {
    applyAspect(getStoredAspect());

    document.addEventListener("change", function (event) {
      var select = event.target.closest("[data-slide-aspect-select]");
      if (!select) return;
      applyAspect(select.value);
    });
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
    return Preferences.read("slide-" + region + "-color", getColorDefault(region));
  }

  function applySlideColor(region, value) {
    var key = getColorDatasetKey(region);
    if (!key) return;

    var selected = value || "default";
    document.body.dataset[key] = selected;
    document.querySelectorAll('[data-slide-color-select="' + region + '"]').forEach(function (select) {
      select.value = selected;
    });

    Preferences.write("slide-" + region + "-color", selected);
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
    return Preferences.read(STORAGE_KEYS.autoplay, "0");
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

    Preferences.write(STORAGE_KEYS.autoplay, String(interval));
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
      button.setAttribute("aria-label", active ? button.dataset.exitLabel : button.dataset.fullscreenLabel);
    });
    syncViewportMode();
  }

  function syncSlideStatus() {
    var status = document.querySelector("[data-slide-status]");
    if (!status || !window.Reveal || !window.Reveal.getIndices) return;
    var total = Slides.count();
    var current = Slides.currentIndex() + 1;
    deckState.currentIndex = current - 1;
    status.textContent = String(current) + " / " + String(total);
  }

  function syncSlideHash(index) {
    if (!window.history || !window.history.replaceState) return;

    var hash = index > 0 ? "#/" + String(index) : "";
    var nextUrl = window.location.pathname + window.location.search + hash;
    window.history.replaceState(null, "", nextUrl);
  }

  function closeSettingsPanels() {
    document.querySelectorAll(".deck-controls").forEach(function (controls) {
      var panel = controls.querySelector(SELECTORS.settingsPanel);
      var button = controls.querySelector(SELECTORS.settingsToggle);
      if (!panel || !button) return;
      panel.hidden = true;
      button.classList.remove("is-active");
      button.setAttribute("aria-expanded", "false");
    });
  }

  function toggleSettings(button, forceOpen) {
    var controls = button && button.closest(".deck-controls");
    var panel = controls && controls.querySelector(SELECTORS.settingsPanel);
    if (!panel || !button) return;

    var open = typeof forceOpen === "boolean" ? forceOpen : panel.hasAttribute("hidden");
    closeSettingsPanels();
    panel.hidden = !open;
    button.classList.toggle("is-active", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function shouldIgnoreSlideClick(event) {
    return Boolean(event.target.closest(
      "button, a, input, select, textarea, label, summary, " +
      "video, audio, iframe, pre, code, table, " +
      ".deck-controls, .deck-settings-panel, .slide-thumbnail-grid"
    ));
  }

  function goToPreviousSlide() {
    if (!window.Reveal) return;
    var current = Slides.currentIndex();
    if (current <= 0) {
      goToSlide(Slides.count() - 1);
      return;
    }
    window.Reveal.prev();
  }

  function goToNextSlide() {
    if (!window.Reveal) return;

    var current = Slides.currentIndex();
    var total = Slides.count();
    if (current >= total - 1) {
      goToSlide(0);
      return;
    }

    window.Reveal.next();
  }

  function goToSlide(index) {
    if (!window.Reveal || !window.Reveal.slide) return;

    var nextIndex = Slides.normalizeIndex(index);
    deckState.currentIndex = nextIndex;
    window.Reveal.slide(nextIndex);
    syncSlideHash(nextIndex);
    syncSlideStatus();
    syncThumbnailState();
  }

  function navigateBySlideClick(event) {
    if (!window.Reveal || shouldIgnoreSlideClick(event)) return;
    if (document.querySelector(SELECTORS.overviewReveal)) return;

    var reveal = document.querySelector(SELECTORS.reveal);
    if (!reveal) return;

    var revealRect = reveal.getBoundingClientRect();
    var insideReveal = event.clientX >= revealRect.left &&
      event.clientX <= revealRect.right &&
      event.clientY >= revealRect.top &&
      event.clientY <= revealRect.bottom;
    if (!insideReveal) return;

    if (event.clientX < revealRect.left + revealRect.width / 2) {
      goToPreviousSlide();
    } else {
      goToNextSlide();
    }
  }

  function closeOverview() {
    if (!window.Reveal) return;
    if (window.Reveal.toggleOverview) {
      window.Reveal.toggleOverview(false);
      return;
    }
    resetOverviewGrid();
  }

  function handleOverviewGridClick(event) {
    var reveal = document.querySelector(SELECTORS.overviewReveal);
    if (!reveal || !window.Reveal || !window.Reveal.slide) return;

    var section = event.target.closest(SELECTORS.overviewSlide);
    if (!section) return;

    var sections = Slides.all();
    var index = sections.indexOf(section);
    if (index < 0) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    goToSlide(index);
    closeOverview();
  }

  function handleLoopingKeyboard(event) {
    if (!window.Reveal || !window.Reveal.getIndices) return;
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("input, select, textarea, [contenteditable='true']")) return;

    var key = event.key;
    var current = Slides.currentIndex();
    var total = Slides.count();
    var wantsPrevious = key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp";
    var wantsNext = key === "ArrowRight" || key === "ArrowDown" || key === "PageDown" || key === " ";

    if (wantsPrevious && current <= 0) {
      event.preventDefault();
      event.stopPropagation();
      goToSlide(total - 1);
      return;
    }

    if (wantsNext && current >= total - 1) {
      event.preventDefault();
      event.stopPropagation();
      goToSlide(0);
    }
  }

  function attachDeckControls() {
    var template = document.querySelector(SELECTORS.controlsTemplate);
    if (!template) return;

    document.querySelectorAll(".slide-footer-actions").forEach(function (slot, index) {
      var controls = template.cloneNode(true);
      var panel = controls.querySelector(SELECTORS.settingsPanel);
      var button = controls.querySelector(SELECTORS.settingsToggle);
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
      var panel = controls.querySelector(SELECTORS.settingsPanel);
      var button = controls.querySelector(SELECTORS.settingsToggle);
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
        goToPreviousSlide();
        return;
      }

      if (event.target.closest("[data-slide-next]")) {
        goToNextSlide();
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

      navigateBySlideClick(event);
    });

    document.addEventListener("click", handleOverviewGridClick, true);
    document.addEventListener("keydown", handleLoopingKeyboard, true);

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
    var template = document.querySelector(SELECTORS.controlsTemplate);
    if (template) template.remove();

    showAllFragmentsForExport();
    applyAspect(getStoredAspect());
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
  setupAspectSwitcher();
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
    bindDynamicContentFit();
    autoPrintPdf(0);
  });
})();
