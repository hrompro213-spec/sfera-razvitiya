const THEME_STORAGE_KEY = "sfera-theme";
const START_DATE = new Date("2026-06-15T00:00:00+03:00").getTime();
// TODO: вставить URL веб-приложения Google Apps Script после деплоя формы.
const FORM_ENDPOINT = "";
// TODO: после создания счётчика Яндекс.Метрики указать его ID.
const METRIKA_COUNTER_ID = "";
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
  heroCtaClick: "hero_cta_click",
  pricingClick: "pricing_click"
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
      displayValue: "zadonskayamarta@gmail.com",
      href: "mailto:zadonskayamarta@gmail.com",
      active: true,
      visible: true,
      placements: ["contact"]
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

const faqs = [
  {
    question: "Что будет на бесплатной диагностике?",
    answer: "Познакомимся с ребёнком, определим текущий уровень, обсудим трудности и подберём подходящий формат занятий."
  },
  {
    question: "Можно ли заниматься только русским или только математикой?",
    answer: "Да. Формат можно подобрать индивидуально после вводной встречи."
  },
  {
    question: "Подойдут ли занятия, если ребёнок сильно отстал?",
    answer: "Да. Мы начинаем с диагностики и двигаемся от текущего уровня ребёнка, без давления и сравнения с другими."
  },
  {
    question: "Что такое нейротренировки?",
    answer: "Это упражнения на внимание, память, логику, речь и скорость мышления. Они помогают ребёнку легче воспринимать и запоминать учебный материал."
  },
  {
    question: "Можно ли заниматься индивидуально?",
    answer: "Да. Индивидуальные занятия подойдут, если ребёнку нужен личный темп или точечная помощь."
  },
  {
    question: "Где проходят занятия?",
    answer: "Онлайн в Zoom. Ребёнку нужен интернет, компьютер или планшет и спокойное место для урока."
  }
];

function getElement(id) {
  return document.getElementById(id);
}

function reachAnalyticsGoal(goalName, params = {}) {
  if (!goalName) {
    return;
  }

  const counterId = window.SFERA_METRIKA_COUNTER_ID || METRIKA_COUNTER_ID;

  if (typeof window.ym === "function" && counterId) {
    window.ym(counterId, "reachGoal", goalName, params);
  }

  window.dispatchEvent(new CustomEvent("sfera:analyticsGoal", {
    detail: {
      goalName,
      params
    }
  }));
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
      link.textContent = channel.displayValue;
    }
  });
}

function getContactGoal(channelKey) {
  return CONTACT_ANALYTICS_GOALS[channelKey];
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

function initContactLists() {
  document.querySelectorAll("[data-contact-list]").forEach((root) => {
    const placement = root.dataset.contactList;
    const channels = getChannelsForPlacement(placement);

    if (!channels.length) {
      root.closest(".floating-widget, .mobile-sticky-bar, .contact-card")?.classList.add("is-hidden");
      return;
    }

    root.replaceChildren(...channels.map((channel) => createContactAnchor(channel, placement)));
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

function setTheme(theme) {
  const themeBtn = getElement("themeBtn");

  document.body.dataset.theme = theme;

  if (themeBtn) {
    themeBtn.textContent = theme === "dark" ? "☀️ Светлая" : "🌙 Тёмная";
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

function updateTimer() {
  const timer = getElement("timer");
  const days = getElement("d");
  const hours = getElement("h");
  const minutes = getElement("m");
  const seconds = getElement("s");

  if (!timer || !days || !hours || !minutes || !seconds) {
    return false;
  }

  const diff = START_DATE - Date.now();

  if (diff <= 0) {
    timer.innerHTML = '<div class="unit"><span class="num">Старт!</span></div>';
    return false;
  }

  days.textContent = String(Math.floor(diff / 86400000)).padStart(2, "0");
  hours.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
  minutes.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  seconds.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

  return true;
}

function initTimer() {
  if (!updateTimer()) {
    return;
  }

  const timerId = setInterval(() => {
    if (!updateTimer()) {
      clearInterval(timerId);
    }
  }, 1000);
}

function createFaqItem({ question, answer }, index) {
  const item = document.createElement("article");
  const questionId = `faq-question-${index}`;
  const answerId = `faq-answer-${index}`;

  item.className = "faq-item";
  item.innerHTML = `
    <button class="faq-question" type="button" id="${questionId}" aria-expanded="false" aria-controls="${answerId}">
      <span>${question}</span>
      <span class="faq-icon" aria-hidden="true">+</span>
    </button>
    <div class="faq-answer" id="${answerId}" role="region" aria-labelledby="${questionId}">
      <p>${answer}</p>
    </div>
  `;

  const button = item.querySelector(".faq-question");
  const answerBlock = item.querySelector(".faq-answer");

  button.addEventListener("click", () => {
    const isOpen = item.classList.toggle("is-open");

    button.setAttribute("aria-expanded", String(isOpen));
    answerBlock.style.maxHeight = isOpen ? `${answerBlock.scrollHeight}px` : "0";
  });

  return item;
}

function initFaq() {
  const faqRoot = getElement("faqList");

  if (!faqRoot) {
    return;
  }

  const list = document.createElement("div");
  list.className = "faq-list";

  faqs.forEach((faq, index) => {
    list.append(createFaqItem(faq, index));
  });

  faqRoot.replaceChildren(list);
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
      reachAnalyticsGoal(ANALYTICS_GOALS.formSubmit, {
        preferredContact: form.elements.preferred_contact?.value || "",
        childGrade: form.elements.child_grade?.value || ""
      });
      reachAnalyticsGoal(ANALYTICS_GOALS.thankYouRedirect, {
        url: "thank-you.html"
      });
      window.location.href = "thank-you.html";
    } catch {
      setFormMessage(messageEl, "Не получилось отправить заявку. Пожалуйста, попробуйте ещё раз или свяжитесь с нами напрямую.");
      renderFormErrorContacts(errorContacts);
      setSubmitState(submitButton, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTimer();
  initFaq();
  initConfiguredContactLinks();
  initContactLists();
  initMaxContact();
  initMaxCopy();
  initAnalyticsEvents();
  initApplicationForm();
});
