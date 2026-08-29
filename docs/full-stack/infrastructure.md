# Application infrastructure

Полный стек использует `app/infrastructure`, чтобы отделить глобальные технические механизмы от бизнес-кода.

Внутри есть три разные роли:

```txt
app/infrastructure/
  adapter/
  facade/
  error-boundary/
```

Их не стоит объединять в один общий barrel.

## Facade

Facade даёт нижним слоям стабильный технический API.

В текущем стеке главный пример — Axios:

```txt
app/infrastructure/facade/axios
```

`data` может использовать этот facade для HTTP, но не получает через него доступ ко всему `app`.

```txt
data/posts
   ↓
app/infrastructure/facade/axios
```

Это **узкое разрешённое исключение** из обычного направления product-зависимостей.

## Adapter

Adapter выполняет application-specific wiring.

Пример: блог получает realtime-событие `post:published`. Есть три разные ответственности:

```txt
shared/lib/event-bus
  универсальный механизм publish/subscribe

data/posts
  schema события и PostsStore

app/infrastructure/adapter/event-bus
  связывание события с postsStore
```

### Generic engine

```ts
// shared/lib/event-bus/event-bus.types.ts
export interface IEventBusEngine {
  publish(event: unknown): void
  subscribe(type: string, handler: (event: unknown) => void): VoidFunction
  destroy(): void
}
```

Generic engine не знает слова `post`.

### Contract принадлежит data

```ts
// data/posts/posts.events.ts
import { literal, object, safeParse, string } from "valibot"

const PostPublishedEventSchema = object({
  type: literal("post:published"),
  postId: string(),
})

export const parsePostPublishedEvent = (input: unknown) =>
  safeParse(PostPublishedEventSchema, input)
```

Внешнее событие, как и HTTP response, считается `unknown`.

### Adapter связывает механизм и домен

```ts
// app/infrastructure/adapter/event-bus/posts-events.adapter.ts
import {
  parsePostPublishedEvent,
  postsStore,
} from "@/data/posts"
import type { IEventBusEngine } from "@/shared/lib/event-bus"

export class PostsEventsAdapter {
  private unsubscribe: VoidFunction | null = null

  constructor(private readonly eventBus: IEventBusEngine) {}

  init(): void {
    if (this.unsubscribe) {
      return
    }

    this.unsubscribe = this.eventBus.subscribe(
      "post:published",
      (event: unknown) => {
        const result = parsePostPublishedEvent(event)

        if (!result.success) {
          return
        }

        postsStore.markPublished(result.output.postId)
      },
    )
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
    }

    this.unsubscribe = null
  }
}
```

`PostPublishedEventSchema` остаётся private. Adapter получает только узкий parser через public API `data/posts`.

## WebSocket, BroadcastChannel и SSE

Тот же принцип применяется к любому transport:

```txt
generic transport engine
        ↓
application adapter
        ↓
public API owning data-slice
```

Transport не должен напрямую мутировать произвольные stores.

## Lifecycle

Любой adapter, который создаёт подписку или соединение, обязан иметь симметричный cleanup.

```txt
init       ↔ dispose
connect    ↔ disconnect
subscribe  ↔ unsubscribe
create     ↔ destroy
```

`init` либо idempotent, либо явно запрещает повторный вызов.

## Error Boundary

`app/infrastructure/error-boundary` содержит reusable application-level реализацию React Error Boundary.

При этом **место реализации не определяет место композиции**:

- root boundary компонуется в `app`;
- route boundary компонуется в `app/router`;
- локальный специализированный boundary может компоноваться рядом с владельцем сценария.

Нижний слой не должен импортировать application Error Boundary просто потому, что ему нужно обработать ошибку.

## Направление зависимостей

Разрешённые инфраструктурные отношения полного стека:

```txt
data → app/infrastructure/facade/axios → shared

app/infrastructure/adapter
  → data
  → app/infrastructure/facade
  → shared
```

При этом:

```txt
data      ✕→ adapter
shared    ✕→ adapter
pages     ✕→ adapter
components✕→ adapter
```

## Простое правило

**Facade** отвечает: «какой технический API доступен нижним слоям?»

**Adapter** отвечает: «как глобальный механизм связан с конкретным приложением?»

**Data** отвечает: «какие бизнес-данные и правила принадлежат домену?»

См. [полную структуру блога](/full-stack/project-structure).
