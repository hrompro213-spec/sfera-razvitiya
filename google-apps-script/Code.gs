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

/**
 * Символы, с которых Google Таблицы начинают разбор значения как формулы.
 * Именно из-за них телефон «+7…» превращался в #ERROR!, а «=тест» — в #NAME?.
 */
const FORMULA_START_PATTERN = /^[=+\-@\t\r]/;

/** Первая колонка — время получения заявки на сервере. */
const RECEIVED_AT_TITLE = 'Получено';

/** Имя служебного листа, куда пишутся ошибки (почта, запись в таблицу). */
const ERRORS_SHEET_NAME = 'Errors';

/** Заголовки служебного листа ошибок. */
const ERRORS_HEADERS = ['Время', 'Функция', 'Сообщение'];

/** Кому приходят письма-уведомления о новых заявках (получатели через запятую). */
const NOTIFY_EMAILS = ['zadonskayamarta@gmail.com', 'zadonskaya.tanja@yandex.ru'];

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

  // Служебный лист для ошибок создаём сразу: он нужен, даже если писем пока нет.
  ensureErrorsSheet_();

  return 'Лист «' + SHEET_NAME + '» готов. Колонок: ' + headers.length +
    '. Лист «' + ERRORS_SHEET_NAME + '» готов.';
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

    const row = buildRow_(params);
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      appendLeadRow_(row);
    } finally {
      lock.releaseLock();
    }

    // Письмо уходит после releaseLock и в try/catch: сбой почты
    // не должен отменять сохранённую заявку и портить ответ сайту.
    try {
      sendLeadNotification(row);
    } catch (error) {
      logError_('sendLeadNotification', error);
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    logError_('doPost', error);
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

/**
 * Письмо-уведомление о новой заявке: обычный текст, поля «Название: значение».
 * @param {Array} row Строка в формате buildRow_(): [время получения, ...значения FORM_FIELDS].
 */
function sendLeadNotification(row) {
  const values = row || [];
  const lead = {};

  FORM_FIELDS.forEach(function (field, index) {
    lead[field.key] = stripCellEscape_(values[index + 1]).trim();
  });

  const subject = 'Новая заявка — ' + (lead.parent_name || 'без имени') + ', ' + (lead.child_grade || 'класс не указан');
  const lines = ['Дата: ' + (values[0] || ''), ''];

  FORM_FIELDS.forEach(function (field) {
    lines.push(field.title + ': ' + (lead[field.key] || '—'));
  });

  lines.push('');
  lines.push('Все заявки: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/edit');

  MailApp.sendEmail({
    to: NOTIFY_EMAILS.join(','),
    subject: subject,
    body: lines.join('\n'),
    name: 'Сфера Развития — заявки'
  });
}

/**
 * Тестовая отправка письма. Запустить из редактора Apps Script один раз после
 * деплоя — так скрипт получает разрешение «Отправка почты от вашего имени».
 */
function sendTestNotification() {
  const testRow = buildRow_({
    parent_name: 'Тестовая заявка',
    phone: '+7 900 000-00-00',
    child_grade: '5 класс',
    preferred_contact: 'phone',
    study_goal: 'Проверка уведомлений после деплоя',
    selected_plan: 'oge-individual',
    utm_source: 'test'
  });

  sendLeadNotification(testRow);

  return 'Письмо отправлено: ' + NOTIFY_EMAILS.join(', ');
}

/**
 * Диагностика почты: запускать вручную из редактора Apps Script.
 * Показывает остаток дневной квоты и результат отправки тестового письма.
 * @return {Object} { quota: number, sent: boolean, to: string[], error?: string }
 */
function diagnoseMail() {
  const result = { quota: 0, sent: false, to: NOTIFY_EMAILS };

  try {
    result.quota = MailApp.getRemainingDailyQuota();
  } catch (error) {
    result.error = error && error.message ? error.message : String(error);
    logError_('diagnoseMail / quota', error);
    return result;
  }

  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAILS.join(','),
      subject: 'Диагностика почты — ' + Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() || 'Europe/Moscow',
        'dd.MM.yyyy HH:mm'
      ),
      body: 'Техническое письмо диагностики «Сфера Развития».\n' +
        'Остаток квоты писем на сегодня: ' + result.quota + '.\n' +
        'Получатели: ' + NOTIFY_EMAILS.join(', '),
      name: 'Сфера Развития — заявки'
    });
    result.sent = true;
  } catch (error) {
    result.error = error && error.message ? error.message : String(error);
    logError_('diagnoseMail / send', error);
  }

  return result;
}

/**
 * Приводит значение к безопасной для таблицы строке.
 * Google Таблицы трактуют как формулу значения, начинающиеся с = + - @ или с
 * табуляции / перевода строки. Ведущий апостроф переводит ячейку в текст
 * (в самой ячейке он не отображается) — защита от formula injection.
 * @param {*} value Значение из формы (может быть null или undefined).
 * @return {string} Безопасная строка.
 */
function sanitizeCellValue_(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  if (!text) {
    return text;
  }

  return FORMULA_START_PATTERN.test(text) ? "'" + text : text;
}

/** true, если значение уже помечено апострофом в sanitizeCellValue_. */
function isEscapedCellValue_(value) {
  const text = String(value === null || value === undefined ? '' : value);

  return text.charAt(0) === "'" && FORMULA_START_PATTERN.test(text.slice(1));
}

/** Снимает апостроф, добавленный sanitizeCellValue_ (для письма и rich text). */
function stripCellEscape_(value) {
  const text = String(value === null || value === undefined ? '' : value);

  return isEscapedCellValue_(text) ? text.slice(1) : text;
}

/**
 * Добавляет строку заявки в лист Leads.
 * Значения с апострофом (после sanitizeCellValue_) перезаписываются как rich text:
 * Google при USER_ENTERED разбирает «=…» и «+…» как формулы даже с апострофом
 * впереди, а rich text — это гарантированно текст (апостроф в ячейке не остаётся).
 * @param {Array} values Строка в формате buildRow_().
 * @return {number} Номер добавленной строки.
 */
function appendLeadRow_(values) {
  const sheet = getLeadsSheet_();
  const rowIndex = sheet.getLastRow() + 1;
  const rowRange = sheet.getRange(rowIndex, 1, 1, values.length);

  rowRange.setValues([values]);

  values.forEach(function (value, index) {
    if (!isEscapedCellValue_(value)) {
      return;
    }

    const cell = sheet.getRange(rowIndex, index + 1);
    const text = String(value).slice(1);

    try {
      cell.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(text).build());

      if (cell.getFormula()) {
        logError_('appendLeadRow_', new Error('rich text не сработал, оставлен апостроф: ' + text));
      }
    } catch (error) {
      logError_('appendLeadRow_', error);
    }
  });

  return rowIndex;
}

/** Создаёт (или обновляет) служебный лист ошибок. */
function ensureErrorsSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(ERRORS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(ERRORS_SHEET_NAME);
  }

  const headerRange = sheet.getRange(1, 1, 1, ERRORS_HEADERS.length);
  headerRange.setValues([ERRORS_HEADERS]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#7f1d1d');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 190);
  sheet.setColumnWidth(3, 700);

  return sheet;
}

/** Лист ошибок; создаёт его, если ещё нет. */
function getErrorsSheet_() {
  const spreadsheet = getSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(ERRORS_SHEET_NAME);

  return sheet || ensureErrorsSheet_();
}

/**
 * Пишет строку в лист Errors: время, функция, сообщение и первые 500 символов stack.
 * Никогда не бросает исключение наружу — сбой логирования не должен ронять заявку.
 * @param {string} functionName Имя функции, где произошла ошибка.
 * @param {*} error Объект ошибки.
 */
function logError_(functionName, error) {
  try {
    const timeZone = Session.getScriptTimeZone() || 'Europe/Moscow';
    const time = Utilities.formatDate(new Date(), timeZone, 'dd.MM.yyyy HH:mm:ss');
    const message = error && error.message ? String(error.message) : String(error);
    const stack = error && error.stack ? String(error.stack).slice(0, 500) : '';
    const details = stack ? message + '\n' + stack : message;

    getErrorsSheet_().appendRow([time, String(functionName), sanitizeCellValue_(details)]);
  } catch (logError) {
    console.error('Не удалось записать ошибку в лист ' + ERRORS_SHEET_NAME + ': ' + logError);
  }
}

/** Заголовки листа: время получения + поля формы. */
function getHeaders_() {
  return [RECEIVED_AT_TITLE].concat(
    FORM_FIELDS.map(function (field) {
      return field.title;
    })
  );
}

/** Строка заявки в порядке заголовков. Значения защищены от формул. */
function buildRow_(params) {
  const timeZone = Session.getScriptTimeZone() || 'Europe/Moscow';
  const receivedAt = Utilities.formatDate(new Date(), timeZone, 'dd.MM.yyyy HH:mm:ss');

  // Первая колонка — серверное время, а не пользовательский ввод: её не экранируем.
  return [receivedAt].concat(
    FORM_FIELDS.map(function (field) {
      return sanitizeCellValue_(String(params[field.key] || '').trim());
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

