# Сквозной сценарий: список постов

Разберём один read-flow целиком:

```txt
Axios
→ unknown
→ Valibot
→ DTO
→ dayjs mapper
→ MobX store
→ observer
→ dumb UI
→ page
```

Цель примера — показать соединение слоёв. В реальном проекте детали loading/error policy могут отличаться.

## 1. Axios facade

```ts
// app/infrastructure/facade/axios/axios.clients.ts
import axios from "axios"

export const api = axios.create({
  baseURL: "/api",
})
```

Весь проект использует настроенный client через public API facade.

## 2. Response schema

```ts
// data/posts/posts.schema.ts
import { array, object, string } from "valibot"

export const PostSchema = object({
  id: string(),
  title: string(),
  excerpt: string(),
  published_at: string(),
})

export const PostsResponseSchema = object({
  posts: array(PostSchema),
})
```

## 3. DTO из schema

```ts
// data/posts/posts.dto.ts
import type { InferOutput } from "valibot"

import { PostSchema, PostsResponseSchema } from "./posts.schema"

export type PostDto = InferOutput<typeof PostSchema>
export type PostsResponseDto = InferOutput<typeof PostsResponseSchema>
```

## 4. Внутренняя модель

```ts
// data/posts/posts.types.ts
export interface IPost {
  id: string
  title: string
  excerpt: string
  publishedAt: Date
}
```

## 5. Mapper с dayjs

```ts
// data/posts/posts.mapper.ts
import dayjs from "dayjs"

import type { PostDto } from "./posts.dto"
import type { IPost } from "./posts.types"

export const mapPostDtoToPost = (dto: PostDto): IPost => ({
  id: dto.id,
  title: dto.title,
  excerpt: dto.excerpt,
  publishedAt: dayjs(dto.published_at).toDate(),
})
```

## 6. Domain API

```ts
// data/posts/posts.api.ts
import { api } from "@/app/infrastructure/facade/axios"
import { parse } from "valibot"

import { mapPostDtoToPost } from "./posts.mapper"
import { PostsResponseSchema } from "./posts.schema"
import type { IPost } from "./posts.types"

export const getPosts = async (): Promise<IPost[]> => {
  const response = await api.get("/posts")

  const dto = parse(
    PostsResponseSchema,
    response.data as unknown,
  )

  return dto.posts.map(mapPostDtoToPost)
}
```

Axios отвечает за transport. `data/posts` отвечает за endpoint, validation и domain mapping.

## 7. MobX store

```ts
// data/posts/posts.store.ts
import { makeAutoObservable, runInAction } from "mobx"

import { getPosts } from "./posts.api"
import type { IPost } from "./posts.types"

export class PostsStore {
  posts: IPost[] = []
  isLoading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get hasPosts(): boolean {
    return this.posts.length > 0
  }

  async load(): Promise<void> {
    this.isLoading = true
    this.error = null

    try {
      const posts = await getPosts()

      runInAction(() => {
        this.posts = posts
      })
    } catch {
      runInAction(() => {
        this.error = "Не удалось загрузить посты"
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }
}

export const postsStore = new PostsStore()
```

HTTP-слой здесь отвечает только за transport. `PostsStore` по-прежнему владеет состоянием сценария: загрузкой, ошибкой и списком постов.

## 8. Public API

```ts
// data/posts/index.ts
import { PostsStore, postsStore } from "./posts.store"
import type { IPost } from "./posts.types"

export {
  PostsStore,
  postsStore,
  type IPost,
}
```

Schema, DTO, mapper и raw API operation не обязаны быть публичными.

## 9. Smart React component

```tsx
// components/posts/widgets/PostsWidget/PostsWidget.tsx
import { observer } from "mobx-react-lite"

import { postsStore } from "@/data/posts"

import { PostsList } from "../../ui/PostsList"

export const PostsWidget = observer(() => {
  if (postsStore.isLoading) {
    return <p>Загрузка...</p>
  }

  if (postsStore.error) {
    return <p>{postsStore.error}</p>
  }

  return <PostsList posts={postsStore.posts} />
})

PostsWidget.displayName = "PostsWidget"
```

## 10. Dumb UI

```tsx
// components/posts/ui/PostsList/PostsList.tsx
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

UI не знает Axios, schema и DTO.

## 11. Page

```tsx
// pages/Posts/Posts.page.tsx
import { PostsWidget } from "@/components/posts"

export const PostsPage = () => <PostsWidget />

PostsPage.displayName = "PostsPage"
```

## Где Core, а где Stack

**Core:**

```txt
unknown → Valibot → DTO → mapper → MobX → React
```

**Full Stack:**

```txt
Axios facade
dayjs inside mapper
```

Если Axios или dayjs заменить, Core-поток остаётся тем же.

См. [Example project](/example/) для полного проекта.
