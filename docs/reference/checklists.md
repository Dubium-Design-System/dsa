# Чек-листы

Короткие проверки перед merge.

## Новый `data`-slice

- [ ] У slice есть понятный владелец: `posts`, `comments`, `authors`.
- [ ] Внешние значения начинаются как `unknown`.
- [ ] Runtime-проверка выполняется Valibot.
- [ ] DTO выводится из schema, а не дублируется вручную.
- [ ] Mapper есть только если внешняя и внутренняя формы различаются.
- [ ] MobX store не знает о React Router и JSX.
- [ ] Public API открыт через `index.ts`.
- [ ] Внешний код не делает deep import.

## Новый React-компонент

- [ ] Понятно, smart он или dumb.
- [ ] Dumb UI работает через props.
- [ ] `observer` используется только там, где компонент читает MobX state.
- [ ] Компонент не валидирует внешний DTO.
- [ ] Route hooks не спрятаны глубоко без необходимости.
- [ ] У именованного компонента задан понятный `displayName`, если это принято в проекте.

## Новая page

- [ ] Page соответствует конкретному route.
- [ ] Route params читаются через React Router.
- [ ] Page не содержит DTO, mapper или domain store.
- [ ] Локальные sections остаются рядом с page.
- [ ] Навигация выполняется в React-слое.

## Большая форма

- [ ] Полями владеет React Hook Form.
- [ ] Valibot schema описывает именно форму.
- [ ] `@hookform/resolvers` соединяет schema с формой.
- [ ] MobX не дублирует каждое поле.
- [ ] `Controller` используется только для контролируемых UI-компонентов.
- [ ] `FormProvider` используется только когда глубина формы этого требует.

## Code review

### Данные

- [ ] `unknown → Valibot → DTO → mapper → тип приложения`.
- [ ] DTO не вышел в React props.
- [ ] Schema формы и schema внешнего ответа не объединены случайно.

### Зависимости

- [ ] `app → pages → components → data → shared`.
- [ ] Нет обратных импортов.
- [ ] Нет циклов между domain slices.
- [ ] Нет deep imports между модулями.

### MobX и lifecycle

- [ ] Понятно, кто создаёт store.
- [ ] Понятно, сколько store живёт.
- [ ] У локального store есть понятный reset/cleanup, если он нужен.
- [ ] Store не вызывает React hooks.

### React Router

- [ ] URL-знание остаётся в `app/pages`.
- [ ] Store получает обычные значения, а не Router.
