/* MEDIKA - accessibility mode (versiya dlya slabovidyashchih) */
(function () {
  "use strict";

  var KEY = "medika.a11y.v1";
  var root = document.documentElement;
  var DEFAULTS = { on: false, scheme: "bw", size: "1", images: true, spacing: false };
  var state = {};
  var k;

  for (k in DEFAULTS) state[k] = DEFAULTS[k];
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    for (k in DEFAULTS) if (saved && k in saved) state[k] = saved[k];
  } catch (e) {}

  function apply() {
    if (state.on) root.classList.add("a11y"); else root.classList.remove("a11y");
    root.setAttribute("data-scheme", state.scheme);
    root.setAttribute("data-size", state.size);
    root.setAttribute("data-images", state.images ? "on" : "off");
    root.setAttribute("data-spacing", state.spacing ? "on" : "off");
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var SCHEMES = [
    ["bw", "Чёрным по белому", "#ffffff", "#000000"],
    ["wb", "Белым по чёрному", "#000000", "#ffffff"],
    ["blue", "Синим по голубому", "#9dd1ff", "#002f52"],
    ["beige", "Коричневым по бежевому", "#f3e9d2", "#3a2b12"]
  ];

  var panel, toggle;

  function sync() {
    if (!panel) return;
    var nodes, i;
    nodes = panel.querySelectorAll("[data-a11y-size]");
    for (i = 0; i < nodes.length; i++) nodes[i].setAttribute("aria-pressed", String(nodes[i].getAttribute("data-a11y-size") === state.size));
    nodes = panel.querySelectorAll("[data-a11y-scheme]");
    for (i = 0; i < nodes.length; i++) nodes[i].setAttribute("aria-pressed", String(nodes[i].getAttribute("data-a11y-scheme") === state.scheme));
    nodes = panel.querySelectorAll("[data-a11y-images]");
    for (i = 0; i < nodes.length; i++) nodes[i].setAttribute("aria-pressed", String((nodes[i].getAttribute("data-a11y-images") === "on") === state.images));
    nodes = panel.querySelectorAll("[data-a11y-spacing]");
    for (i = 0; i < nodes.length; i++) nodes[i].setAttribute("aria-pressed", String((nodes[i].getAttribute("data-a11y-spacing") === "on") === state.spacing));
  }

  function schemeButtons() {
    var html = "", i, s;
    for (i = 0; i < SCHEMES.length; i++) {
      s = SCHEMES[i];
      html += '<button type="button" class="a11y-scheme" data-a11y-scheme="' + s[0] + '" aria-pressed="false">' +
        '<span class="a11y-scheme__swatch" style="background:' + s[2] + ';color:' + s[3] + '">A</span>' +
        '<span class="a11y-scheme__name">' + s[1] + '</span></button>';
    }
    return html;
  }

  function openPanel() {
    panel.classList.add("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var c = panel.querySelector("[data-a11y-close]");
    if (c) c.focus();
  }

  function closePanel() {
    panel.classList.remove("is-open");
    if (toggle) { toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    document.body.style.overflow = "";
  }

  function build() {
    var actions = document.querySelector(".header__actions");
    if (!actions || document.getElementById("a11yToggle")) return;

    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "a11y-toggle";
    toggle.id = "a11yToggle";
    toggle.setAttribute("aria-label", "Версия для слабовидящих");
    toggle.setAttribute("title", "Версия для слабовидящих");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "a11yPanel");
    toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.6 10-6.6S22 12 22 12s-3.6 6.6-10 6.6S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>';

    var burger = actions.querySelector(".burger");
    if (burger) actions.insertBefore(toggle, burger); else actions.appendChild(toggle);

    panel = document.createElement("div");
    panel.className = "a11y-panel";
    panel.id = "a11yPanel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Настройки отображения");
    panel.innerHTML =
      '<div class="a11y-panel__head">' +
        '<h2 class="a11y-panel__title">Настройки отображения</h2>' +
        '<button type="button" class="a11y-panel__close" data-a11y-close aria-label="Закрыть"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '</div>' +
      '<div class="a11y-panel__body">' +
        '<div class="a11y-group"><span class="a11y-group__label">Размер шрифта</span><div class="a11y-row">' +
          '<button type="button" class="a11y-chip a11y-chip--a1" data-a11y-size="1" aria-pressed="false">A</button>' +
          '<button type="button" class="a11y-chip a11y-chip--a2" data-a11y-size="2" aria-pressed="false">A</button>' +
          '<button type="button" class="a11y-chip a11y-chip--a3" data-a11y-size="3" aria-pressed="false">A</button>' +
        '</div></div>' +
        '<div class="a11y-group"><span class="a11y-group__label">Цветовая схема</span><div class="a11y-row" style="flex-direction:column">' + schemeButtons() + '</div></div>' +
        '<div class="a11y-group"><span class="a11y-group__label">Изображения</span><div class="a11y-row">' +
          '<button type="button" class="a11y-chip" data-a11y-images="on" aria-pressed="false">Показывать</button>' +
          '<button type="button" class="a11y-chip" data-a11y-images="off" aria-pressed="false">Скрыть</button>' +
        '</div></div>' +
        '<div class="a11y-group"><span class="a11y-group__label">Межбуквенный интервал</span><div class="a11y-row">' +
          '<button type="button" class="a11y-chip" data-a11y-spacing="off" aria-pressed="false">Обычный</button>' +
          '<button type="button" class="a11y-chip" data-a11y-spacing="on" aria-pressed="false">Увеличенный</button>' +
        '</div></div>' +
        '<div class="a11y-panel__actions">' +
          '<button type="button" class="a11y-panel__reset" data-a11y-reset>Обычная версия сайта</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);

    toggle.addEventListener("click", function () {
      if (!state.on) { state.on = true; apply(); save(); sync(); }
      openPanel();
    });

    panel.addEventListener("click", function (e) {
      var el = e.target.closest ? e.target.closest("[data-a11y-size],[data-a11y-scheme],[data-a11y-images],[data-a11y-spacing],[data-a11y-reset],[data-a11y-close]") : null;
      if (!el) return;
      if (el.hasAttribute("data-a11y-close")) { closePanel(); return; }
      if (el.hasAttribute("data-a11y-reset")) {
        state.on = false;
        state.scheme = DEFAULTS.scheme;
        state.size = DEFAULTS.size;
        state.images = DEFAULTS.images;
        state.spacing = DEFAULTS.spacing;
        apply(); save(); sync(); closePanel(); return;
      }
      if (el.hasAttribute("data-a11y-size")) state.size = el.getAttribute("data-a11y-size");
      if (el.hasAttribute("data-a11y-scheme")) state.scheme = el.getAttribute("data-a11y-scheme");
      if (el.hasAttribute("data-a11y-images")) state.images = el.getAttribute("data-a11y-images") === "on";
      if (el.hasAttribute("data-a11y-spacing")) state.spacing = el.getAttribute("data-a11y-spacing") === "on";
      apply(); save(); sync();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) closePanel();
    });

    sync();
  }

  apply();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();