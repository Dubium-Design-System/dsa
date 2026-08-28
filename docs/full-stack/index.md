# Full Stack Guide

Full Stack Guide — это слой документации **поверх DSA Core**.

Он не меняет архитектурные правила. Он фиксирует конкретные библиотеки и проектные соглашения, которыми эти правила реализуются.

## Полный стек

| Инструмент | Роль |
|---|---|
| `react` | компоненты и UI composition |
| `react-router` | routes, layouts, guards и navigation |
| `mobx` | observable state, actions и computed |
| `mobx-react-lite` | `observer` для функциональных React-компонентов |
| `axios` | HTTP transport и настроенные clients |
| `valibot` | runtime validation внешних payloads и форм |
| `react-hook-form` | поля, errors, touched/dirty и submit lifecycle |
| `@hookform/resolvers` | `valibotResolver` для React Hook Form |
| `dayjs` | разбор, сравнение и форматирование дат |
| `clsx` | сборка условных CSS class names |
| Sass | стили компонентов в `*.module.scss` |

Дополнительно архитектура допускает application-specific adapters для EventBus, WebSocket, BroadcastChannel или SSE, когда такие механизмы реально нужны проекту.

## Core и Stack не дублируют друг друга

Core:

```txt
data владеет внешним контрактом и состоянием
```

Stack Guide:

```txt
data/posts/posts.api.ts
  → импортирует настроенный Axios facade
  → получает unknown
  → валидирует Valibot
  → маппит DTO
  → возвращает внутреннюю модель
```

Core:

```txt
generic infrastructure не должна знать business state
```

Stack Guide:

```txt
shared/lib/event-bus       generic engine
app/infrastructure/adapter application wiring
data/posts                 business contracts and state
```

## Базовая структура полного стека

```txt
src/
  app/
    infrastructure/
      adapter/
      facade/
        axios/
      error-boundary/
    router/

  pages/

  components/

  data/
    posts/
    authors/
    comments/
    post-editor/

  shared/
    lib/
    ui/
    hooks/
    helpers/
```

## Как читать этот раздел

Не переносите правила из Stack Guide в Core автоматически.

Например:

> «HTTP facade расположен в `app/infrastructure/facade/axios`»

является правилом **этого полного стека**.

А правило:

> «domain DTO и schema принадлежат `data`»

остаётся правилом **Core**.

## Дальше

Читайте страницы по задаче:

- [Axios и HTTP facade](/full-stack/http-axios)
- [Application infrastructure](/full-stack/infrastructure)
- [Даты и dayjs](/full-stack/dates)
- [Стили: Sass Modules и clsx](/full-stack/styling)
- [Полная структура блога](/full-stack/project-structure)
- [Как использовать example project](/example/)
