# Axios и HTTP facade

::: info Что здесь относится к стеку
DSA Core требует проверять внешние данные до попадания в состояние приложения. **Axios facade** — конкретный способ организовать HTTP в нашем полном стеке.
:::

## Почему Axios не импортируется напрямую в каждый data-slice

Такой код работает технически:

```ts
import axios from "axios"

export const loadPosts = async () => {
  return axios.get("/posts")
}
```

Но тогда каждый slice сам начинает решать:

- какой `baseURL` использовать;
- какие headers добавлять;
- как настраивать timeout;
- как нормализовать технические ошибки;
- какие interceptors включать.

В полном стеке эта ответственность вынесена в facade.

## Структура

```txt
app/infrastructure/facade/axios/
  axios.clients.ts
  axios.handler.ts
  axios.types.ts
  index.ts

data/posts/
  posts.api.ts
  posts.schema.ts
  posts.dto.ts
  posts.mapper.ts
  posts.store.ts
  posts.types.ts
  index.ts
```

## Facade

Facade предоставляет нижним слоям **узкий настроенный API**.

```ts
// app/infrastructure/facade/axios/axios.clients.ts
import axios from "axios"

export const api = axios.create({
  baseURL: "/api",
})
```

```ts
// app/infrastructure/facade/axios/index.ts
import { api } from "./axios.clients"

export { api }
```

Domain-код не конфигурирует Axios заново.

## Data-slice владеет endpoint и контрактом

```ts
// data/posts/posts.api.ts
import { api } from "@/app/infrastructure/facade/axios"

export const getPostsResponse = async (): Promise<unknown> => {
  const response = await api.get("/posts")

  return response.data
}
```

Обратите внимание на `Promise<unknown>`.

Даже если TypeScript generic позволяет написать:

```ts
api.get<PostsResponseDto>("/posts")
```

он не выполняет runtime-проверку ответа сервера. Поэтому внешний payload всё равно рассматривается как `unknown`.

## Проверка Valibot остаётся в data

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
// data/posts/posts.mapper.ts
import { parse } from "valibot"

import { PostsResponseSchema } from "./posts.schema"

export const parsePostsResponse = (input: unknown) =>
  parse(PostsResponseSchema, input)
```

Цепочка полного стека выглядит так:

```txt
Axios
  ↓
response.data: unknown
  ↓
Valibot
  ↓
DTO
  ↓
mapper
  ↓
Post
  ↓
MobX store
```

## Что принадлежит facade

`app/infrastructure/facade/axios` может владеть:

- настроенными Axios instances;
- interceptors;
- project HTTP configuration;
- generic request lifecycle helper;
- Axios-specific public types;
- технической нормализацией transport errors.

## Что facade не должен знать

Facade не импортирует:

- `data/posts`;
- `data/comments`;
- React-компоненты;
- pages;
- router;
- domain schemas;
- domain DTO;
- domain stores.

Плохой пример:

```ts
// app/infrastructure/facade/axios/posts.ts
import { postsStore } from "@/data/posts"

// facade начал знать бизнес-состояние
```

## Что принадлежит data

`data/posts` владеет:

- endpoint operation для posts;
- `PostsResponseSchema`;
- DTO, выведенным из schema;
- mapper;
- `PostsStore`;
- бизнес-состоянием запроса.

То есть Axios выполняет transport, но не становится владельцем домена.

## Когда нужен AxiosHandler

Если проект использует общий `AxiosHandler` для loading, cancellation или нормализации transport lifecycle, он остаётся частью facade.

Упрощённо:

```ts
const request = new AxiosHandler(api)

const input = await request.getUnknown("/posts")
```

Но domain schema всё равно остаётся в `data/posts`.

::: tip Проверка
Если завтра Axios заменить другой библиотекой, `posts.schema.ts`, `posts.mapper.ts`, `posts.types.ts` и большая часть `PostsStore` не должны переписываться.
:::

См. также [Example project](/example/).
