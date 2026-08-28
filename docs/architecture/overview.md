# Обзор слоёв

DSA использует пять основных слоёв.

```txt
app
 ↓
pages
 ↓
components
 ↓
data
 ↓
shared
```

Стрелка показывает допустимое направление знания: верхний слой может собирать нижний.

## Как выбрать слой

| Вопрос | Слой |
|---|---|
| Код запускает React-приложение или собирает Router? | `app` |
| Код представляет конкретный URL? | `pages` |
| Код является UI-модулем приложения? | `components` |
| Код владеет данными, Valibot schema или MobX store? | `data` |
| Код универсален и не знает домен блога? | `shared` |

## `app`

Здесь находится корневая композиция React и React Router.

```txt
app/
  App.tsx
  router/
    router.tsx
```

`app` может импортировать все нижние слои, потому что именно здесь приложение собирается целиком.

## `pages`

Page соответствует маршруту и собирает экран.

```txt
pages/
  Posts/
    Posts.page.tsx
  Post/
    Post.page.tsx
  EditPost/
    EditPost.page.tsx
```

Page может прочитать `postId` через React Router, но не должна превращаться в новый data-layer.

## `components`

Здесь живут UI-модули приложения.

```txt
components/posts/
  ui/
    PostsList/
  widgets/
    PostsWidget/
```

`ui` работает на props. `widgets` может читать public API `data`.

## `data`

Здесь находятся:

- Valibot schemas;
- DTO;
- mappers;
- MobX stores;
- типы приложения;
- public API slice.

```txt
data/posts/
  posts.schema.ts
  posts.dto.ts
  posts.mapper.ts
  posts.store.ts
  posts.types.ts
  index.ts
```

## `shared`

Здесь только универсальный код, которому не нужно знать, что приложение — блог.

Например, универсальный React-компонент `Button` может жить в `shared/ui`. Компонент `PostCard` уже знает сущность поста и относится к `components`.

## Локальные блоки page

Если блок нужен только одной странице, не поднимайте его в `components` заранее.

```txt
pages/Post/
  Post.page.tsx
  sections/
    CommentsSection.tsx
```

Когда появится второй реальный потребитель, блок можно вынести.

## Быстрая проверка

Спросите: **если я удалю страницу блога, этот код всё ещё нужен?**

- нет, только этой странице → `pages`;
- да, другим экранам блога → `components` или `data`;
- да, вообще любому React-проекту → возможно `shared`.
