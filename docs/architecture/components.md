# Слой components

`components` содержит UI-модули приложения. В блоге это могут быть карточки постов, список постов, редактор и блок комментариев.

## Dumb UI

Dumb-компонент получает всё через props.

```tsx
interface IPostCardProps {
  title: string
  authorName: string
}

export const PostCard = ({ title, authorName }: IPostCardProps) => (
  <article>
    <h2>{title}</h2>
    <p>{authorName}</p>
  </article>
)

PostCard.displayName = "PostCard"
```

Он не импортирует MobX store.

## Smart UI

Smart-компонент соединяет `data` и dumb UI.

```tsx
import { observer } from "mobx-react-lite"

import { postsStore } from "@/data/posts"

import { PostsList } from "../../ui/PostsList"

export const PostsWidget = observer(() => (
  <PostsList posts={postsStore.posts} />
))

PostsWidget.displayName = "PostsWidget"
```

## Рекомендуемая структура

```txt
components/posts/
  ui/
    PostCard/
      PostCard.tsx
    PostsList/
      PostsList.tsx
  widgets/
    PostsWidget/
      PostsWidget.tsx
  index.ts
```

Не добавляйте `ui/widgets` автоматически каждому модулю. Делите только если обе роли реально существуют.

## `observer`

`observer` нужен компоненту, который читает observable/computed MobX state.

Dumb-компоненту, который получает обычные props, `observer` обычно не нужен.

## Как выбрать место

```txt
универсальный Button
→ shared/ui

PostCard, знающий сущность поста
→ components/posts/ui

PostsWidget, читающий postsStore
→ components/posts/widgets

CommentsSection, нужный только PostPage
→ pages/Post/sections
```
