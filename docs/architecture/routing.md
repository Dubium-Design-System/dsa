# React Router и границы приложения

В общей DSA-документации слой `app` не описывает конкретную транспортную инфраструктуру. Его главная интеграционная роль — собрать React и React Router.

## Router принадлежит `app`

Router описывает структуру приложения и связывает URL с `pages`.

Маршруты с общей частью URL лучше группировать в одну ветку через `children`:

```tsx
// app/router/router.tsx
import { createBrowserRouter } from "react-router"

import { EditPostPage } from "@/pages/EditPost"
import { PostPage } from "@/pages/Post"
import { PostsPage } from "@/pages/Posts"

export const router = createBrowserRouter([
  {
    path: "/posts",
    children: [
      {
        index: true,
        element: <PostsPage />,
      },
      {
        path: ":postId",
        element: <PostPage />,
      },
      {
        path: ":postId/edit",
        element: <EditPostPage />,
      },
    ],
  },
])
```

Так Router явно показывает общую ветку:

```txt
/posts
├── /posts/:postId
└── /posts/:postId/edit
```

При этом `PostPage` **не рендерится внутри `PostsPage`**.

У route `/posts` в примере нет `element`. Он нужен только как общий URL-префикс для дочерних маршрутов. Поэтому `<Outlet />` здесь не требуется.

`app` знает `pages`, потому что собирает из них приложение. `pages` не импортируют Router-конфигурацию обратно.

## Вложенный URL не означает вложенный UI

Не связывайте иерархию URL с иерархией React-компонентов автоматически.

Такие маршруты:

```txt
/posts
/posts/:postId
/posts/:postId/edit
```

обычно представляют три самостоятельные `page`:

```txt
PostsPage
PostPage
EditPostPage
```

Не нужно делать `PostPage` дочерним компонентом `PostsPage` только потому, что их URL имеют общий префикс.

### Когда нужен `<Outlet />`

`<Outlet />` нужен, когда у ветки маршрутов действительно есть общий UI, который должен оставаться на экране при переключении дочерних страниц.

Например, можно добавить общий layout блога:

```tsx
// pages/PostsLayout/PostsLayout.page.tsx
import { Outlet } from "react-router"

export const PostsLayout = () => {
  return (
    <main>
      <header>
        <h1>Blog</h1>
      </header>

      <Outlet />
    </main>
  )
}

PostsLayout.displayName = "PostsLayout"
```

Тогда Router использует layout как родительский `element`:

```tsx
import { PostsLayout } from "@/pages/PostsLayout"

export const router = createBrowserRouter([
  {
    path: "/posts",
    element: <PostsLayout />,
    children: [
      {
        index: true,
        element: <PostsPage />,
      },
      {
        path: ":postId",
        element: <PostPage />,
      },
      {
        path: ":postId/edit",
        element: <EditPostPage />,
      },
    ],
  },
])
```

Теперь подходящая дочерняя `page` рендерится в `<Outlet />` внутри `PostsLayout`.

Правило простое:

- общий URL-префикс → можно сгруппировать routes через `children`;
- общий UI → добавьте layout с `<Outlet />`;
- самостоятельный экран → оставьте отдельной `page`, даже если URL вложенный.

## Route params читаются у владельца маршрута

```tsx
// pages/Post/Post.page.tsx
import { useParams } from "react-router"

import { PostDetails } from "@/components/posts"

export const PostPage = () => {
  const { postId } = useParams()

  if (!postId) {
    return <p>Пост не найден</p>
  }

  return <PostDetails postId={postId} />
}

PostPage.displayName = "PostPage"
```

После чтения параметра передавайте обычное значение. MobX store не должен сам обращаться к React Router.

## Навигация остаётся в React-слое

Если после сохранения формы нужно перейти к посту, `useNavigate` используется в React-компоненте:

```tsx
const navigate = useNavigate()

const handleSaved = (postId: string) => {
  navigate(`/posts/${postId}`)
}
```

Store может вернуть `postId`, но не должен выполнять route navigation.

## Что намеренно вне scope

DSA не задаёт конкретный HTTP-клиент, transport layer. Эти решения могут отличаться между проектами и не нужны для объяснения границ React, MobX и data-layer.
