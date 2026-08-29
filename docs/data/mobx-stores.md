# MobX stores

MobX store хранит состояние приложения и действия над ним.

## Контракт store

Для простого списка постов:

```ts
// data/posts/posts.types.ts
export interface IPostsState {
  readonly posts: IPost[]
  readonly isLoading: boolean
}

export interface IPostsActions {
  setPosts(posts: IPost[]): void
  setLoading(value: boolean): void
  reset(): void
}

export interface IPostsComputed {
  readonly hasPosts: boolean
}

export interface IPostsStore
  extends IPostsState,
    IPostsActions,
    IPostsComputed {}
```

```ts
// data/posts/posts.store.ts
import { makeAutoObservable } from "mobx"

export class PostsStore implements IPostsStore {
  posts: IPost[] = []
  isLoading = false

  constructor() {
    makeAutoObservable(this)
  }

  get hasPosts(): boolean {
    return this.posts.length > 0
  }

  setPosts(posts: IPost[]): void {
    this.posts = posts
  }

  setLoading(value: boolean): void {
    this.isLoading = value
  }

  reset(): void {
    this.posts = []
    this.isLoading = false
  }
}
```

Разделение интерфейса на state/actions/computed не обязательно для маленького store, но полезно в больших slices: контракт видно без чтения реализации.

## Асинхронная загрузка в store

Если UI должен показывать состояние загрузки, это состояние удобно хранить рядом с самими данными в MobX store.

В этом сценарии store отвечает за три вещи:

1. включить `isLoading` перед загрузкой;
2. сохранить полученные посты;
3. выключить `isLoading`, когда загрузка закончилась.

Сам способ получения постов — отдельная зависимость. Store не должен знать, используется ли внутри HTTP-клиент, mock или другой источник данных.

```ts
// data/posts/posts.types.ts
export interface IPostsLoader {
  loadPosts(): Promise<IPost[]>
}
```

```ts
// data/posts/posts.store.ts
import { makeAutoObservable, runInAction } from "mobx"

import type { IPost, IPostsLoader, IPostsStore } from "./posts.types"

export class PostsStore implements IPostsStore {
  posts: IPost[] = []
  isLoading = false

  constructor(private readonly loader: IPostsLoader) {
    makeAutoObservable(this, {
      loader: false,
    })
  }

  async load(): Promise<void> {
    this.isLoading = true

    try {
      const posts = await this.loader.loadPosts()

      runInAction(() => {
        this.posts = posts
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }
}
```

Последовательность получается простой:

```txt
React
  ↓ вызывает postsStore.load()
MobX store
  ↓ isLoading = true
IPostsLoader
  ↓ возвращает IPost[]
MobX store
  ↓ posts = result
  ↓ isLoading = false
React обновляется через observer
```

`IPostsLoader` здесь нужен только для того, чтобы отделить **управление состоянием** от **получения данных**. Это не отдельный обязательный слой DSA.

Почему после `await` используется `runInAction`: выполнение после `await` происходит уже вне исходной MobX action. Изменения observable-состояния после `await` нужно снова выполнить внутри action.

В Full Stack Guide роль загрузчика реализуется конкретной инфраструктурой и `data`-операцией. В Core важно только разделение ответственности: store управляет состоянием сценария, а транспорт не становится частью store.

## Store не должен

Store не должен:

- возвращать JSX;
- вызывать React hooks;
- читать `useParams`;
- выполнять `navigate`;
- хранить touched/dirty каждого поля формы, если этим уже владеет React Hook Form.

## Singleton или локальный экземпляр

Если список постов используется во всём приложении, экземпляр `PostsStore` может жить на уровне приложения и переиспользоваться между страницами.

Если состояние относится только к конкретной странице или сценарию, экземпляр создаётся вместе с его владельцем и уничтожается вместе с ним.

Главный вопрос: **кто владеет временем жизни состояния?**

Создание конкретного `IPostsLoader` и связывание его со store относятся уже к композиции приложения. В [Full Stack Guide](/full-stack/posts-flow) показан законченный вариант с реальным HTTP-потоком.

## React-подключение

MobX store становится реактивным UI через `observer` из `mobx-react-lite`.

```tsx
export const PostsWidget = observer(() => (
  <PostsList
    posts={postsStore.posts}
    isLoading={postsStore.isLoading}
  />
))
```
