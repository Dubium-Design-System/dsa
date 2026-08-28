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

## Async actions

Store может координировать асинхронный сценарий, если зависимость передана ему через понятный контракт.

```ts
export interface IPostsSource {
  load(): Promise<IPost[]>
}

export class PostsStore implements IPostsStore {
  posts: IPost[] = []
  isLoading = false

  constructor(private readonly source: IPostsSource) {
    makeAutoObservable(this)
  }

  async load(): Promise<void> {
    this.isLoading = true

    try {
      this.posts = await this.source.load()
    } finally {
      this.isLoading = false
    }
  }
}
```

DSA не фиксирует технологию, которая реализует `IPostsSource`.

## Store не должен

Store не должен:

- возвращать JSX;
- вызывать React hooks;
- читать `useParams`;
- выполнять `navigate`;
- хранить touched/dirty каждого поля формы, если этим уже владеет React Hook Form.

## Singleton или локальный экземпляр

App-wide список постов:

```ts
export const postsStore = new PostsStore(postsSource)
```

Редактор конкретного поста может жить только вместе со страницей и создаваться локально.

Главный вопрос: **кто владеет временем жизни состояния?**

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
