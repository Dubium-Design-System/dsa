# Композиция нескольких data-slices

Обычные domain slices лучше держать независимыми. Но некоторым представлениям нужны данные сразу из нескольких источников.

Для блога пример — детали поста:

```txt
posts + authors + comments
```

## Не связывайте slices напрямую

Плохая цепочка:

```txt
data/posts → data/authors
data/authors → data/posts
```

Со временем она создаёт циклы и размывает владельцев.

## Отдельный владелец композиции

Создайте slice или view model, чья задача явно состоит в композиции:

```txt
data/post-details/
  post-details.vm.ts
  post-details.types.ts
  index.ts
```

```txt
data/post-details → data/posts
data/post-details → data/authors
data/post-details → data/comments
```

`posts`, `authors` и `comments` при этом ничего не знают о `post-details`.

## Когда нужен composite store

Если композиция не только читает данные, но и имеет собственное состояние и actions, отдельный store оправдан.

Например, мастер редактирования поста может координировать несколько внутренних частей:

```ts
export interface IPostEditorFlowStore {
  readonly draft: IPostDraftStore
  readonly preview: IPostPreviewStore
  reset(): void
}

export class PostEditorFlowStore implements IPostEditorFlowStore {
  readonly draft = new PostDraftStore()
  readonly preview = new PostPreviewStore()

  reset(): void {
    this.draft.reset()
    this.preview.reset()
  }
}
```

## Как выбрать вид композиции

- только вычисляемое чтение → VM;
- собственный state/actions/lifecycle → composite store;
- простая передача двух props в одном компоненте → никакой дополнительный слой не нужен.
