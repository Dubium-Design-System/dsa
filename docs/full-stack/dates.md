# Даты и dayjs

DSA Core не требует библиотеку дат. В полном стеке для разбора, сравнения и форматирования используется `dayjs`.

## Где преобразовывать серверную дату

Пусть API возвращает:

```json
{
  "published_at": "2026-08-28T10:30:00Z"
}
```

Внешняя строка сначала проходит Valibot, а затем mapper.

```ts
// data/posts/posts.mapper.ts
import dayjs from "dayjs"

import type { PostDto } from "./posts.dto"
import type { IPost } from "./posts.types"

export const mapPostDtoToPost = (dto: PostDto): IPost => ({
  id: dto.id,
  title: dto.title,
  publishedAt: dayjs(dto.published_at).toDate(),
})
```

Так UI получает удобный внутренний тип, а формат backend не распространяется по компонентам.

## Где форматировать дату для UI

Если форматирование является простой универсальной операцией, можно использовать shared helper:

```ts
// shared/helpers/date/format-date.ts
import dayjs from "dayjs"

export const formatDate = (value: Date): string =>
  dayjs(value).format("DD.MM.YYYY")
```

```tsx
<time dateTime={post.publishedAt.toISOString()}>
  {formatDate(post.publishedAt)}
</time>
```

## Когда форматирование относится к data

Если значение имеет бизнес-смысл или является частью computed projection, оно может находиться в store/view model.

Например:

```ts
get isRecentlyPublished(): boolean {
  return dayjs().diff(this.post.publishedAt, "day") < 7
}
```

Важно не место самого `dayjs`, а владелец правила.

## Чего не делать

Не размазывайте повторяемое преобразование по JSX:

```tsx
// плохо: формат и timezone policy начинают повторяться
<span>{dayjs(post.publishedAt).format("DD.MM.YYYY")}</span>
```

Если такое выражение появляется в нескольких местах, вынесите политику туда, где ей действительно принадлежит место.

## Core-инвариант

Даже при использовании dayjs остаётся Core-цепочка:

```txt
unknown
  → Valibot
  → DTO
  → mapper
  → внутренний тип
```

`dayjs` только помогает реализовать один из шагов.
