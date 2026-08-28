# Пример: `unknown → Valibot → Post`

Этот пример показывает только архитектурную границу данных. Способ HTTP-запроса намеренно не задаётся.

## 1. Schema ответа

```ts
// data/posts/posts.schema.ts
import { array, object, string } from "valibot"

const PostSchema = object({
  id: string(),
  title: string(),
  body: string(),
  author_id: string(),
  published_at: string(),
})

export const PostsResponseSchema = object({
  posts: array(PostSchema),
})
```

## 2. DTO из schema

```ts
// data/posts/posts.dto.ts
import type { InferOutput } from "valibot"

import { PostsResponseSchema } from "./posts.schema"

export type PostsResponseDto = InferOutput<typeof PostsResponseSchema>
```

## 3. Проверка внешнего значения

```ts
// data/posts/posts.parser.ts
import { parse } from "valibot"

import type { PostsResponseDto } from "./posts.dto"
import { PostsResponseSchema } from "./posts.schema"

export const parsePostsResponse = (input: unknown): PostsResponseDto =>
  parse(PostsResponseSchema, input)
```

До `parse` приложение не знает, соответствует ли объект ожидаемой форме.

## 4. Тип приложения

```ts
// data/posts/posts.types.ts
export interface IPost {
  id: string
  title: string
  body: string
  authorId: string
  publishedAt: Date
}
```

## 5. Mapper

```ts
// data/posts/posts.mapper.ts
import type { PostsResponseDto } from "./posts.dto"
import type { IPost } from "./posts.types"

export const mapPostDtoToPost = (
  dto: PostsResponseDto["posts"][number],
): IPost => ({
  id: dto.id,
  title: dto.title,
  body: dto.body,
  authorId: dto.author_id,
  publishedAt: new Date(dto.published_at),
})
```

## 6. Сборка результата

```ts
export const mapPostsResponse = (input: unknown): IPost[] => {
  const dto = parsePostsResponse(input)

  return dto.posts.map(mapPostDtoToPost)
}
```

## Что здесь принципиально

```txt
unknown
  ↓ Valibot
PostsResponseDto
  ↓ mapper
IPost[]
```

DTO не становится типом React props. UI получает уже внутреннюю модель `IPost`.
