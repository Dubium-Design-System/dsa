# Чек-лист полного стека

Этот чек-лист применяется **после Core-проверки**.

Сначала убедитесь, что код соответствует DSA Core. Затем проверяйте конкретные соглашения полного стека.

## HTTP

- [ ] Axios не конфигурируется заново внутри каждого `data`-slice.
- [ ] Настроенный client импортируется через public API `app/infrastructure/facade/axios`.
- [ ] Domain endpoint остаётся в owning `data`-slice.
- [ ] `response.data` считается `unknown` до Valibot.
- [ ] Axios generic не используется как замена runtime validation.
- [ ] Domain DTO/schema не находятся внутри facade.

## Application infrastructure

- [ ] Facade не импортирует `data`, `components`, `pages` или router.
- [ ] Adapter использует public API data-slices.
- [ ] `data` не импортирует adapters.
- [ ] Generic EventBus/WebSocket engine не знает бизнес-сущности.
- [ ] У subscription/connection есть cleanup.
- [ ] `init` имеет понятную политику повторного вызова.

## Даты

- [ ] Server date валидируется до преобразования.
- [ ] dayjs используется в mapper/computed/helper владельца.
- [ ] Форматирование дат не копируется по JSX без необходимости.
- [ ] Timezone/format policy имеет одного владельца.

## Стили

- [ ] Product styles лежат рядом с product component/page.
- [ ] Sass Module имеет имя `*.module.scss`.
- [ ] `clsx` используется для class names, а не для сокрытия бизнес-логики.
- [ ] Переиспользуемый `PostCard` не переносится в `shared` только из-за переиспользования.

## Финальная проверка

Спросите:

> Если завтра заменить Axios, dayjs или Sass, сколько архитектурных слоёв придётся переписать?

Если замена технической библиотеки заставляет переписывать React pages, domain types и множество stores, стековая деталь, вероятно, протекла слишком далеко.
