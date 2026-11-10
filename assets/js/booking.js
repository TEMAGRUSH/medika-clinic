/* ============================================================
   МЕДИКА — запись на приём (4 шага)
   ============================================================ */
(function () {
  "use strict";

  var root = document.getElementById("booking");
  if (!root) return;

  var $ = function (sel, ctx) { return (ctx || root).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); };

  var SPECIALTIES = {
    therapist: { name: "Терапия", price: 2400 },
    cardiology: { name: "Кардиология", price: 3200 },
    neurology: { name: "Неврология", price: 3100 },
    pediatrics: { name: "Педиатрия", price: 2600 },
    gynecology: { name: "Гинекология", price: 3000 },
    orthopedics: { name: "Ортопедия", price: 3400 },
    gastro: { name: "Гастроэнтерология", price: 3300 },
    diagnostics: { name: "Диагностика", price: 1900 }
  };

  var DOCTORS = [
    {
      id: "sokolova", name: "Соколова Ирина Валерьевна", spec: "cardiology",
      title: "Кардиолог, к.м.н.", exp: 18, price: 3200,
      photo: "assets/img/doctor-sokolova.jpg"
    },
    {
      id: "krylov", name: "Крылов Дмитрий Андреевич", spec: "neurology",
      title: "Невролог", exp: 14, price: 3100,
      photo: "assets/img/doctor-krylov.jpg"
    },
    {
      id: "morozova", name: "Морозова Анна Сергеевна", spec: "pediatrics",
      title: "Педиатр", exp: 11, price: 2600,
      photo: "assets/img/doctor-morozova.jpg"
    },
    {
      id: "levin", name: "Левин Михаил Юрьевич", spec: "orthopedics",
      title: "Ортопед-травматолог", exp: 22, price: 3400,
      photo: "assets/img/doctor-levin.jpg"
    },
    {
      id: "vereshchagina", name: "Верещагина Ольга Петровна", spec: "gynecology",
      title: "Гинеколог, эндокринолог", exp: 16, price: 3000,
      photo: "assets/img/doctor-vereshchagina.jpg"
    },
    {
      id: "danilov", name: "Данилов Артём Игоревич", spec: "gastro",
      title: "Гастроэнтеролог, терапевт", exp: 9, price: 3300,
      photo: "assets/img/doctor-danilov.jpg"
    }
  ];

  var MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля",
    "августа", "сентября", "октября", "ноября", "декабря"];
  var MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var DOW = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

  var state = {
    step: 1,
    specialty: null,
    doctor: null,
    date: null,
    time: null,
    branch: "Патриаршие пруды"
  };

  var nextBtn = $("#nextBtn");
  var prevBtn = $("#prevBtn");
  var titleEl = $("#bookTitle");

  // На первом шаге возвращаться некуда
  prevBtn.style.visibility = "hidden";

  var TITLES = {
    1: "Что вас беспокоит?",
    2: "Выберите врача",
    3: "Дата и время",
    4: "Ваши данные"
  };

  /* ---------- Утилиты ---------- */
  function money(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0") + "\u00A0₽";
  }
  function humanDate(d) {
    return d.getDate() + " " + MONTHS[d.getMonth()] + ", " + DOW[d.getDay()];
  }
  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /* ---------- Шаги ---------- */
  function goTo(step) {
    state.step = step;
    $$(".book-step").forEach(function (el) {
      el.classList.toggle("is-active", Number(el.dataset.step) === step);
    });
    $$(".stepper__item").forEach(function (el) {
      var n = Number(el.dataset.stepLabel);
      el.classList.toggle("is-active", n === step);
      el.classList.toggle("is-done", n < step);
      var num = el.querySelector(".stepper__num");
      if (num) num.innerHTML = n < step ? "&#10003;" : String(n);
    });
    titleEl.textContent = TITLES[step];
    prevBtn.style.visibility = step === 1 ? "hidden" : "visible";
    nextBtn.textContent = step === 4 ? "Записаться на приём" : "Далее";
    if (step === 2) renderDoctors();
    if (step === 3) renderDays();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function currentSpecialty() {
    return state.specialty ? SPECIALTIES[state.specialty] : null;
  }

  /* ---------- Шаг 1 ---------- */
  $$('input[name="specialty"]', root).forEach(function (input) {
    input.addEventListener("change", function () {
      state.specialty = input.value;
      state.doctor = null;
      state.date = null;
      state.time = null;
      updateSummary();
    });
  });

  /* ---------- Шаг 2 ---------- */
  function renderDoctors() {
    var list = $("#doctorList");
    list.innerHTML = "";
    if (!state.specialty) return;

    var spec = currentSpecialty();
    var doctors = DOCTORS.filter(function (d) {
      return d.spec === state.specialty ||
        (state.specialty === "therapist" && d.id === "danilov");
    });

    if (!doctors.length) {
      doctors = [{ id: "any", name: "Любой свободный специалист", title: "Подберём врача по вашему запросу", exp: 0, price: spec.price, photo: "" }];
    }

    doctors.forEach(function (doc, index) {
      var label = document.createElement("label");
      label.className = "choice";
      var photo = doc.photo
        ? '<img src="' + doc.photo + '" alt="' + doc.name + '" loading="lazy">'
        : '<div style="width:100%;height:100%;display:grid;place-items:center;background:var(--brand-50);color:var(--brand-600);font-weight:700;font-size:1.1rem">М</div>';

      label.innerHTML =
        '<input type="radio" name="doctor" value="' + doc.id + '"' + (index === 0 ? "" : "") + '>' +
        '<span class="choice__box">' +
          '<span class="doctor-choice__photo">' + photo + '</span>' +
          '<span class="doctor-choice__text">' +
            '<span class="doctor-choice__name">' + doc.name + '</span>' +
            '<span class="doctor-choice__meta">' + doc.title + (doc.exp ? " · стаж " + doc.exp + " лет" : "") + '</span>' +
          '</span>' +
          '<span class="doctor-choice__price">' + money(doc.price) + '</span>' +
        '</span>';

      var input = label.querySelector("input");
      input.addEventListener("change", function () {
        state.doctor = doc.id;
        state.price = doc.price;
        state.doctorName = doc.name;
        state.date = null;
        state.time = null;
        updateSummary();
      });
      if (state.doctor === doc.id) input.checked = true;
      list.appendChild(label);
    });
  }

  /* ---------- Шаг 3 ---------- */
  function renderDays() {
    var wrap = $("#days");
    wrap.innerHTML = "";
    var today = new Date();
    var added = 0;
    var offset = 1;

    while (added < 12 && offset < 30) {
      var d = new Date(today.getTime() + offset * 86400000);
      offset++;
      if (d.getDay() === 0) continue;

      let btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day";
      btn.innerHTML =
        '<span class="day__dow">' + DOW[d.getDay()] + '</span>' +
        '<span class="day__num">' + d.getDate() + '</span>' +
        '<span class="day__mon">' + MONTHS_SHORT[d.getMonth()] + '</span>';
      (function (date) {
        btn.addEventListener("click", function () {
          state.date = date;
          state.time = null;
          $$(".day", wrap).forEach(function (b) { b.classList.remove("is-active"); });
          btn.classList.add("is-active");
          renderSlots();
          updateSummary();
        });
        if (state.date && date.toDateString() === state.date.toDateString()) {
          btn.classList.add("is-active");
        }
      })(d);

      wrap.appendChild(btn);
      added++;
    }

    if (!state.date) renderSlots();
  }

  function renderSlots() {
    var wrap = $("#slots");
    wrap.innerHTML = "";

    if (!state.date) {
      wrap.innerHTML = '<p style="grid-column:1/-1;color:var(--muted);font-size:0.875rem;margin:0">Сначала выберите дату приёма</p>';
      return;
    }

    var key = state.date.toDateString();
    for (var h = 9; h <= 19; h++) {
      for (var m = 0; m < 60; m += 30) {
        if (h === 19 && m > 0) continue;
        var label = (h < 10 ? "0" + h : h) + ":" + (m === 0 ? "00" : "30");
        let btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot";
        btn.textContent = label;
        var busy = hash(key + label) % 10 < 3;
        if (busy) {
          btn.disabled = true;
        } else {
          (function (time) {
            btn.addEventListener("click", function () {
              state.time = time;
              $$(".slot", wrap).forEach(function (b) { b.classList.remove("is-active"); });
              btn.classList.add("is-active");
              updateSummary();
            });
          })(label);
        }
        if (state.time === label) btn.classList.add("is-active");
        wrap.appendChild(btn);
      }
    }
  }

  /* ---------- Итоги ---------- */
  function updateSummary() {
    var spec = currentSpecialty();
    var price = state.price || (spec ? spec.price : null);

    $("#sumSpec").textContent = spec ? spec.name : "Не выбрано";
    $("#sumDoctor").textContent = state.doctorName || (state.doctor === "any" ? "Любой свободный специалист" : "Не выбран");
    $("#sumDate").textContent = state.date ? humanDate(state.date) : "Не выбрана";
    $("#sumTime").textContent = state.time || "Не выбрано";
    $("#sumPrice").textContent = price ? money(price) : "—";
    $("#branchValue").textContent = state.branch;
  }

  /* ---------- Навигация ---------- */
  prevBtn.addEventListener("click", function () {
    if (state.step > 1) goTo(state.step - 1);
  });

  nextBtn.addEventListener("click", function () {
    if (state.step === 1) {
      if (!state.specialty) {
        var hint = $("#step1Hint");
        hint.textContent = "Выберите направление, чтобы перейти к выбору врача";
        hint.style.color = "#c0392b";
        return;
      }
      goTo(2);
      return;
    }
    if (state.step === 2) {
      if (!state.doctor) {
        var h2 = $("#step2Hint");
        h2.textContent = "Выберите врача или вариант «Любой свободный специалист»";
        h2.style.color = "#c0392b";
        return;
      }
      goTo(3);
      return;
    }
    if (state.step === 3) {
      if (!state.date || !state.time) {
        var h3 = $("#step3Hint");
        h3.textContent = "Выберите дату и удобное время приёма";
        h3.style.color = "#c0392b";
        return;
      }
      goTo(4);
      return;
    }
    submitBooking();
  });

  /* ---------- Отправка ---------- */
  function submitBooking() {
    var form = $("#bookingForm");
    if (window.MEDIKA && window.MEDIKA.validateForm) {
      if (!window.MEDIKA.validateForm(form)) return;
    }

    var code = "МД-" + (1000 + (hash(String(Date.now())) % 9000));
    $("#bookCode").textContent = code;
    $("#successDate").textContent = humanDate(state.date) + ", " + state.time;
    $("#successDoctor").textContent = state.doctorName || "Свободный специалист";
    $("#successBranch").textContent = state.branch;

    $("#bookSteps").style.display = "none";
    $(".stepper").style.display = "none";
    $(".booking__nav").style.display = "none";
    titleEl.style.display = "none";
    $("#bookingSuccess").classList.add("is-visible");
    $(".summary").style.display = "none";
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Филиал ---------- */
  var branchSelect = $("#branchSelect");
  if (branchSelect) {
    branchSelect.addEventListener("change", function () {
      state.branch = branchSelect.options[branchSelect.selectedIndex].text;
      updateSummary();
    });
  }

  /* ---------- Предзаполнение из URL ---------- */
  var params = new URLSearchParams(window.location.search);
  var preDoctor = params.get("doctor");
  var preSpec = params.get("spec");

  if (preDoctor) {
    var doc = DOCTORS.filter(function (d) { return d.id === preDoctor; })[0];
    if (doc) {
      preSpec = doc.spec;
      state.doctor = doc.id;
      state.doctorName = doc.name;
      state.price = doc.price;
    }
  }
  if (preSpec && SPECIALTIES[preSpec]) {
    state.specialty = preSpec;
    var radio = $('input[name="specialty"][value="' + preSpec + '"]');
    if (radio) radio.checked = true;
    updateSummary();
    if (preDoctor) goTo(2);
  }

  updateSummary();
})();
