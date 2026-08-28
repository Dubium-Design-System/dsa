# Зависимости полного стека

Core использует простое направление:

```txt
app → pages → components → data → shared
```

В полном стеке добавляются инфраструктурные роли. Они не отменяют Core, а вводят два явных отношения.

## Полный граф

```txt
app
 ↓
pages
 ↓
components
 ↓
data
 ↓
shared
```

Дополнительно:

```txt
data
  → app/infrastructure/facade/axios
  → shared
```

и:

```txt
app/infrastructure/adapter
  → data
  → app/infrastructure/facade
  → shared
```

## Почему `data → facade` разрешено

Обычно нижний слой не импортирует `app`.

HTTP facade — узкое исключение полного стека: он предоставляет технический API, который нужен `data`, но сам не знает бизнес-домены.

```ts
// допустимо только для оговорённого facade
import { api } from "@/app/infrastructure/facade/axios"
```

Это не означает:

```txt
data → app/*
```

Нельзя импортировать из `data` router, adapters, root providers или Error Boundary.

## Почему adapter может импортировать data

Adapter находится в composition layer.

Его задача — соединить глобальный технический механизм с конкретным приложением.

Например:

```txt
WebSocket engine
      ↓
PostsEventsAdapter
      ↓
postsStore
```

Поэтому adapter может знать public API `data/posts`.

Обратное запрещено:

```txt
data/posts ✕→ app/infrastructure/adapter
```

## Матрица

| Откуда | Разрешённые внутренние зависимости |
|---|---|
| `app/router` | `pages`, `components`, public API `data`, `shared` |
| `app/infrastructure/adapter` | public API `data`, нужный facade, `shared` |
| `app/infrastructure/facade/axios` | собственные файлы, generic `shared` |
| `pages` | `components`, public API `data`, `shared` |
| `components` smart | public API `data`, `shared` |
| `components` dumb UI | собственный модуль, `shared` |
| обычный `data`-slice | собственные файлы, `shared`, Axios facade |
| composite/view-model slice | public API явно нужных `data`-slices, `shared`, Axios facade |
| `shared` | только `shared` |

## Public API всё равно обязателен

Инфраструктурное исключение не разрешает deep imports.

Плохо:

```ts
import { postsStore } from "@/data/posts/posts.store"
```

Хорошо:

```ts
import { postsStore } from "@/data/posts"
```

То же правило работает для facade:

```ts
import { api } from "@/app/infrastructure/facade/axios"
```

а не:

```ts
import { api } from "@/app/infrastructure/facade/axios/axios.clients"
```

если client не является отдельно заявленным public contract.

## Как ревьюить зависимость

Для любого нового import задайте три вопроса:

1. Кто владеет импортируемым знанием?
2. Идёт ли зависимость вниз по Core-графу?
3. Если нет, является ли она одним из двух явно разрешённых infrastructure relations?

Если ответ на третий вопрос «нет», зависимость, скорее всего, выбрана неправильно.
