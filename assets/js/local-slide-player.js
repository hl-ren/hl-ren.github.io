(function () {
  var mdFile = null;
  var assetFiles = [];
  var objectUrls = [];
  var currentLanguage = "zh";
  var previewTimer = 0;
  var pendingPreviewPayload = null;
  var pendingPreviewIndex = 0;
  var previewVersion = 0;
  var returnToEditorAfterFullscreen = false;
  var MESSAGE_TYPES = {
    previewReady: "local-slide-preview-ready",
    previewRender: "local-slide-preview",
    previewGoto: "local-slide-preview-goto"
  };

  var DEFAULT_TEMPLATE = [
    "---",
    "title: \"Online Slides System\"",
    "subtitle: \"A browser-first Markdown deck\"",
    "author: \"Huilong Ren\"",
    "category: \"Demo\"",
    "slide_theme: \"paper\"",
    "slide_topbar_color: \"blue\"",
    "slide_content_color: \"blue\"",
    "slide_footer_color: \"blue\"",
    "slide_bullets: \"item\"",
    "---",
    "",
    "# Online Slides System",
    "",
    "Affiliation / Course / Date",
    "",
    "---",
    "",
    "# Outline",
    "",
    "- Framing",
    "- Authoring",
    "- Delivery",
    "",
    "---",
    "",
    "## Framing",
    "",
    "- One Markdown file",
    "- Browser-based presentation",
    "- Same engine online and local",
    "",
    "---",
    "",
    "## Markdown columns",
    "",
    "### Left column",
    "",
    "- Use `###` headings",
    "- Lists become fragments",
    "",
    "### Right column",
    "",
    "- Math works: \\(a^2+b^2=c^2\\)",
    "- Images support height classes",
    "",
    "---",
    "",
    "## Symbols and placement",
    "",
    ":big[ρ]",
    "",
    "- Use `:icon[...]`, `:big[...]`, or `:hero[...]` for symbol-like text",
    "- Use `{x1,y1,x2,y2}` to place content by slide-relative coordinates",
    "",
    "{0.62,0.16,0.92,0.42}",
    ":icon[⚙]",
    "",
    "Placed box",
    "{/}",
    "",
    "---",
    "",
    "## Math",
    "",
    "<div class=\"equation-box\" markdown=\"1\">",
    "",
    "$$",
    "\\\\begin{aligned}",
    "\\\\mathcal{L}(\\\\theta,\\\\lambda)",
    "&= \\\\frac{1}{N}\\\\sum_{i=1}^{N} \\\\lVert f_{\\\\theta}(x_i)-y_i \\\\rVert_2^2",
    "+ \\\\lambda \\\\lVert \\\\nabla f_{\\\\theta} \\\\rVert_2^2,\\\\\\\\",
    "\\\\frac{\\\\partial \\\\mathcal{L}}{\\\\partial \\\\theta}",
    "&= \\\\frac{2}{N}\\\\sum_{i=1}^{N}(f_{\\\\theta}(x_i)-y_i)",
    "\\\\frac{\\\\partial f_{\\\\theta}(x_i)}{\\\\partial \\\\theta}.",
    "\\\\end{aligned}",
    "$$",
    "",
    "</div>",
    "",
    "---",
    "",
    "## Ending",
    "",
    "Thank you."
  ].join("\n");

  var messages = {
    zh: {
      title: "Slide Player",
      pageTitle: "本地幻灯片播放器",
      markdown: "Markdown",
      assets: "资源",
      chooseMd: "Choose md file",
      chooseAssets: "Choose assets file",
      player: "Player",
      download: "Download MD",
      render: "刷新预览",
      template: "载入模板",
      editor: "编辑器",
      insertTable: "表格",
      insertCode: "代码",
      insertMath: "公式",
      insertImage: "图片",
      insertColumns: "双栏",
      insertSymbol: "符号",
      insertPlace: "定位",
      preview: "预览",
      previewHint: "使用同一套 slides 内核",
      notSelected: "未选择",
      assetCount: "{count} 个文件",
      chooseMarkdown: "请选择一个 Markdown 文件。",
      deckSelected: "已选择 Markdown 文件。",
      assetsSelected: "已选择资源文件。",
      parsing: "正在解析 Markdown...",
      failed: "打开失败：{message}",
      dropHint: "也可以把 md 和资源文件拖到这里。"
    },
    en: {
      title: "Slide Player",
      pageTitle: "Local Slide Player",
      markdown: "Markdown",
      assets: "Assets",
      chooseMd: "Choose md file",
      chooseAssets: "Choose assets file",
      player: "Player",
      download: "Download MD",
      render: "Refresh Preview",
      template: "Load Template",
      editor: "Editor",
      insertTable: "Table",
      insertCode: "Code",
      insertMath: "Math",
      insertImage: "Image",
      insertColumns: "Columns",
      insertSymbol: "Symbol",
      insertPlace: "Place",
      preview: "Preview",
      previewHint: "Same slide engine",
      notSelected: "None",
      assetCount: "{count} files",
      chooseMarkdown: "Choose a Markdown file.",
      deckSelected: "Markdown file selected.",
      assetsSelected: "Asset folder selected.",
      parsing: "Parsing Markdown...",
      failed: "Could not open: {message}",
      dropHint: "You can also drop the md and asset files here."
    }
  };

  var ui = {
    shell: document.querySelector("[data-local-player]"),
    deckInput: document.querySelector("[data-local-deck-input]"),
    assetInput: document.querySelector("[data-local-assets-input]"),
    openButton: document.querySelector("[data-local-open]"),
    deckName: document.querySelector("[data-local-deck-name]"),
    assetCount: document.querySelector("[data-local-asset-count]"),
    assetWord: document.querySelector("[data-local-asset-word]"),
    status: document.querySelector("[data-local-status]"),
    dropZone: document.querySelector("[data-local-drop]"),
    editor: document.querySelector("[data-local-editor]"),
    highlight: document.querySelector("[data-local-highlight] code"),
    previewFrame: document.querySelector("[data-local-preview]"),
    renderButton: document.querySelector("[data-local-render]"),
    templateButton: document.querySelector("[data-local-template]"),
    downloadButton: document.querySelector("[data-local-download]")
  };

  var hasWorkbench = Boolean(ui.shell && ui.deckInput && ui.openButton);

  function t(key, values) {
    var dict = messages[currentLanguage] || messages.zh;
    var text = dict[key] || messages.zh[key] || key;

    Object.keys(values || {}).forEach(function (name) {
      text = text.replace("{" + name + "}", values[name]);
    });

    return text;
  }

  function getStoredLanguage() {
    try {
      return localStorage.getItem("local-slide-language") || "en";
    } catch (error) {
      return "en";
    }
  }

  function setLanguage(lang) {
    currentLanguage = lang === "en" ? "en" : "zh";
    document.documentElement.lang = currentLanguage === "en" ? "en" : "zh-CN";

    document.querySelectorAll("[data-local-i18n]").forEach(function (node) {
      node.innerHTML = t(node.dataset.localI18n);
    });

    document.querySelectorAll("[data-local-lang]").forEach(function (button) {
      var active = button.dataset.localLang === currentLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    try {
      localStorage.setItem("local-slide-language", currentLanguage);
    } catch (error) {}

    updateUi();
    refreshStatusLanguage();
    if (!document.body.classList.contains("local-deck-loaded")) {
      document.title = t("pageTitle");
    }
  }

  function setStatus(text, isError) {
    if (!ui.status) return;
    delete ui.status.dataset.localStatusKey;
    delete ui.status.dataset.localStatusValues;
    ui.status.textContent = text || "";
    ui.status.classList.toggle("is-error", Boolean(isError));
  }

  function setStatusKey(key, isError, values) {
    if (!ui.status) return;
    ui.status.dataset.localStatusKey = key;
    ui.status.dataset.localStatusValues = JSON.stringify(values || {});
    ui.status.textContent = t(key, values);
    ui.status.classList.toggle("is-error", Boolean(isError));
  }

  function refreshStatusLanguage() {
    if (!ui.status) return;
    var key = ui.status.dataset.localStatusKey;
    if (!key) return;

    var values = {};
    try {
      values = JSON.parse(ui.status.dataset.localStatusValues || "{}");
    } catch (error) {}
    ui.status.textContent = t(key, values);
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

  function highlightInlineMarkdown(line) {
    return line
      .replace(/(`[^`]+`)/g, "<span class=\"md-code\">$1</span>")
      .replace(/(!\[[^\]]*\]\([^)]+\))/g, "<span class=\"md-image\">$1</span>")
      .replace(/(\[[^\]]+\]\([^)]+\))/g, "<span class=\"md-link\">$1</span>")
      .replace(/(:(?:icon|big|hero)\[[^\]\n]+\])/g, "<span class=\"md-symbol\">$1</span>")
      .replace(/(\{:\s*[^}]+\})/g, "<span class=\"md-muted\">$1</span>")
      .replace(/(\*\*[^*]+\*\*)/g, "<span class=\"md-heading\">$1</span>");
  }

  function highlightMarkdown(markdown) {
    var inFence = false;

    return String(markdown || "").split(/\r?\n/).map(function (rawLine) {
      var escaped = escapeHtml(rawLine);
      var trimmed = rawLine.trim();

      if (/^```/.test(trimmed)) {
        inFence = !inFence;
        return "<span class=\"md-fence\">" + escaped + "</span>";
      }
      if (inFence) return "<span class=\"md-code\">" + escaped + "</span>";
      if (/^%%/.test(trimmed)) return "<span class=\"md-comment\">" + escaped + "</span>";
      if (/^---\s*$/.test(trimmed)) return "<span class=\"md-hr\">" + escaped + "</span>";
      if (/^\s*#{1,6}\s+/.test(rawLine)) return "<span class=\"md-heading\">" + escaped + "</span>";
      if (/^\s*[-*+]\s+/.test(rawLine)) return escaped.replace(/^(\s*[-*+]\s+)/, "<span class=\"md-list\">$1</span>");
      if (/^\s*&gt;/.test(escaped)) return "<span class=\"md-quote\">" + escaped + "</span>";
      if (/^\s*\{\s*[0-9.]+\s*,\s*[0-9.]+\s*,\s*[0-9.]+\s*,\s*[0-9.]+\s*\}\s*$/.test(rawLine) ||
          /^\s*\{\/\}\s*$/.test(rawLine)) return "<span class=\"md-place\">" + escaped + "</span>";
      if (/^\s*\|.*\|\s*$/.test(rawLine)) return "<span class=\"md-table\">" + escaped + "</span>";
      if (/^\s*(?:\$\$|\\\[|\\\])/.test(rawLine)) return "<span class=\"md-math\">" + escaped + "</span>";
      if (/^\s*&lt;\/?[\w-]+/.test(escaped)) return "<span class=\"md-html\">" + escaped + "</span>";

      return highlightInlineMarkdown(escaped);
    }).join("\n");
  }

  function syncEditorHighlight() {
    if (!ui.editor || !ui.highlight) return;
    ui.highlight.innerHTML = highlightMarkdown(ui.editor.value) + "\n";
    ui.highlight.parentElement.scrollTop = ui.editor.scrollTop;
    ui.highlight.parentElement.scrollLeft = ui.editor.scrollLeft;
  }

  function getInsertSnippet(type) {
    var snippets = {
      table: [
        "| Item | Notes |",
        "| --- | --- |",
        "| A | Replace me |",
        "| B | Replace me |"
      ].join("\n"),
      code: [
        "```python",
        "# code here",
        "```"
      ].join("\n"),
      math: [
        "$$",
        "a^2 + b^2 = c^2",
        "$$"
      ].join("\n"),
      image: "![Alt text](images/example.png){: .w-60 }",
      symbol: [
        ":big[⚙️] Key idea",
        "",
        ":hero[ρ]"
      ].join("\n"),
      place: [
        "{0.2,0.2,0.4,0.6}",
        ":big[⚙️]",
        "",
        "Placed note",
        "{/}"
      ].join("\n"),
      columns: [
        "### Left column",
        "",
        "- Point A",
        "- Point B",
        "",
        "### Right column",
        "",
        "- Point C",
        "- Point D"
      ].join("\n")
    };

    return snippets[type] || "";
  }

  function insertMarkdownSnippet(type) {
    if (!ui.editor) return;
    var snippet = getInsertSnippet(type);
    if (!snippet) return;

    var start = ui.editor.selectionStart || 0;
    var end = ui.editor.selectionEnd || start;
    var value = ui.editor.value;
    var before = value.slice(0, start);
    var after = value.slice(end);
    var prefix = before && !/\n\n$/.test(before) ? before.endsWith("\n") ? "\n" : "\n\n" : "";
    var suffix = after && !/^\n\n/.test(after) ? after.startsWith("\n") ? "\n" : "\n\n" : "";
    var inserted = prefix + snippet + suffix;

    ui.editor.value = before + inserted + after;
    ui.editor.focus();
    ui.editor.selectionStart = ui.editor.selectionEnd = start + inserted.length - suffix.length;
    mdFile = null;
    updateUi();
    syncEditorHighlight();
    schedulePreviewRender(0);
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

  function stripSlideComments(markdown) {
    var output = [];
    var inBlock = false;

    String(markdown || "").split(/\r?\n/).forEach(function (line) {
      var trimmed = line.trim();

      if (inBlock) {
        if (/\}%%\s*$/.test(trimmed)) inBlock = false;
        return;
      }

      if (/^%%\{/.test(trimmed)) {
        if (!/\}%%\s*$/.test(trimmed)) inBlock = true;
        return;
      }

      if (/^%%/.test(trimmed)) return;

      output.push(line);
    });

    return output.join("\n");
  }

  function preprocessMarkdown(markdown) {
    return stripSlideComments(markdown).replace(
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

  function protectMath(markdown) {
    var blocks = [];

    function store(match) {
      var token = "@@LOCAL_MATH_" + String(blocks.length) + "@@";
      blocks.push(escapeHtml(match));
      return token;
    }

    var protectedMarkdown = String(markdown || "")
      .replace(/\$\$[\s\S]*?\$\$/g, store)
      .replace(/\\\[[\s\S]*?\\\]/g, store)
      .replace(/\\\([\s\S]*?\\\)/g, store);

    return {
      markdown: protectedMarkdown,
      restore: function (html) {
        return html.replace(/@@LOCAL_MATH_(\d+)@@/g, function (_, index) {
          return blocks[Number(index)] || "";
        });
      }
    };
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

    var protectedMath = protectMath(markdown);
    return protectedMath.restore(renderer.parse(preprocessMarkdown(protectedMath.markdown)));
  }

  function isExternalUrl(url) {
    return /^(?:[a-z]+:)?\/\//i.test(url) ||
      /^(?:data|blob|mailto):/i.test(url);
  }

  function resolveAssetUrl(path, assetMap) {
    if (!path || isExternalUrl(path)) return path;

    var raw = String(path);
    var cleanRaw = raw.split("#")[0].split("?")[0];
    var clean = normalizePath(decodeURIComponent(cleanRaw));
    var suffix = raw.slice(cleanRaw.length);
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

    document.title = title + " - " + t("pageTitle");
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
    var hasEditorMarkdown = ui.editor && ui.editor.value.trim();
    if (ui.openButton) ui.openButton.disabled = !mdFile && !hasEditorMarkdown;
    if (ui.deckName) ui.deckName.textContent = mdFile ? mdFile.name : t("notSelected");
    if (ui.assetCount) ui.assetCount.textContent = String(assetFiles.length);
    if (ui.assetWord) {
      ui.assetWord.textContent = t("assetCount", { count: assetFiles.length })
        .replace(String(assetFiles.length), "")
        .trim();
    }
  }

  function getCurrentMarkdown() {
    if (ui.editor && ui.editor.value.trim()) return ui.editor.value;
    return "";
  }

  function getCurrentDeckName() {
    if (mdFile && mdFile.name) return mdFile.name;
    return "editor.md";
  }

  function getDownloadName() {
    var name = getCurrentDeckName() || "deck.md";
    return /\.(md|markdown)$/i.test(name) ? name : name + ".md";
  }

  function getMarkdownLineAtPoint(textarea, clientY) {
    if (!textarea) return 1;

    var rect = textarea.getBoundingClientRect();
    var style = window.getComputedStyle(textarea);
    var lineHeight = parseFloat(style.lineHeight);
    if (!lineHeight || Number.isNaN(lineHeight)) {
      lineHeight = (parseFloat(style.fontSize) || 15) * 1.35;
    }

    var paddingTop = parseFloat(style.paddingTop) || 0;
    var offsetY = clientY - rect.top - paddingTop + textarea.scrollTop;
    return Math.max(1, Math.floor(offsetY / lineHeight) + 1);
  }

  function getSlideIndexForLine(markdown, lineNumber) {
    var lines = String(markdown || "").split(/\r?\n/);
    var bodyStart = 1;
    var slideIndex = 0;

    if (lines[0] && lines[0].trim() === "---") {
      for (var i = 1; i < lines.length; i += 1) {
        if (lines[i].trim() === "---") {
          bodyStart = i + 2;
          break;
        }
      }
    }

    if (lineNumber < bodyStart) return 0;

    for (var index = bodyStart - 1; index < lines.length && index < lineNumber - 1; index += 1) {
      if (/^\s*---\s*$/.test(lines[index])) slideIndex += 1;
    }

    return slideIndex;
  }

  function postPreviewGoto(index) {
    pendingPreviewIndex = Math.max(0, Number(index) || 0);
    if (!ui.previewFrame || !ui.previewFrame.contentWindow) return;
    ui.previewFrame.contentWindow.postMessage({
      type: MESSAGE_TYPES.previewGoto,
      index: pendingPreviewIndex
    }, window.location.origin);
  }

  function syncPreviewToEditorPoint(event) {
    var line = getMarkdownLineAtPoint(ui.editor, event.clientY);
    postPreviewGoto(getSlideIndexForLine(ui.editor.value, line));
  }

  function loadTemplate() {
    if (!ui.editor) return;
    ui.editor.value = DEFAULT_TEMPLATE;
    mdFile = null;
    updateUi();
    syncEditorHighlight();
    setStatus("", false);
    schedulePreviewRender(0);
  }

  function collectFiles(files) {
    var nextFiles = Array.prototype.slice.call(files || []);
    var deck = nextFiles.find(isMarkdownFile);
    var assets = nextFiles.filter(isAssetFile);

    if (deck) mdFile = deck;
    if (assets.length) assetFiles = assetFiles.concat(assets);
    updateUi();
    setStatusKey(mdFile ? "deckSelected" : "chooseMarkdown", false);
    if (deck && ui.editor) {
      readFileText(deck).then(function (text) {
        ui.editor.value = text;
        updateUi();
        syncEditorHighlight();
        schedulePreviewRender(0);
      }).catch(function (error) {
        setStatusKey("failed", true, { message: error && error.message ? error.message : String(error) });
      });
      return;
    }
    schedulePreviewRender(0);
  }

  function showPlayer() {
    window.clearTimeout(previewTimer);
    pendingPreviewPayload = null;
    if (ui.previewFrame) ui.previewFrame.src = "about:blank";
    if (ui.shell) ui.shell.hidden = true;
    document.body.classList.add("local-deck-loaded");
  }

  function returnToEditor() {
    returnToEditorAfterFullscreen = false;
    document.body.classList.remove("local-deck-loaded");
    if (ui.shell) ui.shell.hidden = false;
    document.title = t("pageTitle");
    setStatus("", false);
    schedulePreviewRender(0);
  }

  function requestPlayerFullscreen() {
    if (document.fullscreenElement) {
      returnToEditorAfterFullscreen = true;
      return Promise.resolve(true);
    }
    if (!document.documentElement.requestFullscreen) {
      return Promise.resolve(Boolean(document.fullscreenElement));
    }

    return document.documentElement.requestFullscreen()
      .then(function () {
        returnToEditorAfterFullscreen = true;
        return true;
      })
      .catch(function () {
        return false;
      });
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
    var markdown = getCurrentMarkdown();
    if (!markdown && !mdFile) return Promise.resolve();

    setStatusKey("parsing", false);

    return (markdown ? Promise.resolve(markdown) : readFileText(mdFile))
      .then(function (text) {
        return openMarkdownText(text, { name: getCurrentDeckName(), assets: assetFiles });
      })
      .then(function () {
        setStatus("", false);
      })
      .catch(function (error) {
        setStatusKey("failed", true, { message: error && error.message ? error.message : String(error) });
      });
  }

  function openPlayer() {
    returnToEditorAfterFullscreen = false;
    requestPlayerFullscreen();
    openDeck();
  }

  function downloadMarkdown() {
    var markdown = getCurrentMarkdown() || DEFAULT_TEMPLATE;
    var blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = getDownloadName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
  }

  function loadDeckFile(file, statusKey) {
    mdFile = file || null;
    updateUi();
    setStatusKey(mdFile ? statusKey || "deckSelected" : "dropHint", false);
    if (!mdFile || !ui.editor) return;
    readFileText(mdFile).then(function (text) {
      ui.editor.value = text;
      updateUi();
      syncEditorHighlight();
      schedulePreviewRender(0);
    }).catch(function (error) {
      setStatusKey("failed", true, { message: error && error.message ? error.message : String(error) });
    });
  }

  function bindWorkbenchEvents() {
    if (!hasWorkbench) return;

    ui.deckInput.addEventListener("change", function () {
      loadDeckFile(ui.deckInput.files[0] || null, "deckSelected");
    });

    if (ui.assetInput) {
      ui.assetInput.addEventListener("change", function () {
        assetFiles = Array.prototype.slice.call(ui.assetInput.files || []);
        updateUi();
        setStatusKey(assetFiles.length ? "assetsSelected" : "dropHint", false);
        schedulePreviewRender(0);
      });
    }

    ui.openButton.addEventListener("click", openPlayer);
    if (ui.downloadButton) ui.downloadButton.addEventListener("click", downloadMarkdown);
    if (ui.renderButton) ui.renderButton.addEventListener("click", function () { schedulePreviewRender(0); });
    if (ui.templateButton) ui.templateButton.addEventListener("click", loadTemplate);
    if (ui.editor) {
      ui.editor.addEventListener("input", function () {
        mdFile = null;
        updateUi();
        syncEditorHighlight();
        schedulePreviewRender(450);
      });
      ui.editor.addEventListener("scroll", syncEditorHighlight);
      ui.editor.addEventListener("mousemove", syncPreviewToEditorPoint);
      ui.editor.addEventListener("click", syncPreviewToEditorPoint);
    }

    document.querySelectorAll("[data-local-insert]").forEach(function (button) {
      button.addEventListener("click", function () {
        insertMarkdownSnippet(button.dataset.localInsert);
      });
    });

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
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-local-lang]");
    if (!button) return;
    setLanguage(button.dataset.localLang);
  });

  document.addEventListener("fullscreenchange", function () {
    if (document.fullscreenElement || !returnToEditorAfterFullscreen) return;
    if (!document.body.classList.contains("local-deck-loaded")) return;
    returnToEditor();
  }, true);

  function postPreviewPayload() {
    if (!ui.previewFrame || !ui.previewFrame.contentWindow || !pendingPreviewPayload) return;
    ui.previewFrame.contentWindow.postMessage(pendingPreviewPayload, window.location.origin);
    postPreviewGoto(pendingPreviewIndex);
  }

  function renderPreview() {
    if (!ui.previewFrame || !ui.editor) return;

    pendingPreviewPayload = {
      type: MESSAGE_TYPES.previewRender,
      markdown: ui.editor.value || DEFAULT_TEMPLATE,
      name: getCurrentDeckName(),
      assets: assetFiles,
      index: pendingPreviewIndex
    };
    previewVersion += 1;
    ui.previewFrame.src = "preview.html?v=" + String(previewVersion);
  }

  function schedulePreviewRender(delay) {
    if (!ui.previewFrame || !ui.editor) return;
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(renderPreview, delay || 0);
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== MESSAGE_TYPES.previewReady) return;
    postPreviewPayload();
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== MESSAGE_TYPES.previewRender) return;
    openMarkdownText(event.data.markdown || DEFAULT_TEMPLATE, {
      name: event.data.name || "preview.md",
      assets: event.data.assets || []
    }).then(function () {
      if (window.Reveal && window.Reveal.slide) {
        window.Reveal.slide(Math.max(0, Number(event.data.index) || 0));
      }
    }).catch(function (error) {
      setStatusKey("failed", true, { message: error && error.message ? error.message : String(error) });
    });
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== MESSAGE_TYPES.previewGoto) return;
    if (window.Reveal && window.Reveal.slide) {
      window.Reveal.slide(Math.max(0, Number(event.data.index) || 0));
    }
  });

  function initializeWorkbench() {
    if (!hasWorkbench) return;

    var initialDeckFile = ui.deckInput.files && ui.deckInput.files[0] ? ui.deckInput.files[0] : null;
    var initialAssetFiles = ui.assetInput ? Array.prototype.slice.call(ui.assetInput.files || []) : [];

    if (initialDeckFile) mdFile = initialDeckFile;
    if (initialAssetFiles.length) assetFiles = initialAssetFiles;

    if (ui.editor && !ui.editor.value.trim() && !initialDeckFile) {
      ui.editor.value = DEFAULT_TEMPLATE;
      syncEditorHighlight();
    }

    if (initialDeckFile) {
      loadDeckFile(initialDeckFile, "deckSelected");
      return;
    }

    setStatusKey("dropHint", false);
    schedulePreviewRender(0);
  }

  bindWorkbenchEvents();
  updateUi();
  setLanguage(getStoredLanguage());
  initializeWorkbench();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: MESSAGE_TYPES.previewReady }, window.location.origin);
  }

  window.LocalSlidePlayer = {
    openMarkdownText: function (text, options) {
      if (typeof options === "string") options = { name: options };
      return openMarkdownText(text, {
        name: options && options.name ? options.name : "local-deck.md",
        assets: options && options.assets ? options.assets : []
      });
    }
  };
})();
