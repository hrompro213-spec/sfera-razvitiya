const THEME_STORAGE_KEY = "sfera-theme";
// URL веб-приложения Google Apps Script (google-apps-script/Code.gs), оканчивается на /exec.
const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbwUFxH2SjkC3WX0CpgTNHn3ZJ1AIpJXE6Kx_NKgGCpYQZ3ESEYAc9iE-ijVazIb5Pau/exec";
// Номер счётчика Яндекс.Метрики. Должен совпадать с ym(...) в index.html и thank-you.html.
const METRIKA_COUNTER_ID = "114274834";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const ANALYTICS_GOALS = {
  maxClick: "click_max",
  whatsappClick: "click_whatsapp",
  phoneClick: "click_phone",
  smsClick: "click_sms",
  telegramClick: "click_telegram",
  vkClick: "click_vk",
  emailClick: "click_email",
  formSubmit: "form_submit",
  thankYouRedirect: "thank_you_page_redirect",
  thankYouView: "thank_you_view",
  heroCtaClick: "hero_cta_click",
  pricingClick: "pricing_click",
  sferaQuestion: "sfera_question"
};

const CONTACT_ANALYTICS_GOALS = {
  max: ANALYTICS_GOALS.maxClick,
  phone: ANALYTICS_GOALS.phoneClick,
  whatsapp: ANALYTICS_GOALS.whatsappClick,
  telegram: ANALYTICS_GOALS.telegramClick,
  vk: ANALYTICS_GOALS.vkClick,
  email: ANALYTICS_GOALS.emailClick,
  sms: ANALYTICS_GOALS.smsClick
};

const CONTACT_CONFIG = {
  channels: {
    max: {
      label: "MAX",
      shortLabel: "MAX",
      displayValue: "MAX",
      href: "https://max.ru/u/f9LHodD0cOIm5I3ZWYpkPE-hwEkZxMSVgINMWR4_n5Te3Z4QABp1GVYDHuQ",
      active: true,
      visible: true,
      placements: ["contact", "widget", "mobile", "thankyou"]
    },
    phone: {
      label: "Позвонить",
      shortLabel: "Позвонить",
      widgetLabel: "Телефон",
      displayValue: "+7 987 261 77 79",
      href: "tel:+79872617779",
      active: true,
      visible: true,
      placements: ["contact", "widget", "mobile", "thankyou"]
    },
    whatsapp: {
      label: "WhatsApp",
      shortLabel: "WhatsApp",
      href: "https://wa.me/79872617779",
      active: true,
      visible: true,
      placements: ["contact", "widget", "mobile", "thankyou"]
    },
    telegram: {
      label: "Telegram",
      shortLabel: "Telegram",
      displayValue: "@Tatiana_SferaR",
      href: "https://t.me/Tatiana_SferaR",
      active: true,
      visible: true,
      placements: ["contact"]
    },
    vk: {
      label: "VK",
      shortLabel: "VK",
      href: "https://m.vk.com/sferaon",
      active: true,
      visible: true,
      placements: ["contact"]
    },
    email: {
      label: "Email",
      shortLabel: "Email",
      displayValue: "zadonskaya.tanja@yandex.ru",
      href: "mailto:zadonskaya.tanja@yandex.ru",
      active: true,
      visible: true,
      placements: ["contact", "widget", "mobile", "thankyou"]
    },
    sms: {
      label: "SMS",
      shortLabel: "SMS",
      href: "sms:+79872617779",
      active: true,
      visible: true,
      placements: ["contact"]
    }
  },
  max: {
    label: "MAX",
    qrImage: "images/max-qr.jpg",
    directUrl: "https://max.ru/u/f9LHodD0cOIm5I3ZWYpkPE-hwEkZxMSVgINMWR4_n5Te3Z4QABp1GVYDHuQ"
  }
};

window.SFERA_CONTACTS = CONTACT_CONFIG;

// Липкая мобильная панель держит ровно три канала: четвёртый уводил её
// во второй ряд (114 px вместо 64). E-mail из панели убран, но остаётся
// в блоке контактов, в панели «Сферы» и на thank-you.html.
const MOBILE_BAR_CHANNELS = ["max", "phone", "whatsapp"];

const TARIFF_MESSAGES = {
  "oge-individual": "Здравствуйте! Интересует индивидуальная подготовка к ОГЭ, 1 500 ₽ за час.",
  "oge-vip": "Здравствуйте! Интересует VIP-группа (2–3 человека) по подготовке к ОГЭ, 1 000 ₽ за час.",
  "oge-group": "Здравствуйте! Интересует групповое занятие по подготовке к ОГЭ, 500 ₽ за час."
};

const COPY_TOAST_TIMEOUT = 5000;
// Длительность появления панели «Сферы» — совпадает с transition в styles.css.
const SFERA_PANEL_ANIMATION_MS = 220;
// Шапка получает фон после этой прокрутки (класс .is-scrolled).
const HEADER_SCROLL_THRESHOLD = 24;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
// Сколько ждём колбэк Метрики перед переходом на thank-you.html (страховка от блокировщиков).
const FORM_REDIRECT_TIMEOUT_MS = 300;
let copyToastTimer = null;
// Закрыватели модальных слоёв: меню и панель «Сферы» не открываются одновременно.
let closeSferaPanel = null;
let closeSiteMenu = null;

const HERO_STORAGE_KEY = "sfera-hero-image";
const HERO_FALLBACK_IMAGE = "images/hero.jpg";

// Доступные кадры шапки: изображения подготовлены из исходников бренда в images/hero/.
const HERO_IMAGES = {
  winter: {
    day: "images/hero/hero-winter-day.webp",
    evening: "images/hero/hero-winter-evening.webp"
  },
  spring: {
    day: "images/hero/hero-spring-day.webp",
    evening: "images/hero/hero-spring-evening.webp"
  },
  summer: {
    day: "images/hero/hero-summer-day.webp",
    evening: "images/hero/hero-summer-evening.webp"
  },
  autumn: {
    day: "images/hero/hero-autumn-day.webp",
    evening: "images/hero/hero-autumn-evening.webp"
  }
};

// FAQ размечен в index.html статически: секция читается и без JS, а скрипт
// только навешивает раскрытие. Вопросы и ответы совпадают с JSON-LD FAQPage.

function getElement(id) {
  return document.getElementById(id);
}

function getMetrikaCounterId() {
  return window.SFERA_METRIKA_COUNTER_ID || METRIKA_COUNTER_ID;
}

// onSent — необязательный колбэк Метрики: срабатывает, когда цель отправлена.
// Возвращает true, если цель реально передана в ym().
function reachAnalyticsGoal(goalName, params = {}, onSent) {
  if (!goalName) {
    return false;
  }

  const counterId = getMetrikaCounterId();
  const canSendToMetrika = typeof window.ym === "function" && Boolean(counterId);

  if (canSendToMetrika) {
    if (typeof onSent === "function") {
      window.ym(counterId, "reachGoal", goalName, params, onSent);
    } else {
      window.ym(counterId, "reachGoal", goalName, params);
    }
  }

  window.dispatchEvent(new CustomEvent("sfera:analyticsGoal", {
    detail: {
      goalName,
      params
    }
  }));

  return canSendToMetrika;
}

window.SFERA_ANALYTICS = {
  goals: ANALYTICS_GOALS,
  reachGoal: reachAnalyticsGoal
};

function isChannelAvailable(channel) {
  return Boolean(channel?.active && channel.visible !== false && channel.href);
}

function getChannel(key) {
  const channel = CONTACT_CONFIG.channels[key];

  return isChannelAvailable(channel) ? channel : null;
}

function getChannelKey(channel) {
  return Object.entries(CONTACT_CONFIG.channels).find(([, item]) => item === channel)?.[0] || "";
}

function getContactFallbackChannels() {
  return ["max", "phone", "whatsapp", "telegram", "vk", "email", "sms"].map(getChannel).filter(Boolean);
}

function createContactAnchor(channel, placement) {
  const link = document.createElement("a");
  const channelKey = getChannelKey(channel);
  const label = placement === "widget" && channel.widgetLabel
    ? channel.widgetLabel
    : placement === "mobile" && channel.shortLabel
      ? channel.shortLabel
      : channel.label;

  link.href = channel.href;
  link.textContent = label;
  link.setAttribute("aria-label", channel.label);

  if (channelKey) {
    link.dataset.contactLink = channelKey;
  }

  return link;
}

function getChannelsForPlacement(placement) {
  return Object.values(CONTACT_CONFIG.channels).filter((channel) => {
    return isChannelAvailable(channel) && channel.placements.includes(placement);
  });
}

function initConfiguredContactLinks() {
  document.querySelectorAll("[data-contact-link]").forEach((link) => {
    const channel = getChannel(link.dataset.contactLink);

    if (!channel) {
      link.classList.add("is-hidden");
      link.removeAttribute("href");
      return;
    }

    link.href = channel.href;

    if (link.hasAttribute("data-contact-phone") && channel.displayValue) {
      // В шапке рядом с номером стоит иконка трубки — меняем только текст,
      // остальные ссылки (футер, меню, липкая панель) переписываем целиком.
      const label = link.querySelector("[data-phone-text]");

      if (label) {
        label.textContent = channel.displayValue;
      } else {
        link.textContent = channel.displayValue;
      }
    }
  });
}

function getContactGoal(channelKey) {
  return CONTACT_ANALYTICS_GOALS[channelKey];
}

function prefersReducedMotion() {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches === true;
}

function initAnalyticsEvents() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-contact-link], [data-analytics-goal]");

    if (!target) {
      return;
    }

    const contactGoal = getContactGoal(target.dataset.contactLink);

    if (contactGoal) {
      reachAnalyticsGoal(contactGoal, {
        channel: target.dataset.contactLink,
        text: target.textContent.trim()
      });
    }

    if (target.dataset.analyticsGoal) {
      reachAnalyticsGoal(target.dataset.analyticsGoal, {
        label: target.dataset.analyticsLabel || "",
        tariff: target.dataset.tariff || "",
        text: target.textContent.trim()
      });
    }
  });
}

// Набор каналов для конкретного списка. Размещения (`placements`) не трогаем:
// единственное ограничение — липкая мобильная панель держит три канала и один ряд.
function getChannelsForList(placement) {
  const channels = getChannelsForPlacement(placement);

  if (placement !== "mobile") {
    return channels;
  }

  return channels.filter((channel) => MOBILE_BAR_CHANNELS.includes(getChannelKey(channel)));
}

function initContactLists() {
  document.querySelectorAll("[data-contact-list]").forEach((root) => {
    const placement = root.dataset.contactList;
    const channels = getChannelsForList(placement);

    if (!channels.length) {
      root.closest(".sfera-panel-contacts, .mobile-sticky-bar, .contact-card")?.classList.add("is-hidden");
      return;
    }

    root.replaceChildren(...channels.map((channel) => createContactAnchor(channel, placement)));
  });
}

// «Сфера»: кнопка-персонаж и панель связи. Состояние не сохраняется —
// после перезагрузки панель всегда закрыта (в разметке атрибут hidden и aria-expanded="false").
function initSferaWidget() {
  const launcher = document.querySelector("[data-sfera-launcher]");
  const panel = getElement("sferaPanel");

  if (!launcher || !panel) {
    return;
  }

  const overlay = document.querySelector("[data-sfera-overlay]");
  const closeButton = panel.querySelector("[data-sfera-close]");
  const questionLinks = [...panel.querySelectorAll("[data-sfera-anchor]")];
  let hideTimer = null;

  const isOpen = () => launcher.getAttribute("aria-expanded") === "true";

  // Липкая панель на телефоне бывает выше одного ряда кнопок, поэтому её высоту
  // меряем по факту: кнопка и панель «Сферы» должны стоять строго над ней.
  function syncBarOffset() {
    const bar = document.querySelector(".mobile-sticky-bar");
    const root = document.documentElement;

    if (!bar || getComputedStyle(bar).display === "none") {
      root.style.removeProperty("--sfera-bar-height");
      return;
    }

    const height = Math.round(window.innerHeight - bar.getBoundingClientRect().top);
    root.style.setProperty("--sfera-bar-height", `${height}px`);
  }

  syncBarOffset();

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(syncBarOffset);
  });

  function openPanel() {
    window.clearTimeout(hideTimer);
    // Меню и панель «Сферы» — два модальных слоя, одновременно не открываются.
    closeSiteMenu?.();
    panel.hidden = false;

    if (overlay) {
      overlay.hidden = false;
    }

    // Принудительный reflow: transition должен стартовать из скрытого состояния.
    void panel.offsetHeight;

    panel.classList.add("is-open");
    overlay?.classList.add("is-open");
    document.body.classList.add("is-sfera-open");
    launcher.setAttribute("aria-expanded", "true");
    closeButton?.focus({ preventScroll: true });
  }

  function closePanel({ returnFocus = false } = {}) {
    if (!isOpen()) {
      return;
    }

    window.clearTimeout(hideTimer);

    panel.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    document.body.classList.remove("is-sfera-open");
    launcher.setAttribute("aria-expanded", "false");

    // hidden возвращаем после анимации, иначе панель исчезнет рывком.
    hideTimer = window.setTimeout(() => {
      if (!isOpen()) {
        panel.hidden = true;

        if (overlay) {
          overlay.hidden = true;
        }
      }
    }, SFERA_PANEL_ANIMATION_MS);

    if (returnFocus) {
      launcher.focus({ preventScroll: true });
    }
  }

  // Меню вызывает этот закрыватель, когда открывается поверх «Сферы».
  closeSferaPanel = () => closePanel();

  function scrollToQuestionAnchor(target, hash) {
    window.history.replaceState(null, "", hash);

    window.setTimeout(() => {
      const header = document.querySelector("header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      });
    }, 80);
  }

  launcher.addEventListener("click", () => {
    if (isOpen()) {
      closePanel();
      return;
    }

    openPanel();
  });

  closeButton?.addEventListener("click", () => closePanel({ returnFocus: true }));
  overlay?.addEventListener("click", () => closePanel({ returnFocus: true }));

  questionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.dataset.sferaAnchor || link.getAttribute("href") || "";
      const target = hash ? document.querySelector(hash) : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      closePanel();
      scrollToQuestionAnchor(target, hash);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      closePanel({ returnFocus: true });
    }
  });

  // Клик вне панели закрывает её; клики внутри панели и по кнопке — нет.
  document.addEventListener("click", (event) => {
    if (!isOpen()) {
      return;
    }

    const target = event.target;

    if (panel.contains(target) || launcher.contains(target)) {
      return;
    }

    closePanel();
  });
}

function initMaxContact() {
  const { max } = CONTACT_CONFIG;
  const qr = document.querySelector("[data-max-qr]");
  const caption = document.querySelector("[data-max-caption]");

  if (qr && max.qrImage) {
    qr.src = max.qrImage;
  }

  if (caption) {
    caption.textContent = "QR для связи в MAX";
  }
}

function getSeason(month) {
  if (month === 11 || month <= 1) {
    return "winter";
  }

  if (month <= 4) {
    return "spring";
  }

  if (month <= 7) {
    return "summer";
  }

  return "autumn";
}

function getHeroImage(now = new Date()) {
  const seasonImages = HERO_IMAGES[getSeason(now.getMonth())];

  if (!seasonImages) {
    return HERO_FALLBACK_IMAGE;
  }

  const hour = now.getHours();
  const partOfDay = hour >= 18 || hour < 6 ? "evening" : "day";

  return seasonImages[partOfDay] || seasonImages.day || HERO_FALLBACK_IMAGE;
}

function initHeroImage() {
  const image = document.querySelector("[data-hero-image]");

  if (!image) {
    return;
  }

  let source = "";

  try {
    source = sessionStorage.getItem(HERO_STORAGE_KEY) || "";
  } catch {
    source = "";
  }

  if (!source) {
    source = getHeroImage();

    try {
      sessionStorage.setItem(HERO_STORAGE_KEY, source);
    } catch {
      // sessionStorage недоступен — работаем без кэша на сессию.
    }
  }

  image.addEventListener("error", () => {
    if (image.getAttribute("src") !== HERO_FALLBACK_IMAGE) {
      image.src = HERO_FALLBACK_IMAGE;
    }
  });

  if (source && image.getAttribute("src") !== source) {
    image.src = source;
  }
}

// Шапка: после 24 px прокрутки — фон, линия и тень. Класс переключаем
// в rAF, чтобы обработчик оставался дешёвым.
function initHeaderScroll() {
  const header = document.querySelector(".site-header");

  if (!header) {
    return;
  }

  let frame = 0;

  const sync = () => {
    header.classList.toggle("is-scrolled", window.scrollY > HEADER_SCROLL_THRESHOLD);
    frame = 0;
  };

  sync();

  window.addEventListener("scroll", () => {
    if (!frame) {
      frame = window.requestAnimationFrame(sync);
    }
  }, { passive: true });
}

// Мобильное меню: выезжает панелью справа. Закрывается по Esc, клику вне,
// кнопке «Закрыть» и переходу по ссылке; пока открыто — фон не скроллится.
function initSiteMenu() {
  const menu = document.querySelector("[data-mobile-menu]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const closeButton = document.querySelector("[data-menu-close]");
  const scrim = document.querySelector("[data-menu-scrim]");

  if (!menu || !toggle) {
    return;
  }

  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const isOpen = () => document.body.classList.contains("is-menu-open");

  function openMenu() {
    if (isOpen()) {
      return;
    }

    // Панель «Сферы» и меню не должны быть открыты одновременно.
    closeSferaPanel?.();
    document.body.classList.add("is-menu-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Закрыть меню");
    closeButton?.focus({ preventScroll: true });
  }

  function closeMenu({ returnFocus = false } = {}) {
    if (!isOpen()) {
      return;
    }

    document.body.classList.remove("is-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Открыть меню");

    if (returnFocus) {
      toggle.focus({ preventScroll: true });
    }
  }

  closeSiteMenu = () => closeMenu();

  toggle.addEventListener("click", () => {
    if (isOpen()) {
      closeMenu({ returnFocus: true });
      return;
    }

    openMenu();
  });

  closeButton?.addEventListener("click", () => closeMenu({ returnFocus: true }));
  scrim?.addEventListener("click", () => closeMenu({ returnFocus: true }));

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      closeMenu({ returnFocus: true });
    }
  });

  // На десктопе панели нет — состояние сбрасываем, иначе фон останется заблокированным.
  const handleBreakpoint = () => {
    if (!mobileQuery.matches) {
      closeMenu();
    }
  };

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleBreakpoint);
  }

  window.addEventListener("resize", handleBreakpoint);
}

function setTheme(theme) {
  const themeBtn = getElement("themeBtn");
  const themeLabel = theme === "dark" ? "Светлая" : "Тёмная";

  document.body.dataset.theme = theme;

  if (themeBtn) {
    const label = themeBtn.querySelector(".theme-btn-text");

    if (label) {
      label.textContent = themeLabel;
    } else {
      // Кнопки без разметки иконок (служебные страницы) получают только текст.
      themeBtn.textContent = themeLabel;
    }
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function initTheme() {
  const themeBtn = getElement("themeBtn");
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  setTheme(savedTheme === "dark" ? "dark" : "light");

  themeBtn?.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });
}

function initFaq() {
  const faqRoot = getElement("faqList");

  if (!faqRoot) {
    return;
  }

  faqRoot.querySelectorAll(".faq-item").forEach((item) => {
    const button = item.querySelector(".faq-question");

    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      setFaqItemState(item, !item.classList.contains("is-open"));
    });
  });
}

// Аккордеонов секций больше нет (17.11.2026): #results, #format и #trust
// всегда раскрыты. Аккордеон остался только у FAQ.
function setFaqItemState(item, expanded) {
  const button = item.querySelector(".faq-question");
  const answerBlock = item.querySelector(".faq-answer");

  if (!button || !answerBlock) {
    return;
  }

  item.classList.toggle("is-open", expanded);
  button.setAttribute("aria-expanded", String(expanded));
  answerBlock.style.maxHeight = expanded ? `${answerBlock.scrollHeight}px` : "0";
}

// Хэш-навигация: если якорь ведёт внутрь FAQ (например, #faq-answer-3),
// раскрываем этот вопрос, чтобы ответ был виден. Секции открыты всегда,
// поэтому других сценариев у функции не осталось.
function expandCollapsibleFromHash() {
  const id = window.location.hash.slice(1);

  if (!id) {
    return;
  }

  const target = document.getElementById(id);

  if (!target) {
    return;
  }

  const item = target.closest(".faq-item");

  if (item) {
    setFaqItemState(item, true);
  }
}

// Ссылки на форму (#application-form): плавный скролл с поправкой на высоту
// шапки. Новых целей Метрики эти ссылки не отправляют.
function scrollToApplicationForm() {
  const target = getElement("application-form");

  if (!target) {
    return;
  }

  window.history.replaceState(null, "", "#application-form");

  window.setTimeout(() => {
    const header = document.querySelector("header");
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });
  }, 80);
}

function initFormAnchorLinks() {
  document.querySelectorAll('a[href="#application-form"]').forEach((link) => {
    // У панели «Сферы» свой обработчик: он ещё и закрывает панель.
    if (link.closest(".sfera-panel")) {
      return;
    }

    link.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToApplicationForm();
    });
  });
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function initMaxCopy() {
  const copyButton = document.querySelector("[data-copy-max]");

  if (!copyButton) {
    return;
  }

  copyButton.addEventListener("click", async () => {
    const maxContact = CONTACT_CONFIG.max.directUrl;

    try {
      await copyText(maxContact);
      copyButton.textContent = "Контакт MAX скопирован";
      copyButton.classList.add("is-copied");

      setTimeout(() => {
        copyButton.textContent = "Скопировать ссылку MAX";
        copyButton.classList.remove("is-copied");
      }, 2200);
    } catch {
      copyButton.textContent = "Не удалось скопировать";
    }
  });
}

function showCopyToast() {
  const toast = getElement("copyToast");

  if (!toast) {
    return;
  }

  toast.classList.add("is-visible");
  clearTimeout(copyToastTimer);
  copyToastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, COPY_TOAST_TIMEOUT);
}

function copyTariffMessage(message) {
  if (!navigator.clipboard?.writeText) {
    return Promise.resolve(false);
  }

  return navigator.clipboard.writeText(message).then(
    () => true,
    () => false
  );
}

function initTariffClicks() {
  document.querySelectorAll("a.price[data-tariff]").forEach((link) => {
    link.addEventListener("click", () => {
      const message = TARIFF_MESSAGES[link.dataset.tariff];

      if (!message) {
        return;
      }

      copyTariffMessage(message).then((copied) => {
        if (copied) {
          showCopyToast();
        }
      });
    });
  });
}

function fillTrackingFields(form) {
  const params = new URLSearchParams(window.location.search);

  UTM_FIELDS.forEach((fieldName) => {
    const field = form.elements[fieldName];

    if (field) {
      field.value = params.get(fieldName) || "";
    }
  });

  if (form.elements.referrer) {
    form.elements.referrer.value = document.referrer || "";
  }

  if (form.elements.landing_url) {
    form.elements.landing_url.value = window.location.href;
  }

  if (form.elements.user_agent) {
    form.elements.user_agent.value = navigator.userAgent || "";
  }
}

function getNormalizedPhone(value) {
  return value.replace(/\D/g, "");
}

function isValidPhone(value) {
  const digits = getNormalizedPhone(value);

  return digits.length >= 10 && digits.length <= 15;
}

function setFormMessage(messageEl, text, type = "error") {
  if (!messageEl) {
    return;
  }

  messageEl.textContent = text;
  messageEl.classList.toggle("is-error", type === "error");
  messageEl.classList.toggle("is-success", type === "success");
}

function setSubmitState(button, isSubmitting) {
  if (!button) {
    return;
  }

  if (!button.dataset.defaultText) {
    button.dataset.defaultText = button.textContent;
  }

  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? "Отправляем..." : button.dataset.defaultText;
}

function renderFormErrorContacts(root) {
  if (!root) {
    return;
  }

  const channels = getContactFallbackChannels();

  if (!channels.length) {
    root.classList.add("is-hidden");
    root.replaceChildren();
    return;
  }

  const note = document.createElement("span");
  note.textContent = "Можно связаться напрямую:";

  root.replaceChildren(note, ...channels.map((channel) => createContactAnchor(channel, "contact")));
  root.classList.remove("is-hidden");
}

function hideFormErrorContacts(root) {
  root?.classList.add("is-hidden");
}

function validateApplicationForm(form, messageEl) {
  const phone = form.elements.phone;
  const honeypot = form.elements.website;

  if (honeypot?.value) {
    return false;
  }

  if (!form.checkValidity()) {
    setFormMessage(messageEl, "Пожалуйста, заполните все поля и подтвердите согласие на обработку данных.");
    form.reportValidity();
    return false;
  }

  if (!isValidPhone(phone.value)) {
    setFormMessage(messageEl, "Пожалуйста, укажите корректный телефон: минимум 10 цифр, можно с кодом страны.");
    phone.focus();
    return false;
  }

  return true;
}

async function submitApplicationForm(form) {
  const formData = new FormData(form);

  formData.append("submitted_at", new Date().toISOString());

  await fetch(FORM_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    body: new URLSearchParams(formData)
  });
}

// Переход на thank-you.html: ждём, пока Метрика отправит form_submit,
// но не дольше FORM_REDIRECT_TIMEOUT_MS — иначе посетитель «залипнет» с блокировщиком.
function redirectToThankYouPage(goalName, params = {}) {
  let isRedirected = false;

  const goToThankYou = () => {
    if (isRedirected) {
      return;
    }

    isRedirected = true;
    window.location.href = "thank-you.html";
  };

  window.setTimeout(goToThankYou, FORM_REDIRECT_TIMEOUT_MS);

  if (!reachAnalyticsGoal(goalName, params, goToThankYou)) {
    // Метрики нет или счётчик не загрузился — не ждём таймаут.
    goToThankYou();
  }
}

function initApplicationForm() {
  const form = getElement("application-form");

  if (!form) {
    return;
  }

  const messageEl = form.querySelector("[data-form-message]");
  const submitButton = form.querySelector(".form-submit");
  const errorContacts = form.querySelector("[data-form-error-contacts]");

  fillTrackingFields(form);

  document.querySelectorAll("[data-tariff]").forEach((button) => {
    button.addEventListener("click", () => {
      if (form.elements.selected_plan) {
        form.elements.selected_plan.value = button.dataset.tariff || "";
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideFormErrorContacts(errorContacts);

    if (!validateApplicationForm(form, messageEl)) {
      return;
    }

    if (!FORM_ENDPOINT) {
      setFormMessage(messageEl, "Форма почти готова: нужно подключить Google Apps Script endpoint. Пока можно написать или позвонить напрямую.");
      renderFormErrorContacts(errorContacts);
      return;
    }

    setSubmitState(submitButton, true);
    setFormMessage(messageEl, "Отправляем заявку...", "success");

    try {
      await submitApplicationForm(form);
      reachAnalyticsGoal(ANALYTICS_GOALS.thankYouRedirect, {
        url: "thank-you.html"
      });
      redirectToThankYouPage(ANALYTICS_GOALS.formSubmit, {
        preferredContact: form.elements.preferred_contact?.value || "",
        childGrade: form.elements.child_grade?.value || ""
      });
    } catch {
      setFormMessage(messageEl, "Не получилось отправить заявку. Пожалуйста, попробуйте ещё раз или свяжитесь с нами напрямую.");
      renderFormErrorContacts(errorContacts);
      setSubmitState(submitButton, false);
    }
  });
}

function initThankYouGoal() {
  if (document.body.dataset.page !== "thank-you") {
    return;
  }

  reachAnalyticsGoal(ANALYTICS_GOALS.thankYouView, {
    path: window.location.pathname
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHeaderScroll();
  initSiteMenu();
  initHeroImage();
  initFaq();
  initFormAnchorLinks();
  initConfiguredContactLinks();
  initContactLists();
  initSferaWidget();
  initMaxContact();
  initMaxCopy();
  initTariffClicks();
  initAnalyticsEvents();
  initThankYouGoal();
  initApplicationForm();
  expandCollapsibleFromHash();
  window.addEventListener("hashchange", expandCollapsibleFromHash);
});
