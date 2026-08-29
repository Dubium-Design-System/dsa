# Слой app

`app` — место, где приложение собирается целиком.

::: info Полный стек
Дополнительная application infrastructure намеренно не входит в Core-описание `app`. Её размещение для принятого проектного стека описано в [Full Stack Guide](/full-stack/infrastructure).
:::


## Что делает `app`

В рамках этой документации `app` отвечает за:

- корневой React-компонент;
- создание и подключение React Router;
- route-level композицию.

Пример:

```txt
app/
  App.tsx
  router/
    router.tsx
    routes.tsx
```

## Корневой компонент

```tsx
// app/App.tsx
import { RouterProvider } from "react-router"

import { router } from "./router/router"

export const App = () => <RouterProvider router={router} />

App.displayName = "App"
```

## Чего не должно быть в `app`

Не переносите сюда всё «важное».

`app` не должен становиться владельцем:

- post DTO;
- PostStore;
- Valibot schemas постов;
- формы редактирования поста;
- UI конкретной страницы.

Этим кодом владеют соответствующие `data`, `components` и `pages`.

