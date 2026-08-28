# View models

View model нужен не каждому экрану. Это специальный read-only слой, когда одному представлению нужно удобно собрать данные из нескольких stores.

## Пример

Страница поста показывает сам пост и имя автора.

```ts
export interface IPostDetailsRow {
  id: string
  title: string
  authorName: string
}

export class PostDetailsVm {
  constructor(
    private readonly postsStore: IPostsStore,
    private readonly authorsStore: IAuthorsStore,
  ) {
    makeAutoObservable(this, {
      postsStore: false,
      authorsStore: false,
    })
  }

  get row(): IPostDetailsRow | null {
    const post = this.postsStore.selectedPost

    if (!post) {
      return null
    }

    return {
      id: post.id,
      title: post.title,
      authorName:
        this.authorsStore.byId.get(post.authorId)?.name ?? "Неизвестный автор",
    }
  }
}
```

## Что делает VM

VM может:

- читать несколько stores;
- вычислять данные для конкретного представления;
- объединять их в удобную read-only форму.

## Что VM не делает

VM не должна:

- становиться вторым store с дублируемым state;
- владеть внешней schema;
- заменять mapper DTO;
- выполнять React navigation.

## Когда VM не нужна

Если компоненту достаточно:

```tsx
<PostCard post={postsStore.selectedPost} />
```

создавать `PostCardVm` только ради архитектурного слоя не нужно.

View model появляется из реальной сложности чтения, а не по шаблону.
