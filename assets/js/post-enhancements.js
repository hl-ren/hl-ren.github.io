(function () {
  var prose = document.querySelector(".post-shell .prose");
  var toc = document.getElementById("post-toc");
  if (!prose || !toc) return;

  function slugify(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";
  }

  var used = {};
  var headings = Array.prototype.slice.call(prose.querySelectorAll("h2, h3"));
  if (!headings.length) return;

  var list = document.createElement("ol");

  headings.forEach(function (heading) {
    var text = heading.textContent.trim();
    if (!text) return;

    var base = heading.id || slugify(text);
    used[base] = (used[base] || 0) + 1;
    heading.id = used[base] === 1 ? base : base + "-" + used[base];

    var anchor = document.createElement("a");
    anchor.href = "#" + heading.id;
    anchor.textContent = text;

    var item = document.createElement("li");
    item.className = heading.tagName.toLowerCase() === "h3" ? "is-sub" : "";
    item.appendChild(anchor);
    list.appendChild(item);
  });

  if (!list.children.length) return;

  var title = document.createElement("p");
  title.className = "post-toc-title";
  title.textContent = document.documentElement.lang === "en" ? "On this page" : "本文目录";
  toc.appendChild(title);
  toc.appendChild(list);
  toc.hidden = false;

  document.addEventListener("site-language-change", function (event) {
    title.textContent = event.detail && event.detail.language === "en" ? "On this page" : "本文目录";
  });
})();
