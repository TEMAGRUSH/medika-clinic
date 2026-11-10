/* ============================================================
   МЕДИКА — общий скрипт
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Год в подвале ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Тень у шапки ---------- */
  var header = $("#header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Мобильное меню ---------- */
  var burger = $("#burger");
  var nav = $("#nav");
  if (burger && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    };
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    $$(".nav__link", nav).forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1120) closeNav();
    });
  }

  /* ---------- Появление блоков ---------- */
  var revealEls = $$(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  /* ---------- Телефонная маска ---------- */
  function formatPhone(value) {
    var digits = value.replace(/\D/g, "");
    if (digits[0] === "8") digits = "7" + digits.slice(1);
    if (digits[0] !== "7") digits = "7" + digits;
    digits = digits.slice(0, 11);
    var out = "+7";
    if (digits.length > 1) out += " (" + digits.slice(1, 4);
    if (digits.length >= 5) out += ") " + digits.slice(4, 7);
    if (digits.length >= 8) out += "-" + digits.slice(7, 9);
    if (digits.length >= 10) out += "-" + digits.slice(9, 11);
    return out;
  }
  $$('input[type="tel"]').forEach(function (input) {
    input.addEventListener("input", function () {
      var atEnd = input.selectionStart === input.value.length;
      input.value = formatPhone(input.value);
      if (atEnd) input.setSelectionRange(input.value.length, input.value.length);
    });
    input.addEventListener("focus", function () {
      if (!input.value) input.value = "+7 (";
    });
    input.addEventListener("blur", function () {
      if (input.value.replace(/\D/g, "").length <= 1) input.value = "";
    });
  });

  /* ---------- Валидация форм ---------- */
  function setError(field, message) {
    field.classList.add("has-error");
    var msg = $(".error-msg", field);
    if (msg && message) msg.textContent = message;
    var input = $("input, select, textarea", field);
    if (input) input.setAttribute("aria-invalid", "true");
  }
  function clearError(field) {
    field.classList.remove("has-error");
    var input = $("input, select, textarea", field);
    if (input) input.removeAttribute("aria-invalid");
  }

  function validateForm(form) {
    var ok = true;
    var firstBad = null;
    $$("[data-required]", form).forEach(function (input) {
      var field = input.closest(".field");
      if (!field) return;
      clearError(field);
      var value = (input.value || "").trim();
      if (input.type === "checkbox") {
        if (!input.checked) {
          setError(field, "Отметьте согласие, чтобы продолжить");
          ok = false;
          firstBad = firstBad || input;
        }
        return;
      }
      if (!value) {
        setError(field, "Заполните это поле");
        ok = false;
        firstBad = firstBad || input;
        return;
      }
      if (input.type === "tel" && value.replace(/\D/g, "").length !== 11) {
        setError(field, "Введите номер полностью: +7 (___) ___-__-__");
        ok = false;
        firstBad = firstBad || input;
        return;
      }
      if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        setError(field, "Проверьте адрес электронной почты");
        ok = false;
        firstBad = firstBad || input;
      }
    });
    if (firstBad) firstBad.focus({ preventScroll: false });
    return ok;
  }

  $$("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;

      var card = form.closest(".form-card") || form.parentElement;
      var success = card ? $(".form-success", card) : null;
      if (success) {
        form.style.display = "none";
        success.classList.add("is-visible");
        success.setAttribute("tabindex", "-1");
        success.focus();
        if (success.scrollIntoView) {
          success.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        form.reset();
      }
    });

    $$("[data-required]", form).forEach(function (input) {
      var evt = input.type === "checkbox" ? "change" : "input";
      input.addEventListener(evt, function () {
        var field = input.closest(".field");
        if (field) clearError(field);
      });
    });
  });

  /* ---------- Поиск и фильтры ---------- */
  function plural(n, forms) {
    var a = Math.abs(n) % 100;
    var b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  var serviceSearch = $("#serviceSearch");
  var serviceCount = $("#servicesCount");

  function applyServiceFilters() {
    var groups = $$(".service-group");
    if (!groups.length) return;

    var q = serviceSearch ? serviceSearch.value.trim().toLowerCase() : "";
    var activeBtn = $("[data-filter-group] .filter.is-active");
    var cat = activeBtn ? activeBtn.getAttribute("data-filter") : "all";
    var total = 0;

    groups.forEach(function (group) {
      var catOk = cat === "all" || group.getAttribute("data-cat") === cat;
      var visible = 0;
      $$(".price-row", group).forEach(function (row) {
        var match = catOk && (!q || row.textContent.toLowerCase().indexOf(q) !== -1);
        row.style.display = match ? "" : "none";
        if (match) visible++;
      });
      group.style.display = visible ? "" : "none";
      total += visible;
    });

    if (serviceCount) {
      serviceCount.textContent = total + " " + plural(total, ["услуга", "услуги", "услуг"]);
    }
    var empty = $("#servicesEmpty");
    if (empty) empty.classList.toggle("is-visible", total === 0);
  }

  if (serviceSearch) {
    serviceSearch.addEventListener("input", applyServiceFilters);
    var initialQ = new URLSearchParams(window.location.search).get("q");
    if (initialQ) serviceSearch.value = initialQ;
    applyServiceFilters();
  }

  /* ---------- Фильтр карточек врачей ---------- */
  $$("[data-filter-group]").forEach(function (groupEl) {
    var targetSel = groupEl.getAttribute("data-filter-target") || "";
    var isServices = targetSel.indexOf("service-group") !== -1;
    var items = isServices ? [] : $$(targetSel);
    var counterSel = groupEl.getAttribute("data-filter-count");
    var counter = counterSel ? $(counterSel) : null;

    var applyCards = function (value) {
      var shown = 0;
      items.forEach(function (item) {
        var match = value === "all" || item.getAttribute("data-cat") === value;
        item.style.display = match ? "" : "none";
        if (match) shown++;
      });
      if (counter) counter.textContent = shown + " " + plural(shown, ["специалист", "специалиста", "специалистов"]);
    };

    $$("[data-filter]", groupEl).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$("[data-filter]", groupEl).forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
        if (isServices) {
          applyServiceFilters();
        } else {
          applyCards(btn.getAttribute("data-filter"));
        }
      });
    });

    if (!isServices) applyCards("all");
  });

  /* ---------- Карточка врача (модальное окно) ---------- */
  var modal = $("#doctorModal");
  if (modal) {
    var lastFocus = null;
    var openModal = function (data) {
      lastFocus = document.activeElement;
      $("#dmName").textContent = data.name || "";
      $("#dmSpec").textContent = data.spec || "";
      $("#dmPhoto").src = data.photo || "";
      $("#dmPhoto").alt = data.name || "Врач";
      $("#dmAbout").textContent = data.about || "";
      $("#dmExp").textContent = data.exp || "—";
      $("#dmDegree").textContent = data.degree || "—";
      $("#dmPrice").textContent = data.price || "—";

      var edu = $("#dmEducation");
      edu.innerHTML = "";
      (data.education || "").split("|").filter(Boolean).forEach(function (line) {
        var li = document.createElement("li");
        li.textContent = line;
        edu.appendChild(li);
      });

      var book = $("#dmBook");
      if (book) book.setAttribute("href", "appointment.html?doctor=" + encodeURIComponent(data.id || ""));

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var closeBtn = $(".modal__close", modal);
      if (closeBtn) closeBtn.focus();
    };
    var closeModal = function () {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    $$("[data-doctor]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.dataset);
      });
    });
    $$("[data-modal-close]", modal).forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  /* ---------- Аккордеон FAQ: открыт только один ---------- */
  var faqItems = $$(".faq details");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---------- Быстрый поиск на главной ---------- */
  var heroSearch = $("#heroSearch");
  if (heroSearch) {
    heroSearch.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = $("#heroQuery").value.trim();
      window.location.href = "services.html" + (value ? "?q=" + encodeURIComponent(value) : "");
    });
  }

  /* ---------- Подстановка поискового запроса на странице услуг ---------- */
  if (serviceSearch) {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) {
      serviceSearch.value = q;
      serviceSearch.dispatchEvent(new Event("input"));
    }
  }

  /* ---------- Филиалы и карта ---------- */
  var branchCards = $$("[data-branch]");
  if (branchCards.length) {
    var activateBranch = function (id) {
      branchCards.forEach(function (card) {
        card.classList.toggle("is-active", card.getAttribute("data-branch") === id);
      });
      $$("[data-pin]").forEach(function (pin) {
        pin.classList.toggle("is-active", pin.getAttribute("data-pin") === id);
      });
    };
    branchCards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        activateBranch(card.getAttribute("data-branch"));
      });
    });
    $$("[data-pin]").forEach(function (pin) {
      pin.addEventListener("click", function () {
        var id = pin.getAttribute("data-pin");
        activateBranch(id);
        var card = document.querySelector('[data-branch="' + id + '"]');
        if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  /* ---------- Публичный API для страницы записи ---------- */
  window.MEDIKA = { validateForm: validateForm, formatPhone: formatPhone };
})();
