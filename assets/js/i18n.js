(function () {
  var messages = {
    zh: {
      "site.description": "文章、工具、项目和一些长期记录。",
      "nav.posts": "文章",
      "nav.tools": "工具",
      "nav.slides": "幻灯片",
      "nav.categories": "分类",
      "nav.tags": "标签",
      "nav.archive": "归档",
      "nav.series": "系列",
      "nav.search": "搜索",
      "nav.about": "关于",
      "quick.title": "快速入口",
      "quick.search": "搜索文章",
      "quick.allPosts": "全部文章",
      "quick.tools": "打开工具",
      "quick.slides": "打开幻灯片",
      "quick.archive": "时间归档",
      "quick.tags": "标签索引",
      "quick.recent": "最近文章",
      "quick.collapse": "收起",
      "quick.open": "快捷",
      "search.label": "搜索文章",
      "search.placeholder": "产品、AI、生活、技术...",
      "search.inputPlaceholder": "输入关键词",
      "home.latest": "最近文章",
      "home.sections": "主要栏目",
      "home.tools": "小工具",
      "home.slides": "幻灯片",
      "home.tags": "常用标签",
      "tools.all": "全部工具",
      "tools.open": "打开工具",
      "tools.repo": "代码仓库",
      "slides.all": "全部幻灯片",
      "slides.open": "打开幻灯片",
      "slides.empty": "还没有发布幻灯片。",
      "post.back": "返回文章",
      "post.previous": "上一篇",
      "post.next": "下一篇",
      "comments.title": "评论",
      "comments.missing": "评论功能已开启，但还需要填写 giscus 的 repo、repo_id、category 和 category_id。",
      "footer.built": "Built with Jekyll.",
      "search.empty": "输入关键词开始搜索。",
      "search.none": "没有找到相关文章。",
      "search.failed": "搜索索引加载失败。"
    },
    en: {
      "site.description": "Posts, tools, projects, and long-running notes.",
      "nav.posts": "Posts",
      "nav.tools": "Tools",
      "nav.slides": "Slides",
      "nav.categories": "Categories",
      "nav.tags": "Tags",
      "nav.archive": "Archive",
      "nav.series": "Series",
      "nav.search": "Search",
      "nav.about": "About",
      "quick.title": "Quick Access",
      "quick.search": "Search Posts",
      "quick.allPosts": "All Posts",
      "quick.tools": "Open Tools",
      "quick.slides": "Open Slides",
      "quick.archive": "Timeline",
      "quick.tags": "Tag Index",
      "quick.recent": "Recent Posts",
      "quick.collapse": "Collapse",
      "quick.open": "Quick",
      "search.label": "Search posts",
      "search.placeholder": "Products, AI, life, engineering...",
      "search.inputPlaceholder": "Keywords",
      "home.latest": "Latest Posts",
      "home.sections": "Sections",
      "home.tools": "Tools",
      "home.slides": "Slides",
      "home.tags": "Tags",
      "tools.all": "All Tools",
      "tools.open": "Open Tool",
      "tools.repo": "Repository",
      "slides.all": "All Slides",
      "slides.open": "Open Slides",
      "slides.empty": "No slide decks yet.",
      "post.back": "Back to Posts",
      "post.previous": "Previous",
      "post.next": "Next",
      "comments.title": "Comments",
      "comments.missing": "Comments are enabled, but giscus repo, repo_id, category, and category_id still need to be configured.",
      "footer.built": "Built with Jekyll.",
      "search.empty": "Type keywords to search.",
      "search.none": "No matching posts.",
      "search.failed": "Search index failed to load."
    }
  };

  function getLanguage() {
    try {
      return localStorage.getItem("site-language") || "zh";
    } catch (error) {
      return "zh";
    }
  }

  function setLanguage(lang) {
    var dict = messages[lang] || messages.zh;
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";

    document.querySelectorAll("[data-i18n-key]").forEach(function (node) {
      var text = dict[node.dataset.i18nKey];
      if (text) node.textContent = text;
    });

    document.querySelectorAll("[data-i18n-zh][data-i18n-en]").forEach(function (node) {
      node.textContent = lang === "en" ? node.dataset.i18nEn : node.dataset.i18nZh;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      var text = dict[node.dataset.i18nPlaceholder];
      if (text) node.setAttribute("placeholder", text);
    });

    document.querySelectorAll("[data-lang-option]").forEach(function (button) {
      var active = button.dataset.langOption === lang;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    try {
      localStorage.setItem("site-language", lang);
    } catch (error) {}

    document.dispatchEvent(new CustomEvent("site-language-change", { detail: { language: lang } }));
    syncGiscusLanguage(lang);
  }

  function syncGiscusLanguage(lang) {
    var giscusLang = lang === "en" ? "en" : "zh-CN";

    function send() {
      var frame = document.querySelector("iframe.giscus-frame, .giscus iframe, iframe[src*='giscus.app']");
      if (!frame || !frame.contentWindow) return;
      frame.contentWindow.postMessage({
        giscus: {
          setConfig: {
            lang: giscusLang
          }
        }
      }, "https://giscus.app");
    }

    send();
    window.setTimeout(send, 600);
    window.setTimeout(send, 1800);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-lang-option]");
    if (!button) return;
    setLanguage(button.dataset.langOption);
  });

  setLanguage(getLanguage());
})();
