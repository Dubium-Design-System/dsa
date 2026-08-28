# Правила зависимостей

## Основное направление

::: info Полный стек
Core использует только базовый граф зависимостей. Конкретный проектный стек может добавлять узкие infrastructure-отношения. Они описаны отдельно в [зависимостях Full Stack Guide](/full-stack/dependencies).
:::


```txt
app → pages → components → data → shared
```

Это не означает, что каждый слой обязан импортировать следующий. Это означает, что зависимость не должна идти обратно.

## Матрица импортов

| Откуда | Куда можно |
|---|---|
| `app` | `pages`, `components`, `data`, `shared` |
| `pages` | `components`, `data`, `shared` |
| `components` | `data`, `shared` |
| `data` | `shared` |
| `shared` | только внутрь `shared` |

## Пример

Допустимо:

```tsx
// pages/Post/Post.page.tsx
import { PostDetails } from "@/components/posts"
```

Допустимо:

```tsx
// components/posts/widgets/PostDetails.tsx
import { postsStore } from "@/data/posts"
```

Недопустимо:

```ts
// data/posts/posts.store.ts
import { PostPage } from "@/pages/Post"
```

Store не должен знать, каким экраном он отображается.

## Даже type-import — это зависимость

Такой импорт тоже связывает слои:

```ts
import type { IPostPageProps } from "@/pages/Post"
```

Если `data` действительно нужен тип, тип должен принадлежать `data` или быть универсальным для `shared`.

## Domain slices

Обычный `data/posts` не должен напрямую собирать `data/authors` только ради карточки.

Когда представлению нужны оба источника, создайте отдельного владельца композиции:

```txt
data/post-details/
  post-details.vm.ts
```

Он может читать public API нужных slices.

## Циклы

Если два модуля импортируют друг друга, это почти всегда сигнал, что:

- владелец выбран неверно;
- часть кода должна быть поднята в отдельную композицию;
- общий чистый контракт должен быть вынесен ниже.

Цель правила не в красивом графе. Цель — чтобы изменение страницы не ломало store, а изменение store не требовало знать о странице.
