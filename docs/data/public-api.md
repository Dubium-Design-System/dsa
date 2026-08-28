# Public API data-slice

Public API — это `index.ts`, через который внешний код использует slice.

## Зачем он нужен

Без public API любой потребитель может начать импортировать внутренние файлы:

```ts
import { PostsStore } from "@/data/posts/posts.store"
```

Тогда перемещение файла становится изменением для всего приложения.

Предпочтительно:

```ts
import { PostsStore } from "@/data/posts"
```

## Что экспортировать

Открывайте то, что реально нужно другим слоям:

```ts
// data/posts/index.ts
import { PostsStore, postsStore } from "./posts.store"
import type { IPost, IPostsStore } from "./posts.types"

export {
  PostsStore,
  postsStore,
  type IPost,
  type IPostsStore,
}
```

## Что оставить private

Обычно наружу не нужны:

- response DTO;
- внутренние Valibot schemas внешней границы;
- mappers;
- parser-функции;
- внутренние вспомогательные типы.

Форма — отдельный случай. Если React Hook Form должен использовать schema формы, её можно открыть осознанно:

```ts
import { PostFormSchema } from "./post-form.schema"
import type { PostFormValues } from "./post-form.types"

export {
  PostFormSchema,
  type PostFormValues,
}
```

## Deep imports

Deep import допустим внутри самого slice:

```ts
// data/posts/posts.store.ts
import type { IPost } from "./posts.types"
```

Но внешний модуль должен использовать:

```ts
import { type IPost } from "@/data/posts"
```

## Public API не обязан быть большим

Хороший `index.ts` не показывает устройство папки. Он показывает **контракт модуля**.
