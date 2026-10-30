/* GeometrIA — interações gerais: tema, menu, cabeçalho, filtros de publicações. */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "geometria-theme";
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  /* ---------- Tema claro/escuro ---------- */
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return mq && mq.matches ? "dark" : "light";
  }
  var toggles = document.querySelectorAll("[data-theme-toggle]");
  function syncToggles() {
    for (var i = 0; i < toggles.length; i++) toggles[i].setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false");
  }
  for (var i = 0; i < toggles.length; i++) {
    toggles[i].addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      syncToggles();
      document.dispatchEvent(new CustomEvent("geometria:theme"));
    });
  }
  if (mq) {
    var onMq = function () { syncToggles(); document.dispatchEvent(new CustomEvent("geometria:theme")); };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }
  syncToggles();

  /* ---------- Menu móvel ---------- */
  var menuBtn = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector("[data-nav]");
  function setMenu(open) {
    if (!menuBtn) return;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) { setMenu(false); menuBtn.focus(); }
    });
    var wide = window.matchMedia("(min-width: 1080px)");   // igual ao menu recolhido em main.css
    var onWide = function () { if (wide.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  /* ---------- Cabeçalho com borda ao rolar ---------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Filtros de publicações ---------- */
  var filters = document.querySelector("[data-filters]");
  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-pubs] .pub"));
    var count = filters.querySelector("[data-count]");
    var one = filters.getAttribute("data-one"), many = filters.getAttribute("data-many");
    var buttons = Array.prototype.slice.call(filters.querySelectorAll("button[data-filter]"));
    var apply = function (f) {
      var n = 0;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filter") === f ? "true" : "false"); });
      items.forEach(function (li) {
        var modes = (li.getAttribute("data-modes") || "").split(" ");
        var show = f === "all" || modes.indexOf(f) !== -1;
        li.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = n + " " + (n === 1 ? one : many);
    };
    filters.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button[data-filter]");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      apply(f);
      try { history.replaceState(null, "", f === "all" ? location.pathname : "#" + f); } catch (err) {}
    });
    var fromHash = (location.hash || "").replace("#", "");
    if (fromHash && buttons.some(function (b) { return b.getAttribute("data-filter") === fromHash; })) apply(fromHash);
    // Oculta filtros sem itens
    buttons.forEach(function (b) {
      var f = b.getAttribute("data-filter");
      if (f === "all") return;
      var has = items.some(function (li) { return (li.getAttribute("data-modes") || "").split(" ").indexOf(f) !== -1; });
      if (!has) b.hidden = true;
    });
  }
})();
