# Google Apps Script — приём заявок в Google Таблицу

Бэкенд формы с лендинга: сайт отправляет POST на веб-приложение Apps Script,
скрипт проверяет honeypot-поле и добавляет заявку строкой на лист **`Leads`**.

```
google-apps-script/
├── Code.gs         # setupSheet(), doPost(e), doGet(), honeypot, запись в «Leads»
├── appsscript.json # манифест: Europe/Moscow, V8, веб-приложение для всех
└── .clasp.json     # создаётся `clasp create`, хранит scriptId (в git не нужен)
```

## Текущий проект (создан 15.11.2026)

| Что | Значение |
|---|---|
| Аккаунт | `hrompro213@gmail.com` |
| Script ID | `12i4h2dVOATgS7MljTG1EpQ-qGu_Lk2YEUdPzeqhPQ3GY_pLKOUHUoAlH` |
| Spreadsheet ID | `1uNU2IuE9UcgBSkX8Fh_M2ByLkis-hpZ2kkaW3psJg8o` |
| Веб-приложение (URL постоянный) | `https://script.google.com/macros/s/AKfycbwUFxH2SjkC3WX0CpgTNHn3ZJ1AIpJXE6Kx_NKgGCpYQZ3ESEYAc9iE-ijVazIb5Pau/exec` |
| Deployment ID | `AKfycbwUFxH2SjkC3WX0CpgTNHn3ZJ1AIpJXE6Kx_NKgGCpYQZ3ESEYAc9iE-ijVazIb5Pau` |
| Версия деплоя | **2** — email-уведомления (`NOTIFY_EMAILS`), URL тот же |

Тот же URL продублирован в `FORM_ENDPOINT` в корневом `app.js`.

## Что делает Code.gs

| Функция | Назначение |
|---|---|
| `setupSheet()` | создаёт/оформляет лист `Leads`: заголовки, закреплённая строка, ширины колонок |
| `doPost(e)` | принимает заявку с сайта, отбивает ботов по honeypot (`website`, `company`), пишет строку и отправляет письмо |
| `appendLeadRow_(values)` | пишет строку в `Leads`; значения, начинающиеся с `= + - @`, сохраняет как rich text (иначе Google сделает из них формулу) |
| `sanitizeCellValue_(value)` | помечает «опасные» значения ведущим апострофом (formula injection) |
| `sendLeadNotification(row)` | письмо-уведомление о заявке (обычный текст) на адреса из `NOTIFY_EMAILS` |
| `sendTestNotification()` | тестовое письмо; запускается из редактора, чтобы выдать скрипту право отправки почты |
| `logError_(functionName, error)` | пишет строку в лист `Errors`; сам никогда не бросает исключение |
| `diagnoseMail()` | остаток квоты + тестовое письмо, возвращает `{quota, sent, to}` или `{quota, sent: false, error}` |
| `doGet()` | проверка живости: открыть URL веб-приложения в браузере, вернёт JSON |

Колонки листа: `Получено`, `Имя родителя`, `Телефон`, `Класс ребёнка`,
`Удобный способ связи`, `Цель занятий`, `Выбранный тариф`, `Отправлено с сайта`,
`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`,
`Источник перехода`, `Страница`, `User-Agent`.

`SPREADSHEET_ID` в начале `Code.gs` — ID таблицы, в которую писать. Если скрипт
привязан к таблице (`clasp create --type sheets`), можно оставить пустым: тогда
используется привязанная таблица.

## Листы таблицы

| Лист | Что внутри |
|---|---|
| `Leads` | заявки: `Получено` + 15 полей формы |
| `Errors` | служебный журнал: `Время` \| `Функция` \| `Сообщение`. Создаётся `setupSheet()` или сам при первой ошибке |

**Защита от формул (formula injection).** Google Таблицы разбирают значение,
начинающееся с `=`, `+`, `-`, `@`, табуляции или CR, как формулу — телефон
`+7…` превращался в `#ERROR!`, а имя `=тест` в `#NAME?`. Поэтому:
`sanitizeCellValue_()` помечает такие значения ведущим апострофом, а
`appendLeadRow_()` записывает их как **rich text** (обход парсинга: апостроф
остаётся только маркером, в ячейке его не видно и значение остаётся текстом).
Дата в первой колонке не экранируется — это серверное время, а не ввод.

**Ошибки почты.** Если `MailApp` не смог отправить письмо, заявка всё равно
сохраняется, а причина пишется строкой в `Errors` (`Функция = sendLeadNotification`,
сообщение + первые 500 символов stack).

## Уведомления на почту

Адреса получателей — константа `NOTIFY_EMAILS` в начале `Code.gs` (сейчас
`zadonskayamarta@gmail.com` + копия `zadonskaya.tanja@yandex.ru`). Письмо уходит
в `doPost` **после** записи строки и **после** `releaseLock`, внутри `try/catch`:
если почта недоступна, заявка всё равно сохраняется и сайт получает `{"ok":true}`.
Honeypot-заявки (`{"skipped":true}`) писем не порождают.

Письма отправляет аккаунт деплоя через `MailApp` — отдельный SMTP не нужен.
Лимит бесплатного аккаунта — около 100 писем в сутки.

**Один раз после первого деплоя с почтой** нужно выдать разрешение: в редакторе
Apps Script выбрать функцию `sendTestNotification` → «Выполнить» → «Разрешить»
(появится пункт «Отправка почты от вашего имени»). Проверить, что письмо пришло.

> Важно: если разрешение выдали **после** создания деплоя, веб-приложение продолжит
> работать со старой авторизацией и письма молча не уйдут. Нужно передеплоить:
> `clasp deploy --deploymentId <ID>` — URL при этом не меняется.

Диагностика: запустить `diagnoseMail()` — вернёт `{quota, sent, to}`, а при сбое
`{quota, sent: false, error}`; причина также попадёт в лист `Errors`.

## Требования

- Node.js 18+ (`node --version`)
- clasp 3.x: `npm install -g @google/clasp` → `clasp --version`

## Автоматический деплой через clasp

Все команды выполняются из папки `google-apps-script`, кроме логина.

### 1. Логин (ручной шаг, один раз на машину)

```
npx @google/clasp login
```

Откроется браузер: выбрать аккаунт Google → «Разрешить». Вернуться в терминал.
Токен сохраняется в `%USERPROFILE%\.clasprc.json` и в репозиторий не попадает.

Проверка:

```
npx @google/clasp list
```

### 2. Создание проекта (один раз)

Новая таблица — clasp создаст и таблицу, и привязанный скрипт, и `.clasp.json`.
Все команды clasp выполняются из папки `google-apps-script`; на Windows входить в неё
нужно **каноническим путём** (см. раздел про ложный symlink в конце):

```powershell
Set-Location 'D:\SFERA-RAZVITIYA\google-apps-script'
clasp create --type sheets --title "Сфера Развития — заявки"
```

Существующая таблица — добавить `--parentId`:

```powershell
clasp create --type sheets --title "Сфера Развития — заявки" --parentId <SPREADSHEET_ID>
```

Из вывода записать **Script ID** и **Spreadsheet ID**; Spreadsheet ID вписать
в `SPREADSHEET_ID` в `Code.gs`.

### 3. Загрузка кода

```
npx @google/clasp push --force
npx @google/clasp open-script      # открыть редактор Apps Script
```

### 4. Первый запуск setupSheet (ручной шаг, один раз)

В редакторе Apps Script: функция `setupSheet` → «Выполнить» → пройти разрешения
(«Дополнительные настройки» → «Перейти на проект» → «Разрешить»).

### 5. Деплой веб-приложения

```
npx @google/clasp list-deployments
npx @google/clasp deploy --description "v1 - форма заявок"
```

Из вывода взять **Deployment ID** и собрать URL:

```
https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

URL должен оканчиваться на `/exec`. Он вписывается в `FORM_ENDPOINT` в корневом
`app.js`.

Обновление после правок кода **без смены URL** (обновляем существующее
развертывание, а не создаём новое):

```powershell
clasp push --force
clasp deploy --deploymentId AKfycbwUFxH2SjkC3WX0CpgTNHn3ZJ1AIpJXE6Kx_NKgGCpYQZ3ESEYAc9iE-ijVazIb5Pau --description "v2 - что изменилось"
```

Без `--deploymentId` создаётся **новое** развертывание с новым ID — тогда URL
меняется и его нужно вписывать в `FORM_ENDPOINT` в `app.js`.

> `push` обновляет код, но **не** опубликованное веб-приложение. Чтобы изменения
> увидели посетители, нужен новый деплой (или `redeploy` с тем же Deployment ID —
> тогда URL не меняется).

## Проверка после деплоя

1. Открыть URL веб-приложения в браузере — должен вернуться JSON
   `{"ok":true,"service":"sfera-razvitiya-leads","sheet":"Leads",...}`.
2. Отправить тестовую заявку с сайта и убедиться, что в таблице появилась строка
   на листе `Leads`.
3. Отправить заявку с заполненным полем `website` (honeypot) — строки быть не должно.

Тестовая отправка из PowerShell:

```powershell
$body = @{ parent_name = 'Тест'; phone = '+7 900 000-00-00'; child_grade = '5 класс'; preferred_contact = 'phone'; study_goal = 'Проверка формы' }
Invoke-RestMethod -Uri 'https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec' -Method Post -Body $body
```

## Если что-то не работает

| Симптом | Причина и решение |
|---|---|
| `clasp login` пишет про недоступный API | включить Apps Script API: https://script.google.com/home/usersettings |
| `clasp create` → `PERMISSION_DENIED` | тот же переключатель Apps Script API, подождать 1–2 минуты и повторить |
| `clasp push` просит `--force` | манифест в Google отличается от локального `appsscript.json` — запустить с `--force` |
| Сайт «отправляет», но строк нет | пройдены ли разрешения после `setupSheet`; совпадает ли `SPREADSHEET_ID`; смотреть «Выполнения» в редакторе Apps Script |
| `{"ok":false,"error":"Внутренняя ошибка сервера"}` | открыть «Выполнения» → лог `doPost failed`, там будет стек |

## Про git

- `.clasp.json` (scriptId) и `.clasprc.json` (токен) в репозиторий не коммитятся:
  токен — секрет, scriptId у каждого свой. В папке лежат только `Code.gs`,
  `appsscript.json` и этот README.
- URL веб-приложения секретом не является: он публичный и лежит в `app.js`
  (`FORM_ENDPOINT`).

## Windows: ложная ошибка «Security Error: Content directory is a symlink»

clasp сравнивает путь проекта с `realpath`. Папка этого репозитория на диске создана
в верхнем регистре (`D:\SFERA-RAZVITIYA`), поэтому при входе по нижнему регистру
(`D:\sfera-razvitiya`) строки не совпадают и clasp падает с «Possible race attack»,
хотя никаких symlink нет. Решение — всегда заходить каноническим путём:

```powershell
Set-Location 'D:\SFERA-RAZVITIYA\google-apps-script'
clasp status      # должно показать Code.gs и appsscript.json
```

Если `clasp create` падает уже **после** создания таблицы и скрипта (`Created new
document ...`, `Created new script ...`, затем ошибка), `.clasp.json` не записывается.
Создайте его вручную в `google-apps-script/`:

```json
{
  "scriptId": "<Script ID из ссылки https://script.google.com/d/<Script ID>/edit>",
  "rootDir": "."
}
```

`rootDir` — именно `"."`, не `"./"`: с `"./"` путь получает хвостовой `\`, и проверка
clasp снова ругается на symlink.

