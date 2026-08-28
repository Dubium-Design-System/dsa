# React Router и границы приложения

В общей DSA-документации слой `app` не описывает конкретную транспортную инфраструктуру. Его главная интеграционная роль — собрать React и React Router.

## Router принадлежит `app`

```tsx
// app/router/router.tsx
import { createBrowserRouter } from "react-router"

import { EditPostPage } from "@/pages/EditPost"
import { PostPage } from "@/pages/Post"
import { PostsPage } from "@/pages/Posts"

export const router = createBrowserRouter([
  {
    path: "/posts",
    element: <PostsPage />,
  },
  {
    path: "/posts/:postId",
    element: <PostPage />,
  },
  {
    path: "/posts/:postId/edit",
    element: <EditPostPage />,
  },
])
```

`app` знает pages, потому что собирает из них приложение. Pages не импортируют Router-конфигурацию обратно.

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
