# Пример: маршруты блога

Пример связывает React Router с pages, не передавая Router внутрь MobX stores.

## Router

```tsx
import { createBrowserRouter } from "react-router"

import { CreatePostPage } from "@/pages/CreatePost"
import { EditPostPage } from "@/pages/EditPost"
import { PostPage } from "@/pages/Post"
import { PostsPage } from "@/pages/Posts"

export const router = createBrowserRouter([
  {
    path: "/posts",
    element: <PostsPage />,
  },
  {
    path: "/posts/new",
    element: <CreatePostPage />,
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

## Page читает параметр

```tsx
import { useParams } from "react-router"

import { PostDetails } from "@/components/posts"

export const PostPage = () => {
  const { postId } = useParams()

  if (!postId) {
    return <p>Не указан пост</p>
  }

  return <PostDetails postId={postId} />
}

PostPage.displayName = "PostPage"
```

## Smart-компонент подключает MobX

```tsx
import { observer } from "mobx-react-lite"

import { postsStore } from "@/data/posts"

interface IPostDetailsProps {
  postId: string
}

export const PostDetails = observer(
  ({ postId }: IPostDetailsProps) => {
    const post = postsStore.byId.get(postId)

    if (!post) {
      return <p>Пост не найден</p>
    }

    return <PostDetailsView post={post} />
  },
)

PostDetails.displayName = "PostDetails"
```

## Почему store не читает URL сам

MobX store должен быть пригоден для использования вне конкретного route. Если store вызывает `useParams` или знает путь `/posts/:postId`, он становится связан с React Router.

Граница проще:

```txt
React Router → page → обычный postId → component/store
```
