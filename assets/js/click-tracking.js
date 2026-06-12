(function () {
  var script = document.currentScript;
  var trackOutbound = script && script.dataset.trackOutbound === "true";

  function isExternalLink(link) {
    return link.hostname && link.hostname !== window.location.hostname;
  }

  function trackClick(link) {
    if (!window.goatcounter || typeof window.goatcounter.count !== "function") return;

    var label = link.dataset.trackClick || link.href;
    window.goatcounter.count({
      path: "click:" + label,
      title: document.title,
      event: true
    });
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (!link) return;

    if (link.dataset.trackClick || (trackOutbound && isExternalLink(link))) {
      trackClick(link);
    }
  });
})();
