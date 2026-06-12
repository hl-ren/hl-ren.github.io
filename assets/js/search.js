(function () {
  var script = document.currentScript;
  var input = document.getElementById("search-input");
  var results = document.getElementById("search-results");
  if (!input || !results) return;

  var posts = [];
  var params = new URLSearchParams(window.location.search);
  var initialQuery = params.get("q") || "";
  var lastQuery = "";

  var labels = {
    zh: {
      empty: "输入关键词开始搜索。",
      none: "没有找到相关文章。",
      failed: "搜索索引加载失败。"
    },
    en: {
      empty: "Type keywords to search.",
      none: "No matching posts.",
      failed: "Search index failed to load."
    }
  };

  function normalize(value) {
    return String(value || "").toLowerCase();
  }

  function language() {
    return document.documentElement.lang === "en" ? "en" : "zh";
  }

  function render(items, query) {
    if (!query) {
      results.innerHTML = '<p class="muted">' + labels[language()].empty + '</p>';
      return;
    }

    if (!items.length) {
      results.innerHTML = '<p class="muted">' + labels[language()].none + '</p>';
      return;
    }

    results.innerHTML = items.map(function (post) {
      return [
        '<article class="post-card">',
        '<div class="post-card-meta"><time>' + post.date + '</time><span>' + post.category + '</span></div>',
        '<h2><a href="' + post.url + '">' + post.title + '</a></h2>',
        '<p>' + post.summary + '</p>',
        post.tags ? '<div class="tag-row">' + post.tags.split(", ").map(function (tag) {
          return '<span>' + tag + '</span>';
        }).join("") + '</div>' : "",
        '</article>'
      ].join("");
    }).join("");
  }

  function runSearch(query) {
    lastQuery = query;
    var q = normalize(query).trim();
    var words = q.split(/\s+/).filter(Boolean);
    var matches = posts.filter(function (post) {
      var haystack = normalize([
        post.title,
        post.summary,
        post.category,
        post.tags
      ].join(" "));
      return words.every(function (word) {
        return haystack.indexOf(word) !== -1;
      });
    });
    render(matches, q);
  }

  fetch(script && script.dataset.searchIndex ? script.dataset.searchIndex : "/search.json")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      posts = data;
      input.value = initialQuery;
      runSearch(initialQuery);
    })
    .catch(function () {
      results.innerHTML = '<p class="muted">' + labels[language()].failed + '</p>';
    });

  input.closest("form").addEventListener("submit", function (event) {
    event.preventDefault();
    runSearch(input.value);
  });

  input.addEventListener("input", function () {
    runSearch(input.value);
  });

  document.addEventListener("site-language-change", function () {
    runSearch(lastQuery);
  });
})();
