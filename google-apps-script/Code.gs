/**
 * «Сфера Развития» — приём заявок с лендинга в Google Таблицу.
 *
 * Как это работает:
 *   1. Сайт отправляет POST (application/x-www-form-urlencoded) на URL веб-приложения.
 *   2. doPost(e) проверяет honeypot-поле (website/company) и обязательные поля.
 *   3. Валидная заявка добавляется новой строкой на лист "Leads".
 *
 * Первый запуск: выполнить функцию setupSheet() из редактора Apps Script —
 * она создаст лист "Leads" с заголовками и оформит его.
 *
 * Файл загружается в Google через clasp: см. README.md в этой папке.
 */

/** ID Google Таблицы для заявок. Заполняется после `clasp create`. */
const SPREADSHEET_ID = '1uNU2IuE9UcgBSkX8Fh_M2ByLkis-hpZ2kkaW3psJg8o';

/** Имя листа, куда пишутся заявки. */
const SHEET_NAME = 'Leads';

/** Поля заявки: ключ из формы сайта → заголовок колонки в таблице. */
const FORM_FIELDS = [
  { key: 'parent_name', title: 'Имя родителя' },
  { key: 'phone', title: 'Телефон' },
  { key: 'child_grade', title: 'Класс ребёнка' },
  { key: 'preferred_contact', title: 'Удобный способ связи' },
  { key: 'study_goal', title: 'Цель занятий' },
  { key: 'selected_plan', title: 'Выбранный тариф' },
  { key: 'submitted_at', title: 'Отправлено с сайта' },
  { key: 'utm_source', title: 'utm_source' },
  { key: 'utm_medium', title: 'utm_medium' },
  { key: 'utm_campaign', title: 'utm_campaign' },
  { key: 'utm_content', title: 'utm_content' },
  { key: 'utm_term', title: 'utm_term' },
  { key: 'referrer', title: 'Источник перехода' },
  { key: 'landing_url', title: 'Страница' },
  { key: 'user_agent', title: 'User-Agent' }
];

/** Обязательные поля: без них заявка считается неполной. */
const REQUIRED_FIELDS = ['parent_name', 'phone'];

/** Поля-приманки для ботов. Если заполнено любое — заявка не сохраняется. */
const HONEYPOT_FIELDS = ['website', 'company'];

/** Первая колонка — время получения заявки на сервере. */
const RECEIVED_AT_TITLE = 'Получено';

/**
 * Создаёт (или обновляет) лист "Leads": заголовки, оформление, ширины колонок.
 * Запускается вручную из редактора Apps Script один раз перед публикацией.
 */
function setupSheet() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const headers = getHeaders_();
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1f3864');
  headerRange.setFontColor('#ffffff');
  headerRange.setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 32);

  if (sheet.getMaxColumns() > headers.length) {
    sheet.deleteColumns(headers.length + 1, sheet.getMaxColumns() - headers.length);
  }

  // Телефон храним как текст, чтобы не терять «+» и ведущие нули.
  const phoneIndex = headers.indexOf('Телефон') + 1;
  if (phoneIndex > 0) {
    sheet.getRange(2, phoneIndex, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
  }

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 110);
  sheet.setColumnWidth(5, 160);
  sheet.setColumnWidth(6, 320);

  return 'Лист «' + SHEET_NAME + '» готов. Колонок: ' + headers.length + '.';
}

/**
 * Принимает POST-запрос формы сайта и сохраняет заявку в таблицу.
 * @param {Object} e Событие Apps Script с параметрами запроса.
 * @return {TextOutput} JSON-ответ для сайта.
 */
function doPost(e) {
  try {
    const params = getRequestParams_(e);

    // Honeypot: боты заполняют скрытое поле. Отвечаем «успехом», но ничего не пишем.
    if (isHoneypotFilled_(params)) {
      return jsonResponse_({ ok: true, skipped: true });
    }

    const missing = REQUIRED_FIELDS.filter(function (key) {
      return !String(params[key] || '').trim();
    });

    if (missing.length) {
      return jsonResponse_({ ok: false, error: 'Заполните обязательные поля: ' + missing.join(', ') });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      getLeadsSheet_().appendRow(buildRow_(params));
    } finally {
      lock.releaseLock();
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error('doPost failed: ' + (error && error.stack ? error.stack : error));
    return jsonResponse_({ ok: false, error: 'Внутренняя ошибка сервера' });
  }
}

/**
 * Проверка живости веб-приложения (открыть URL в браузере).
 * @return {TextOutput} JSON-ответ.
 */
function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'sfera-razvitiya-leads',
    sheet: SHEET_NAME,
    spreadsheet: SPREADSHEET_ID ? 'connected' : 'not-configured'
  });
}

/** Заголовки листа: время получения + поля формы. */
function getHeaders_() {
  return [RECEIVED_AT_TITLE].concat(
    FORM_FIELDS.map(function (field) {
      return field.title;
    })
  );
}

/** Строка заявки в порядке заголовков. */
function buildRow_(params) {
  const timeZone = Session.getScriptTimeZone() || 'Europe/Moscow';
  const receivedAt = Utilities.formatDate(new Date(), timeZone, 'dd.MM.yyyy HH:mm:ss');

  return [receivedAt].concat(
    FORM_FIELDS.map(function (field) {
      return String(params[field.key] || '').trim();
    })
  );
}

/** Достаёт параметры запроса из e.parameter и/или тела запроса. */
function getRequestParams_(e) {
  const params = {};

  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (key) {
      params[key] = e.parameter[key];
    });
  }

  if (e && e.postData && e.postData.contents) {
    const contents = String(e.postData.contents);
    const type = String(e.postData.type || '');

    if (type.indexOf('application/json') === 0) {
      try {
        const parsed = JSON.parse(contents);
        Object.keys(parsed).forEach(function (key) {
          params[key] = parsed[key];
        });
      } catch (error) {
        console.warn('Не удалось разобрать JSON-тело запроса: ' + error);
      }
    } else if (!e.parameter) {
      contents.split('&').forEach(function (pair) {
        if (!pair) {
          return;
        }
        const parts = pair.split('=');
        const key = decodeURIComponent(parts[0].replace(/\+/g, ' '));
        const value = decodeURIComponent((parts[1] || '').replace(/\+/g, ' '));
        params[key] = value;
      });
    }
  }

  return params;
}

/** true, если заполнено хотя бы одно honeypot-поле. */
function isHoneypotFilled_(params) {
  return HONEYPOT_FIELDS.some(function (key) {
    return String(params[key] || '').trim() !== '';
  });
}

/** Лист заявок; если его нет или в нём только заголовки — готовит через setupSheet(). */
function getLeadsSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet || sheet.getLastRow() === 0) {
    setupSheet();
    sheet = spreadsheet.getSheetByName(SHEET_NAME);
  }

  return sheet;
}

/** Таблица заявок: по SPREADSHEET_ID или привязанная к скрипту. */
function getSpreadsheet_() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();

  if (!active) {
    throw new Error('SPREADSHEET_ID не заполнен, а скрипт не привязан к таблице. Укажите ID в Code.gs.');
  }

  return active;
}

/** JSON-ответ для сайта. */
function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

