---
layout: home

hero:
  name: DSA
  text: Data-First Slice Architecture
  tagline: Архитектура отдельно, полный стек отдельно, рабочий пример рядом
  actions:
    - theme: brand
      text: DSA Core
      link: /guide/introduction
    - theme: alt
      text: Full Stack Guide
      link: /full-stack/
    - theme: alt
      text: Example project
      link: /example/
---

## Три уровня документации

### DSA Core

Core отвечает на архитектурные вопросы:

- кому принадлежит код;
- где хранится состояние;
- где проходит внешняя граница данных;
- в какую сторону идут зависимости;
- что относится к `app`, `pages`, `components`, `data` и `shared`;
- как React, MobX, React Router и формы соединяются между собой.

Core не требует конкретный HTTP-клиент, Sass, dayjs или EventBus.

### Full Stack Guide

Stack Guide показывает **один конкретный способ реализовать Core**:

```txt
DSA Core
   ↓
React + React Router
MobX + mobx-react-lite
React Hook Form + Valibot
   ↓
Axios + dayjs + clsx + Sass
   ↓
application facade / adapters / Error Boundary
```

Если в другом проекте используется другой HTTP-клиент или другой способ стилизации, Core остаётся прежним.

### Example project

Все примеры документации используют один блог:

```txt
posts
authors
comments
post-editor
```

В отдельном example-проекте эти части должны быть собраны в законченное приложение. Ссылки из документации ведут сначала на [страницу Example project](/example/), чтобы внешний URL можно было поменять в одном месте.

::: tip С чего начать новичку
Сначала прочитайте **Core**, затем откройте **Full Stack Guide**, и только после этого смотрите полный example-проект. Так легче отличить архитектурное правило от проектной реализации.
:::

## Roadmap

- [ ] Разработать `eslint-plugin-dsa`
- [ ] Разработать `dsa-cli`
- [ ] Добавить в документацию отдельный раздел о provider-подходе с понятным примером использования
- [ ] Добавить example-проекты с готовыми сценариями и структурами приложений
- [ ] Добавить фрагменты кода из реальных проектов, которые можно использовать как практические референсы и основу для собственных решений

