# Scope DSA Core

Эта страница фиксирует, о каких библиотеках **может говорить Core-документация**.

| Библиотека | Роль в Core |
|---|---|
| `react` | UI и композиция компонентов |
| `react-router` | маршруты, параметры URL и route-level композиция |
| `mobx` | состояние, actions и computed |
| `mobx-react-lite` | подключение MobX state к React через `observer` |
| `react-hook-form` | состояние и lifecycle формы |
| `valibot` | runtime-проверка внешних данных и значений формы |
| `@hookform/resolvers` | соединение Valibot schema с React Hook Form |

## Что намеренно не входит в Core

Core не выбирает:

- HTTP-клиент;
- библиотеку дат;
- способ сборки CSS class names;
- Sass или другую технологию стилей;
- transport для realtime-событий;
- конкретную реализацию EventBus;
- backend;
- test runner;
- build tool.

Например, Core говорит:

```txt
внешний response считается unknown
→ schema проверяет его
→ mapper переводит его в тип приложения
```

Но Core **не обязан знать**, Axios это был, `fetch` или другой transport.

## Формы

Для формы Core может показать связку:

```ts
import { valibotResolver } from "@hookform/resolvers/valibot"
import { useForm } from "react-hook-form"

const form = useForm<PostFormValues>({
  resolver: valibotResolver(PostFormSchema),
})
```

Это часть заявленного scope.

## MobX и React

Core также может показать:

```tsx
import { observer } from "mobx-react-lite"

export const PostsWidget = observer(() => {
  return <PostsList posts={postsStore.posts} />
})

PostsWidget.displayName = "PostsWidget"
```

## Где смотреть полный стек

Если нужно понять:

- где живёт настроенный Axios client;
- как `data/posts` выполняет HTTP-запрос;
- куда положить interceptors;
- где связывать WebSocket с stores;
- где использовать dayjs;
- как применять clsx и Sass Modules;

перейдите в [Full Stack Guide](/full-stack/).

::: info Главное различие
Core говорит **что должно быть разделено**. Full Stack Guide показывает **чем и где это реализовано в конкретном проекте**.
:::
