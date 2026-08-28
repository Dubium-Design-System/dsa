# Быстрый старт

Соберём минимальный сценарий блога: получим неизвестные данные со списком постов, проверим их Valibot, преобразуем DTO, сохраним результат в MobX store и покажем в React.

## 1. Создайте минимальный slice

```txt
data/posts/
  posts.schema.ts
  posts.dto.ts
  posts.mapper.ts
  posts.store.ts
  posts.types.ts
  index.ts
```

Не создавайте дополнительные папки заранее. Плоская структура легче читается, пока файлов немного.

## 2. Опишите внешний контракт

```ts
// data/posts/posts.schema.ts
import { array, object, string } from "valibot"

export const PostsResponseSchema = object({
  posts: array(
    object({
      id: string(),
      title: string(),
      published_at: string(),
    }),
  ),
})
```

Schema отвечает на вопрос: **какие данные приложение готово принять**.

## 3. Получите DTO из schema

```ts
// data/posts/posts.dto.ts
import type { InferOutput } from "valibot"

import { PostsResponseSchema } from "./posts.schema"

export type PostsResponseDto = InferOutput<typeof PostsResponseSchema>
```

Не описывайте тот же контракт вручную второй раз.

## 4. Проверьте `unknown`

```ts
// data/posts/posts.mapper.ts
import { parse } from "valibot"

import type { PostsResponseDto } from "./posts.dto"
import { PostsResponseSchema } from "./posts.schema"

export const parsePostsResponse = (input: unknown): PostsResponseDto =>
  parse(PostsResponseSchema, input)
```

До `parse` приложение не доверяет значению. После успешного `parse` форма данных известна.

## 5. Опишите внутренний тип

```ts
// data/posts/posts.types.ts
export interface IPost {
  id: string
  title: string
  publishedAt: Date
}
```

Внутренний тип не обязан повторять формат внешних данных.

## 6. Добавьте mapper

```ts
// data/posts/posts.mapper.ts
import type { PostsResponseDto } from "./posts.dto"
import type { IPost } from "./posts.types"

export const mapPostDtoToPost = (
  dto: PostsResponseDto["posts"][number],
): IPost => ({
  id: dto.id,
  title: dto.title,
  publishedAt: new Date(dto.published_at),
})
```

Теперь naming внешнего контракта не протекает в UI.

## 7. Реализуйте MobX store

Store получает уже проверенные данные. Способ их доставки не входит в scope DSA.

```ts
// data/posts/posts.store.ts
import { makeAutoObservable } from "mobx"

import type { IPost } from "./posts.types"

export interface IPostsStore {
  readonly posts: IPost[]
  readonly hasPosts: boolean
  setPosts(posts: IPost[]): void
  reset(): void
}

export class PostsStore implements IPostsStore {
  posts: IPost[] = []

  constructor() {
    makeAutoObservable(this)
  }

  get hasPosts(): boolean {
    return this.posts.length > 0
  }

  setPosts(posts: IPost[]): void {
    this.posts = posts
  }

  reset(): void {
    this.posts = []
  }
}

export const postsStore = new PostsStore()
```

## 8. Откройте минимальный public API

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

DTO и schema остаются внутренними, если внешнему коду они не нужны.

## 9. Подключите store к React

```tsx
// components/posts/widgets/PostsWidget.tsx
import { observer } from "mobx-react-lite"

import { postsStore } from "@/data/posts"

import { PostsList } from "../../ui/PostsList"

export const PostsWidget = observer(() => (
  <PostsList posts={postsStore.posts} />
))

PostsWidget.displayName = "PostsWidget"
```

Dumb-компонент знает только props:

```tsx
// components/posts/ui/PostsList.tsx
import type { IPost } from "@/data/posts"

interface IPostsListProps {
  posts: IPost[]
}

export const PostsList = ({ posts }: IPostsListProps) => (
  <ul>
    {posts.map((post) => (
      <li key={post.id}>{post.title}</li>
    ))}
  </ul>
)

PostsList.displayName = "PostsList"
```

## Что должно остаться в голове

Не запоминайте структуру файлов как ритуал. Запомните цепочку:

```txt
unknown → Valibot → DTO → mapper → тип приложения → MobX store → React
```

А React Router и React Hook Form подключаются там, где появляются маршруты и формы.


## Что дальше

Core-пример выше намеренно не показывает HTTP-клиент и стили. Если хотите увидеть тот же поток на полном стеке, откройте [сквозной сценарий полного стека](/full-stack/posts-flow), а затем [Example project](/example/).
