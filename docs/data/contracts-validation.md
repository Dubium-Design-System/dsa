# Контракты и runtime-валидация

Тип в коде не проверяет реальное значение во время выполнения. Поэтому всё, что пришло извне, сначала рассматривается как `unknown`.

## Проверка ответа

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

```ts
// data/posts/posts.dto.ts
import type { InferOutput } from "valibot"

import { PostsResponseSchema } from "./posts.schema"

export type PostsResponseDto = InferOutput<typeof PostsResponseSchema>
```

```ts
// data/posts/posts.parser.ts
import { parse } from "valibot"

import type { PostsResponseDto } from "./posts.dto"
import { PostsResponseSchema } from "./posts.schema"

export const parsePostsResponse = (input: unknown): PostsResponseDto =>
  parse(PostsResponseSchema, input)
```

Главное здесь не название функции. Главное правило:

```txt
unknown → parse(schema, value) → проверенный DTO
```

## Почему одного типа недостаточно

Такой код сообщает ожидание компилятору, но не проверяет реальный объект:

```ts
const value = input as PostsResponseDto
```

Если `posts` окажется `null`, assertion не спасёт приложение.

Valibot выполняет runtime-проверку.

## Schema и DTO без дублирования

Не пишите schema и DTO вручную параллельно.

```ts
export type PostsResponseDto = InferOutput<typeof PostsResponseSchema>
```

Так тип меняется вместе со schema.

## Mapper

DTO описывает внешний контракт. Тип приложения описывает удобную внутреннюю форму.

```ts
export interface IPost {
  id: string
  title: string
  publishedAt: Date
}
```

```ts
export const mapPostDtoToPost = (
  dto: PostsResponseDto["posts"][number],
): IPost => ({
  id: dto.id,
  title: dto.title,
  publishedAt: new Date(dto.published_at),
})
```

## Request и response — разные контракты

Форма создания поста и ответ с постом не обязаны использовать одну schema.

```txt
PostFormSchema
PostResponseSchema
```

Они меняются по разным причинам.

## Ошибки тоже могут быть `unknown`

Если приложение получает структурированное внешнее значение ошибки и хочет читать его поля, сначала проверьте его отдельной Valibot schema.

Не создавайте один «универсальный DTO ошибки» для всего приложения, если реальных общих полей нет.
