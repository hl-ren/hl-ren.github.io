(function () {
  var mdFile = null;
  var assetFiles = [];
  var objectUrls = [];

  var ui = {
    shell: document.querySelector("[data-local-player]"),
    deckInput: document.querySelector("[data-local-deck-input]"),
    assetInput: document.querySelector("[data-local-assets-input]"),
    openButton: document.querySelector("[data-local-open]"),
    deckName: document.querySelector("[data-local-deck-name]"),
    assetCount: document.querySelector("[data-local-asset-count]"),
    status: document.querySelector("[data-local-status]"),
    dropZone: document.querySelector("[data-local-drop]")
  };

  if (!ui.shell || !ui.deckInput || !ui.openButton) return;

  function setStatus(text, isError) {
    if (!ui.status) return;
    ui.status.textContent = text || "";
    ui.status.classList.toggle("is-error", Boolean(isError));
  }

  function revokeObjectUrls() {
    objectUrls.forEach(function (url) {
      URL.revokeObjectURL(url);
    });
    objectUrls = [];
  }

  function isMarkdownFile(file) {
    return /\.md(?:own)?$/i.test(file.name);
  }

  function isAssetFile(file) {
    return !isMarkdownFile(file) && !/^\./.test(file.name);
  }

  function normalizePath(path) {
    return String(path || "")
      .replace(/\\/g, "/")
      .replace(/^\.?\//, "")
      .replace(/^\/+/, "");
  }

  function pathVariants(path) {
    var normalized = normalizePath(path);
    var parts = normalized.split("/").filter(Boolean);
    var variants = [normalized];

    if (parts.length > 1) variants.push(parts.slice(1).join("/"));
    if (parts.length > 2) variants.push(parts.slice(2).join("/"));
    if (parts.length) variants.push(parts[parts.length - 1]);

    return variants.filter(Boolean);
  }

  function createAssetMap(files) {
    var map = new Map();

    files.forEach(function (file) {
      var url = URL.createObjectURL(file);
      objectUrls.push(url);

      pathVariants(file.webkitRelativePath || file.name).forEach(function (variant) {
        if (!map.has(variant)) map.set(variant, url);
      });
      if (!map.has(file.name)) map.set(file.name, url);
    });

    return map;
  }

  function stripFrontMatter(markdown) {
    var match = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
    if (!match) return { meta: {}, body: markdown };

    return {
      meta: parseFrontMatter(match[1]),
      body: match[2]
    };
  }

  function parseFrontMatter(source) {
    var meta = {};
    var currentKey = "";

    source.split(/\r?\n/).forEach(function (line) {
      var keyValue = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (keyValue) {
        currentKey = keyValue[1];
        meta[currentKey] = parseYamlValue(keyValue[2]);
        return;
      }

      var listItem = line.match(/^\s*-\s*(.*)$/);
      if (currentKey && listItem) {
        if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
        meta[currentKey].push(parseYamlValue(listItem[1]));
      }
    });

    return meta;
  }

  function parseYamlValue(value) {
    var text = String(value || "").trim();
    if (!text) return "";
    if ((text[0] === "\"" && text[text.length - 1] === "\"") ||
        (text[0] === "'" && text[text.length - 1] === "'")) {
      return text.slice(1, -1);
    }
    if (text[0] === "[" && text[text.length - 1] === "]") {
      return text.slice(1, -1).split(",").map(function (item) {
        return parseYamlValue(item);
      }).filter(Boolean);
    }
    if (text === "true") return true;
    if (text === "false") return false;
    return text;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseKramdownAttrs(source) {
    var attrs = { classes: [], other: "" };

    String(source || "").trim().split(/\s+/).forEach(function (part) {
      if (!part) return;
      if (part[0] === ".") {
        attrs.classes.push(part.slice(1));
        return;
      }
      if (part[0] === "#") {
        attrs.other += " id=\"" + escapeHtml(part.slice(1)) + "\"";
        return;
      }
      attrs.other += " " + part;
    });

    return attrs;
  }

  function preprocessMarkdown(markdown) {
    return String(markdown || "").replace(
      /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*\{:\s*([^}]*)\}/g,
      function (_, alt, src, title, attrSource) {
        var attrs = parseKramdownAttrs(attrSource);
        var classAttr = attrs.classes.length ? " class=\"" + escapeHtml(attrs.classes.join(" ")) + "\"" : "";
        var titleAttr = title ? " title=\"" + escapeHtml(title) + "\"" : "";

        return "<img src=\"" + escapeHtml(src) + "\" alt=\"" + escapeHtml(alt) + "\"" +
          titleAttr + classAttr + attrs.other + ">";
      }
    );
  }

  function renderMarkdown(markdown) {
    var renderer = window.marked;
    if (!renderer || !renderer.parse) {
      throw new Error("Markdown parser is not loaded.");
    }

    renderer.setOptions({
      breaks: false,
      gfm: true,
      headerIds: false,
      mangle: false
    });

    return renderer.parse(preprocessMarkdown(markdown));
  }

  function isExternalUrl(url) {
    return /^(?:[a-z]+:)?\/\//i.test(url) ||
      /^(?:data|blob|mailto):/i.test(url) ||
      String(url || "").charAt(0) === "/";
  }

  function resolveAssetUrl(path, assetMap) {
    if (!path || isExternalUrl(path)) return path;

    var clean = normalizePath(decodeURIComponent(path).split("#")[0].split("?")[0]);
    var suffix = path.slice(clean.length);
    var matched = null;

    pathVariants(clean).some(function (variant) {
      if (assetMap.has(variant)) {
        matched = assetMap.get(variant);
        return true;
      }
      return false;
    });

    return matched ? matched + suffix : path;
  }

  function rewriteLocalAssets(html, assetMap) {
    var template = document.createElement("template");
    template.innerHTML = html;

    template.content.querySelectorAll("[src]").forEach(function (node) {
      node.setAttribute("src", resolveAssetUrl(node.getAttribute("src"), assetMap));
    });
    template.content.querySelectorAll("[href]").forEach(function (node) {
      var href = node.getAttribute("href");
      if (/\.(?:png|jpe?g|gif|svg|webp|avif|mp4|webm|mov|pdf)$/i.test(href || "")) {
        node.setAttribute("href", resolveAssetUrl(href, assetMap));
      }
    });

    return template.innerHTML;
  }

  function setDatasetValue(name, value, fallback) {
    var selected = value === undefined || value === null || value === "" ? fallback : value;
    document.body.dataset[name] = String(selected || "");
  }

  function applyDeckMeta(meta, file, assetMap) {
    var title = meta.title || file.name.replace(/\.[^.]+$/, "");
    var logo = resolveAssetUrl(meta.logo || "", assetMap);
    var topbar = meta.slide_topbar_color || meta.slide_topbar || "default";
    var content = meta.slide_content_color || meta.slide_content || "default";
    var footer = meta.slide_footer_color || meta.slide_footer || "default";
    var theme = meta.slide_theme || "paper";
    var aspect = meta.slide_aspect || meta.aspect || "16:9";
    var bullets = meta.slide_bullets || meta.bullet_mode || "item";

    document.title = title + " - Local Slide Player";
    setDatasetValue("deckTitle", title, "Local Deck");
    setDatasetValue("deckSubtitle", meta.subtitle || meta.slide_subtitle, "");
    setDatasetValue("deckAuthor", meta.author, "");
    setDatasetValue("deckCategory", meta.category, "Slides");
    setDatasetValue("deckLogo", logo, "");
    setDatasetValue("deckLogoAlt", meta.logo_alt || title, title);
    setDatasetValue("slideTheme", theme, "paper");
    setDatasetValue("slideThemeDefault", theme, "paper");
    setDatasetValue("slideAspect", aspect, "16:9");
    setDatasetValue("slideAspectDefault", aspect, "16:9");
    setDatasetValue("slideTopbarColor", topbar, "default");
    setDatasetValue("slideTopbarDefault", topbar, "default");
    setDatasetValue("slideContentColor", content, "default");
    setDatasetValue("slideContentDefault", content, "default");
    setDatasetValue("slideFooterColor", footer, "default");
    setDatasetValue("slideFooterDefault", footer, "default");
    setDatasetValue("slideBullets", bullets, "item");
    setDatasetValue("slideBulletsDefault", bullets, "item");
  }

  function readFileText(file) {
    return file.text ? file.text() : new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function updateUi() {
    ui.openButton.disabled = !mdFile;
    if (ui.deckName) ui.deckName.textContent = mdFile ? mdFile.name : "未选择";
    if (ui.assetCount) ui.assetCount.textContent = String(assetFiles.length);
  }

  function collectFiles(files) {
    var nextFiles = Array.prototype.slice.call(files || []);
    var deck = nextFiles.find(isMarkdownFile);
    var assets = nextFiles.filter(isAssetFile);

    if (deck) mdFile = deck;
    if (assets.length) assetFiles = assetFiles.concat(assets);
    updateUi();
    setStatus(mdFile ? "已准备，可以打开。" : "请选择一个 Markdown 文件。", false);
  }

  function showPlayer() {
    ui.shell.hidden = true;
    document.body.classList.add("local-deck-loaded");
  }

  function openMarkdownText(text, options) {
    var fileInfo = {
      name: options && options.name ? options.name : mdFile ? mdFile.name : "local-deck.md"
    };
    var files = options && options.assets ? options.assets : assetFiles;

    revokeObjectUrls();

    return Promise.resolve().then(function () {
      var parsed = stripFrontMatter(text);
      var assetMap = createAssetMap(files);
      var html = rewriteLocalAssets(renderMarkdown(parsed.body), assetMap);

      applyDeckMeta(parsed.meta, fileInfo, assetMap);
      window.SlideDeckRuntime.setSourceHtml(html);
      showPlayer();
      return window.SlideDeckRuntime.initialize();
    });
  }

  function openDeck() {
    if (!mdFile) return;

    setStatus("正在解析 Markdown...", false);

    readFileText(mdFile)
      .then(function (text) {
        return openMarkdownText(text, { name: mdFile.name, assets: assetFiles });
      })
      .then(function () {
        setStatus("", false);
      })
      .catch(function (error) {
        setStatus("打开失败：" + (error && error.message ? error.message : String(error)), true);
      });
  }

  ui.deckInput.addEventListener("change", function () {
    mdFile = ui.deckInput.files[0] || null;
    updateUi();
    setStatus(mdFile ? "已选择 Markdown 文件。" : "", false);
  });

  if (ui.assetInput) {
    ui.assetInput.addEventListener("change", function () {
      assetFiles = Array.prototype.slice.call(ui.assetInput.files || []);
      updateUi();
      setStatus(assetFiles.length ? "已选择资源文件。" : "", false);
    });
  }

  ui.openButton.addEventListener("click", openDeck);

  if (ui.dropZone) {
    ["dragenter", "dragover"].forEach(function (type) {
      ui.dropZone.addEventListener(type, function (event) {
        event.preventDefault();
        ui.dropZone.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach(function (type) {
      ui.dropZone.addEventListener(type, function (event) {
        event.preventDefault();
        ui.dropZone.classList.remove("is-dragging");
      });
    });
    ui.dropZone.addEventListener("drop", function (event) {
      collectFiles(event.dataTransfer.files);
    });
  }

  updateUi();

  window.LocalSlidePlayer = {
    openMarkdownText: function (text, name) {
      return openMarkdownText(text, { name: name || "local-deck.md", assets: [] });
    }
  };
})();
