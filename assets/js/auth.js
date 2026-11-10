/* ============================================================
   МЕДИКА — личный кабинет пациента
   Демо-режим: данные хранятся в localStorage браузера
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var KEY = "medika_user";
  var MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  var MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

  /* ---------------- Хранилище ---------------- */
  function readUser() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeUser(user) {
    try { localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {}
  }

  function daysFromNow(n) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d;
  }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function defaultUser(phone) {
    return {
      name: "Ирина Соколова",
      phone: phone || "+7 (916) 204-18-32",
      email: "i.sokolova@example.com",
      birth: "1986-04-12",
      allergies: "Аллергия на пенициллин",
      appointments: [
        {
          id: 1,
          date: iso(daysFromNow(4)),
          time: "18:30",
          doctor: "Соколова И. В.",
          spec: "Кардиолог, к.м.н.",
          place: "Патриаршие пруды, каб. 214",
          type: "Очный приём",
          status: "upcoming"
        },
        {
          id: 2,
          date: iso(daysFromNow(11)),
          time: "11:00",
          doctor: "Морозова А. С.",
          spec: "Педиатр",
          place: "Видеоконсультация",
          type: "Телемедицина",
          status: "upcoming"
        },
        {
          id: 3,
          date: iso(daysFromNow(-36)),
          time: "09:30",
          doctor: "Крылов Д. А.",
          spec: "Невролог",
          place: "Патриаршие пруды, каб. 108",
          type: "Очный приём",
          status: "done"
        }
      ],
      results: [
        { date: iso(daysFromNow(-2)), title: "Общий анализ крови, 26 показателей", lab: "Лаборатория МЕДИКА", status: "ready", note: "Все показатели в пределах нормы" },
        { date: iso(daysFromNow(-2)), title: "Биохимия крови, расширенная панель", lab: "Лаборатория МЕДИКА", status: "ready", note: "Холестерин ЛПНП повышен — обсудите с кардиологом" },
        { date: iso(daysFromNow(-9)), title: "ТТГ, Т4 свободный", lab: "Лаборатория МЕДИКА", status: "ready", note: "Норма" },
        { date: iso(daysFromNow(-1)), title: "Витамин D, 25-OH", lab: "Лаборатория МЕДИКА", status: "progress", note: "Готово 12 ноября" }
      ],
      docs: [
        { date: iso(daysFromNow(-36)), title: "Заключение невролога", type: "PDF · 240 КБ" },
        { date: iso(daysFromNow(-64)), title: "Справка для налогового вычета за 2026 год", type: "PDF · 180 КБ" },
        { date: iso(daysFromNow(-128)), title: "Договор на медицинское обслуживание", type: "PDF · 620 КБ" },
        { date: iso(daysFromNow(-210)), title: "Результаты ЭхоКГ", type: "PDF · 1,2 МБ" }
      ],
      rx: [
        { name: "Бисопролол, 2,5 мг", dose: "1 таблетка утром, ежедневно", term: "до 12 декабря", doctor: "Соколова И. В." },
        { name: "Магний B6", dose: "2 таблетки вечером", term: "курс 30 дней", doctor: "Соколова И. В." }
      ]
    };
  }

  /* ---------------- Утилиты ---------------- */
  function formatDate(str) {
    var d = new Date(str + "T00:00:00");
    return d.getDate() + " " + MONTHS[d.getMonth()];
  }
  function dateParts(str) {
    var d = new Date(str + "T00:00:00");
    return { day: String(d.getDate()).padStart(2, "0"), mon: MONTHS_SHORT[d.getMonth()] };
  }
  function initials(name) {
    return name.split(" ").slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
  }
  function toast(msg) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("is-visible"); }, 3200);
  }

  /* ---------------- Синхронизация шапки ---------------- */
  (function syncHeader() {
    var acc = $(".header__account");
    var user = readUser();
    if (!acc) return;
    if (user) {
      acc.classList.add("is-auth");
      acc.setAttribute("href", "account.html");
      acc.setAttribute("title", "Кабинет: " + user.name);
    } else {
      acc.setAttribute("href", "login.html");
      acc.setAttribute("title", "Вход в личный кабинет");
    }
  })();

  /* ============================================================
     Страница входа
     ============================================================ */
  var loginForm = $("#loginForm");
  if (loginForm) {
    var idInput = $("#loginId");
    var codeInput = $("#loginCode");
    var codeField = $("#codeField");
    var loginBtn = $("#loginBtn");
    var hint = $("#loginHint");
    var step = 1;

    var showError = function (input, box, msg) {
      if (box) { box.textContent = msg; box.hidden = false; }
      if (input) { input.classList.add("has-error"); input.closest(".field").classList.add("has-error"); }
      if (input) input.focus();
    };
    var clearError = function (input, box) {
      if (box) box.hidden = true;
      if (input) { input.classList.remove("has-error"); input.closest(".field").classList.remove("has-error"); }
    };

    idInput.addEventListener("input", function () { clearError(idInput, $("#loginIdError")); });
    codeInput.addEventListener("input", function () {
      codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 4);
      clearError(codeInput, $("#loginCodeError"));
    });

    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (step === 1) {
        var val = idInput.value.trim();
        var isEmail = val.indexOf("@") !== -1;
        var digits = val.replace(/\D/g, "");
        if (!isEmail && digits.length < 10) {
          showError(idInput, $("#loginIdError"), "Введите номер телефона — не меньше 10 цифр");
          return;
        }
        if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
          showError(idInput, $("#loginIdError"), "Проверьте адрес электронной почты");
          return;
        }

        step = 2;
        codeField.hidden = false;
        loginBtn.textContent = "Войти в кабинет";
        hint.innerHTML = "Код отправлен на <b>" + val + "</b>. В демо-режиме код — <b>1234</b>.";
        codeInput.focus();
        return;
      }

      if (codeInput.value !== "1234") {
        showError(codeInput, $("#loginCodeError"), "Неверный код. В демо-режиме код — 1234");
        return;
      }

      var user = defaultUser(idInput.value.indexOf("@") === -1 ? idInput.value.trim() : "");
      writeUser(user);
      var next = new URLSearchParams(window.location.search).get("next") || "account.html";
      if (next.indexOf(":") !== -1 || next.indexOf("//") === 0) next = "account.html";
      window.location.href = next;
    });

    var demo = $("#demoLogin");
    if (demo) {
      demo.addEventListener("click", function () {
        writeUser(defaultUser(""));
        window.location.href = "account.html";
      });
    }
  }

  /* ============================================================
     Кабинет
     ============================================================ */
  var cabinet = $(".cabinet");
  if (!cabinet) return;

  var user = readUser();
  if (!user) {
    window.location.replace("login.html?next=account.html");
    return;
  }

  /* --- Шапка профиля --- */
  var nameEl = $("#profileName");
  var phoneEl = $("#profilePhone");
  var initialsEl = $("#profileInitials");
  var greeting = $("#greeting");

  function renderProfile() {
    if (nameEl) nameEl.textContent = user.name;
    if (phoneEl) phoneEl.textContent = user.phone;
    if (initialsEl) initialsEl.textContent = initials(user.name);
    if (greeting) greeting.textContent = "Здравствуйте, " + user.name.split(" ")[0];
  }

  /* --- Записи --- */
  function apptCard(a, compact) {
    var p = dateParts(a.date);
    var done = a.status === "done";
    var cancelled = a.status === "cancelled";
    var badge = done
      ? '<span class="tag">Завершён</span>'
      : cancelled
        ? '<span class="tag" style="color:#b4453a;background:#fdeeea;border-color:#f6d7cf">Отменён</span>'
        : '<span class="tag tag--green">Подтверждён</span>';

    var actions = "";
    if (!done && !cancelled) {
      var label = a.type === "Телемедицина" ? "Подключиться" : "Как добраться";
      actions =
        '<div class="appt__actions">' +
          '<a class="btn btn--ghost btn--sm" href="telemedicine.html">' + label + '</a>' +
          '<button class="btn btn--plain btn--sm" type="button" data-cancel="' + a.id + '">Отменить</button>' +
        '</div>';
    }

    var meta =
      '<p class="appt__meta">' + a.time + ' · ' + a.type + ' · <b>' + a.place + '</b></p>' +
      (compact ? '' : '<p class="appt__meta" style="margin-top:6px">' + formatDate(a.date) + ' · ' + badge + '</p>');

    return '<div class="appt' + (done || cancelled ? ' is-done' : '') + '">' +
      '<div class="appt__date"><span class="appt__day">' + p.day + '</span><span class="appt__mon">' + p.mon + '</span></div>' +
      '<div>' +
        '<p class="appt__title">' + a.spec + ' · ' + a.doctor + '</p>' +
        meta +
      '</div>' +
      actions +
    '</div>';
  }

  function renderAppts() {
    var list = $("#apptList");
    var next = $("#nextAppt");
    var upcoming = user.appointments.filter(function (a) { return a.status === "upcoming"; });
    var counter = $("#countAppts");

    if (counter) counter.textContent = upcoming.length;

    if (next) {
      next.innerHTML = upcoming.length
        ? apptCard(upcoming[0], true)
        : '<div class="cabinet-empty">Пока нет предстоящих приёмов. <a href="appointment.html">Записаться</a></div>';
    }

    if (list) {
      list.innerHTML = user.appointments.length
        ? user.appointments.map(function (a) { return apptCard(a, false); }).join("")
        : '<div class="cabinet-empty">Записей нет</div>';
    }

    $$("[data-cancel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = Number(btn.getAttribute("data-cancel"));
        user.appointments.forEach(function (a) { if (a.id === id) a.status = "cancelled"; });
        writeUser(user);
        renderAppts();
        toast("Запись отменена. Администратор перезвонит, чтобы подобрать другое время.");
      });
    });
  }

  /* --- Результаты --- */
  function renderResults() {
    var box = $("#resultsList");
    if (!box) return;
    box.innerHTML = user.results.map(function (r) {
      var ready = r.status === "ready";
      return '<div class="row-item">' +
        '<div class="row-item__date">' + formatDate(r.date) + '</div>' +
        '<div><div class="row-item__title">' + r.title + '</div><div class="row-item__sub">' + r.lab + " · " + r.note + '</div></div>' +
        '<div>' + (ready ? '<span class="tag tag--green">Готов</span>' : '<span class="tag">В работе</span>') + '</div>' +
        '<div class="row-item__action">' + (ready
          ? '<button class="btn btn--ghost btn--sm" type="button" data-download="' + r.title + '">Скачать</button>'
          : '<span class="row-item__date">12 ноября</span>') + '</div>' +
      '</div>';
    }).join("");
  }

  /* --- Документы --- */
  function renderDocs() {
    var box = $("#docsList");
    if (!box) return;
    box.innerHTML = user.docs.map(function (d) {
      return '<div class="row-item">' +
        '<div class="row-item__date">' + formatDate(d.date) + '</div>' +
        '<div><div class="row-item__title">' + d.title + '</div><div class="row-item__sub">' + d.type + '</div></div>' +
        '<div></div>' +
        '<div class="row-item__action"><button class="btn btn--ghost btn--sm" type="button" data-download="' + d.title + '">Открыть</button></div>' +
      '</div>';
    }).join("");
  }

  /* --- Назначения --- */
  function renderRx() {
    var box = $("#rxList");
    if (!box) return;
    box.innerHTML = user.rx.map(function (r) {
      return '<div class="rx">' +
        '<div class="rx__head"><span class="rx__name">' + r.name + '</span><span class="tag tag--green">Принимать</span></div>' +
        '<p class="rx__line">' + r.dose + '</p>' +
        '<p class="rx__line"><span>Курс:</span> ' + r.term + ' · <span>Назначил:</span> ' + r.doctor + '</p>' +
      '</div>';
    }).join("");
  }

  /* --- Профиль --- */
  function renderProfileForm() {
    if (!$("#profileForm")) return;
    $("#pfName").value = user.name;
    $("#pfPhone").value = user.phone;
    $("#pfEmail").value = user.email || "";
    $("#pfBirth").value = user.birth || "";
    $("#pfAllergy").value = user.allergies || "";
  }

  var profileForm = $("#profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#pfName").value.trim();
      var phone = $("#pfPhone").value.trim();
      if (name.length < 3) { toast("Укажите имя и фамилию"); return; }
      if (phone.replace(/\D/g, "").length < 10) { toast("Проверьте номер телефона"); return; }

      user.name = name;
      user.phone = phone;
      user.email = $("#pfEmail").value.trim();
      user.birth = $("#pfBirth").value;
      user.allergies = $("#pfAllergy").value.trim();
      writeUser(user);
      renderProfile();
      toast("Данные сохранены");
    });
  }

  /* --- Табы --- */
  var tabs = $$("[data-tab]");
  var panels = $$("[data-panel]");

  function openTab(name, push) {
    var exists = panels.some(function (p) { return p.getAttribute("data-panel") === name; });
    if (!exists) name = "overview";
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-tab") === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
    if (push && history.replaceState) history.replaceState(null, "", "#" + name);
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { openTab(t.getAttribute("data-tab"), true); });
  });

  $$("[data-tab-link]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openTab(link.getAttribute("data-tab-link"), true);
      cabinet.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* --- Скачивание (демо) --- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-download]") : null;
    if (!btn) return;
    toast("Демо-режим: «" + btn.getAttribute("data-download") + "» отправлен на вашу почту");
  });

  /* --- Выход --- */
  var logout = $("#logoutBtn");
  if (logout) {
    logout.addEventListener("click", function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      window.location.href = "login.html";
    });
  }

  renderProfile();
  renderProfileForm();
  renderAppts();
  renderResults();
  renderDocs();
  renderRx();
  openTab((window.location.hash || "#overview").slice(1), false);
})();
