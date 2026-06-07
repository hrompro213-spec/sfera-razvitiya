const THEME_STORAGE_KEY = "sfera-theme";
const START_DATE = new Date("2026-06-08T00:00:00+03:00").getTime();

const CONTACT_CONFIG = {
  channels: {
    phone: {
      label: "Позвонить",
      shortLabel: "Звонок",
      displayValue: "+7 987 261 77 79",
      href: "tel:+79872617779",
      active: true,
      visible: true,
      placements: ["contact", "widget", "mobile"]
    },
    whatsapp: {
      label: "WhatsApp",
      shortLabel: "WhatsApp",
      href: "https://wa.me/79872617779",
      active: true,
      visible: true,
      placements: ["contact", "widget", "mobile"]
    },
    sms: {
      label: "SMS",
      shortLabel: "SMS",
      href: "sms:+79872617779",
      active: true,
      visible: true,
      placements: ["contact", "widget", "mobile"]
    },
    telegram: {
      label: "Telegram",
      href: "",
      active: false,
      visible: false,
      placements: []
    },
    vk: {
      label: "VK",
      href: "",
      active: false,
      visible: false,
      placements: []
    },
    email: {
      label: "Email",
      href: "",
      active: false,
      visible: false,
      placements: []
    }
  },
  max: {
    profileHandle: "@Tatiana_SferaR",
    projectHandle: "sferaon",
    qrImage: "images/max-qr.jpg",
    directUrl: ""
  },
  hiddenChannels: {
    telegram: null,
    vk: null,
    email: null
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

function isChannelAvailable(channel) {
  return Boolean(channel?.active && channel.visible !== false && channel.href);
}

function getChannel(key) {
  const channel = CONTACT_CONFIG.channels[key];

  return isChannelAvailable(channel) ? channel : null;
}

function createContactAnchor(channel, placement) {
  const link = document.createElement("a");

  link.href = channel.href;
  link.textContent = placement === "mobile" && channel.shortLabel ? channel.shortLabel : channel.label;
  link.setAttribute("aria-label", channel.label);

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
  const profile = document.querySelector("[data-max-profile]");
  const project = document.querySelector("[data-max-project]");
  const qr = document.querySelector("[data-max-qr]");
  const caption = document.querySelector("[data-max-caption]");

  if (profile) {
    profile.textContent = max.profileHandle;
  }

  if (project) {
    project.textContent = max.projectHandle;
  }

  if (qr && max.qrImage) {
    qr.src = max.qrImage;
  }

  if (caption) {
    caption.textContent = `MAX: ${max.profileHandle} · ${max.projectHandle}`;
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
    const maxContact = `${CONTACT_CONFIG.max.profileHandle} · ${CONTACT_CONFIG.max.projectHandle}`;

    try {
      await copyText(maxContact);
      copyButton.textContent = "Контакт MAX скопирован";
      copyButton.classList.add("is-copied");

      setTimeout(() => {
        copyButton.textContent = "Скопировать контакт MAX";
        copyButton.classList.remove("is-copied");
      }, 2200);
    } catch {
      copyButton.textContent = maxContact;
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
});
