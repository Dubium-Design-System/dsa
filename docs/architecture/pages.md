# Слой pages

Page — React-компонент, который соответствует маршруту и собирает экран.

## Пример структуры блога

```txt
pages/
  Posts/
    Posts.page.tsx
    index.ts
  Post/
    Post.page.tsx
    sections/
      CommentsSection.tsx
    index.ts
  EditPost/
    EditPost.page.tsx
    index.ts
```

Не создавайте группы `public/private/general`, пока они не отражают реальную структуру маршрутов проекта.

## Что делает page

Page может:

- читать route params через React Router;
- собирать несколько UI-модулей;
- размещать локальные sections;
- определять page-level fallback.

Page не должна:

- описывать DTO;
- хранить Valibot schema ответа сервера;
- реализовывать MobX store домена;
- выполнять mapping внешнего контракта.

## Пример страницы поста

```tsx
import { useParams } from "react-router"

import { PostDetails } from "@/components/posts"

import { CommentsSection } from "./sections/CommentsSection"

export const PostPage = () => {
  const { postId } = useParams()

  if (!postId) {
    return <p>Не указан идентификатор поста</p>
  }

  return (
    <main>
      <PostDetails postId={postId} />
      <CommentsSection postId={postId} />
    </main>
  )
}

PostPage.displayName = "PostPage"
```

## Sections

`sections` принадлежат одной page.

```txt
pages/Post/sections/CommentsSection.tsx
```

Если `CommentsSection` начинает использоваться на нескольких страницах, это сигнал вынести её в `components/comments`.

## Lazy routes

Route-level lazy loading принадлежит Router-композиции или page public API. Не прячьте domain state внутрь lazy-wrapper.

## Имена

Имя page должно отражать route-смысл:

```txt
/posts             → PostsPage
/posts/:postId     → PostPage
/posts/:postId/edit → EditPostPage
```

Так новичку легче связать файловую структуру с URL.
