# Масштабирование stores

Большой store сам по себе не ошибка. Проблема начинается, когда у него появляются несколько независимых причин изменяться.

## Признаки перегрузки

`PostsStore` стоит разделить, если он одновременно управляет:

- списком постов;
- выбранным постом;
- редактором;
- комментариями;
- несколькими независимыми loading/error state;
- разным lifecycle.

## Разделение по сценариям

Вместо:

```txt
BlogStore
```

может появиться:

```txt
PostsListStore
PostDetailsStore
PostEditorStore
CommentsStore
```

Не делите раньше времени. Сначала должна появиться реальная независимость.

## Flow-first структура

```txt
data/posts/
  list/
    list.store.ts
  details/
    details.store.ts
  editor/
    editor.store.ts
  index.ts
```

## Aggregate store

Иногда отдельный store действительно координирует несколько частей одного сценария.

```ts
export class PostEditorFlowStore {
  readonly draft = new PostDraftStore()
  readonly preview = new PostPreviewStore()

  reset(): void {
    this.draft.reset()
    this.preview.reset()
  }
}
```

Это допустимо, если `PostEditorFlowStore` имеет собственную понятную ответственность.

## View model не лечит перегруженный store

Если store выполняет слишком много actions, добавление VM сверху не уменьшит его ответственность.

VM решает проблему **чтения нескольких stores**, а не проблему слишком большого state owner.

## Singleton или локальный store

Простой ориентир:

- состояние нужно всему приложению долго → singleton может быть уместен;
- состояние принадлежит конкретному route/editor → локальный экземпляр обычно понятнее.

Решение определяется lifecycle, а не размером class.
