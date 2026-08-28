# Полная структура блога

Эта структура показывает, как Core и Full Stack Guide складываются в один проект.

Не воспринимайте дерево как шаблон, который нужно создать целиком в первый день. Папки появляются, когда для них есть ответственность.

```txt
src/
  main.tsx

  app/
    index.tsx

    router/
      AppRoutes.tsx
      layouts/
        BlogLayout.tsx
      guards/
      index.ts

    infrastructure/
      adapter/
        event-bus/
          event-bus.instance.ts
          posts-events.adapter.ts
          index.ts
        index.ts

      facade/
        axios/
          axios.clients.ts
          axios.handler.ts
          axios.types.ts
          index.ts

      error-boundary/
        AppErrorBoundary.tsx
        ErrorBoundaryFallback.tsx
        index.ts

  pages/
    Posts/
      Posts.page.tsx
      Posts.module.scss
      index.ts

    Post/
      Post.page.tsx
      Post.module.scss
      sections/
        CommentsSection/
      index.ts

    PostCreate/
      PostCreate.page.tsx
      index.ts

    PostEdit/
      PostEdit.page.tsx
      index.ts

  components/
    posts/
      widgets/
        PostsWidget/
          PostsWidget.tsx
          index.ts

      ui/
        PostCard/
          PostCard.tsx
          PostCard.module.scss
          index.ts

      index.ts

    comments/
      widgets/
      ui/
      index.ts

    post-editor/
      widgets/
        PostEditorForm/
          PostEditorForm.tsx
          index.ts
      ui/
      index.ts

  data/
    posts/
      posts.api.ts
      posts.dto.ts
      posts.mapper.ts
      posts.schema.ts
      posts.store.ts
      posts.types.ts
      posts.events.ts
      index.ts

    authors/
      authors.api.ts
      authors.dto.ts
      authors.mapper.ts
      authors.schema.ts
      authors.store.ts
      authors.types.ts
      index.ts

    comments/
      comments.api.ts
      comments.dto.ts
      comments.mapper.ts
      comments.schema.ts
      comments.store.ts
      comments.types.ts
      index.ts

    post-editor/
      post-editor.api.ts
      post-editor.mapper.ts
      post-editor.schema.ts
      post-editor.store.ts
      post-editor.types.ts
      index.ts

  shared/
    assets/

    config/

    helpers/
      date/
        format-date.ts

    hooks/

    lib/
      event-bus/
        event-bus.engine.ts
        event-bus.types.ts
        index.ts

    types/

    ui/
      Button/
      Input/
      Spinner/
```

## Как читать дерево

### `app`

Запускает приложение, владеет router и application infrastructure.

### `pages`

Собирает конкретный экран маршрута.

### `components`

Содержит переиспользуемый продуктовый UI.

### `data`

Владеет external contracts, mappers, state и business operations.

### `shared`

Содержит generic-код, который не знает, что приложение является блогом.

## Где здесь Core, а где Stack

Core объясняет:

```txt
pages
components
data
shared
public API
Valibot
MobX stores
React Router
React Hook Form
```

Stack Guide добавляет:

```txt
app/infrastructure/facade/axios
app/infrastructure/adapter
dayjs helpers
*.module.scss
clsx
```

## Не создавайте всё заранее

Например, если EventBus проекту пока не нужен:

```txt
app/infrastructure/adapter/event-bus
shared/lib/event-bus
```

вообще не должны существовать.

Если `data/posts` остаётся маленьким, не нужно делить его на технические подпапки.

Архитектура должна объяснять существующий код, а не создавать пустые контейнеры ради красивого дерева.

См. [Example project](/example/), чтобы сопоставить структуру с работающим приложением.
