# Полная файловая структура на примере блога

Это **пример**, а не шаблон, который нужно копировать целиком. Создавайте только те части, которые реально нужны проекту.

```txt
src/
  app/
    App.tsx
    router/
      router.tsx

  pages/
    Posts/
      Posts.page.tsx
      index.ts
    Post/
      Post.page.tsx
      sections/
        CommentsSection.tsx
      index.ts
    CreatePost/
      CreatePost.page.tsx
      index.ts
    EditPost/
      EditPost.page.tsx
      index.ts

  components/
    header/
      BlogHeader.tsx
      index.ts

    posts/
      ui/
        PostCard/
          PostCard.tsx
        PostsList/
          PostsList.tsx
        PostDetailsView/
          PostDetailsView.tsx
      widgets/
        PostsWidget/
          PostsWidget.tsx
        PostDetails/
          PostDetails.tsx
      index.ts

    post-editor/
      ui/
        PostEditorForm/
          PostEditorForm.tsx
      widgets/
        PostEditor/
          PostEditor.tsx
      index.ts

    comments/
      ui/
        CommentsList/
          CommentsList.tsx
      widgets/
        CommentsWidget/
          CommentsWidget.tsx
      index.ts

  data/
    posts/
      posts.schema.ts
      posts.dto.ts
      posts.mapper.ts
      posts.parser.ts
      posts.store.ts
      posts.types.ts
      index.ts

    authors/
      authors.schema.ts
      authors.dto.ts
      authors.mapper.ts
      authors.store.ts
      authors.types.ts
      index.ts

    comments/
      comments.schema.ts
      comments.dto.ts
      comments.mapper.ts
      comments.store.ts
      comments.types.ts
      index.ts

    post-editor/
      post-form.schema.ts
      post-editor.store.ts
      post-editor.types.ts
      index.ts

    post-details/
      post-details.vm.ts
      post-details.types.ts
      index.ts

  shared/
    ui/
      Button/
        Button.tsx
      Input/
        Input.tsx
    hooks/
      useToggle.ts
    helpers/
      capitalize.ts
```

## Как читать структуру

### `app`

Только запуск React и Router-композиция.

### `pages`

Каждая page соответствует URL. Локальная `CommentsSection` остаётся рядом с `PostPage`, пока не понадобится другим страницам.

### `components`

`ui` ничего не знает о stores. `widgets` соединяет MobX public API с UI.

### `data`

Каждый домен владеет внешними контрактами, преобразованием и состоянием.

### `shared`

Только универсальный код без знания постов, авторов и комментариев.

## Не создавайте всё сразу

Для маленькой задачи старт может выглядеть так:

```txt
data/posts/
  posts.schema.ts
  posts.store.ts
  posts.types.ts
  index.ts

components/posts/
  PostsWidget.tsx

pages/Posts/
  Posts.page.tsx
```

Расширяйте структуру, когда появляется новая ответственность.
