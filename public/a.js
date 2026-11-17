(function () {
  if (typeof window === "undefined" || !navigator.sendBeacon) return;
  var h = location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;

  var ep = "https://my-first-jarvis.duckdns.org/a/hit";

  function send() {
    try {
      var tz = "";
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
      var payload = JSON.stringify({
        site: "github",
        host: location.host,
        path: location.pathname,
        ref: document.referrer || "",
        lang: navigator.language || "",
        w: window.innerWidth || 0,
        tz: tz
      });
      navigator.sendBeacon(ep, new Blob([payload], { type: "text/plain" }));
    } catch (err) {}
  }

  if (document.readyState === "complete") {
    send();
  } else {
    window.addEventListener("load", send, { once: true });
  }

  var prev = location.pathname;
  function checkNav() {
    if (location.pathname !== prev) {
      prev = location.pathname;
      send();
    }
  }

  var wrap = function (type) {
    var orig = history[type];
    return function () {
      var ret = orig.apply(this, arguments);
      checkNav();
      return ret;
    };
  };

  history.pushState = wrap("pushState");
  history.replaceState = wrap("replaceState");
  window.addEventListener("popstate", checkNav);
})();
