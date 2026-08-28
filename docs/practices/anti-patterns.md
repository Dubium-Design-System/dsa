# Антипаттерны

Ниже частые ошибки в DSA. Смысл списка не в запретах ради запретов, а в сохранении понятного владельца.

## 1. React-компонент валидирует внешний DTO

Плохо:

```tsx
const post = parse(PostResponseSchema, input)

return <PostCard post={post} />
```

Почему: transport-контракт протёк в UI.

Лучше выполнить `unknown → Valibot → DTO → mapper` внутри `data`.

## 2. DTO используется как props

Плохо:

```ts
interface IPostCardProps {
  post: PostResponseDto
}
```

Лучше:

```ts
interface IPostCardProps {
  post: IPost
}
```

UI получает внутреннюю форму данных.

## 3. Mapper живёт в page

Page не должна знать, что внешний контракт использует `published_at`.

Mapper принадлежит владельцу данных:

```txt
data/posts/posts.mapper.ts
```

## 4. Store возвращает JSX

MobX store хранит состояние и действия. React-компонент отображает состояние.

```txt
store → данные
component → JSX
```

## 5. Store использует React hooks

`useParams`, `useNavigate`, `useForm` и другие React hooks не вызываются внутри MobX class.

Route params читаются в React-слое и передаются обычными значениями.

## 6. MobX дублирует React Hook Form

Плохо:

```txt
form.title
store.title
```

Если оба значения должны всегда совпадать, появился второй источник истины.

Поля формы оставьте React Hook Form. MobX используйте для состояния сценария, которое живёт отдельно.

## 7. Одна schema для формы и внешнего ответа

Даже одинаковые сегодня поля имеют разных владельцев.

```txt
PostFormSchema
PostResponseSchema
```

Их можно объединить только если это действительно один контракт, а не случайное совпадение.

## 8. `shared` знает про посты

Плохо:

```txt
shared/PostCard
shared/usePosts
```

Хорошо:

```txt
components/posts/PostCard
shared/ui/Button
```

## 9. Page содержит data-layer

Плохо:

```txt
pages/Post/
  post.schema.ts
  post.store.ts
```

Page представляет URL. Данные принадлежат `data`.

## 10. Deep import

Плохо:

```ts
import { postsStore } from "@/data/posts/posts.store"
```

Хорошо:

```ts
import { postsStore } from "@/data/posts"
```

## 11. Один огромный store

Если список, детали, редактор и комментарии имеют разный lifecycle, один `BlogStore` быстро становится точкой связанности всего приложения.

Разделяйте по владельцам и сценариям.

## 12. Store знает конкретный route

Плохо:

```ts
store.openPostRoute("/posts/123")
```

Store может вернуть `postId`. Навигацию выполняет React-слой через React Router.

## 13. `observer` ставится везде

`observer` нужен компоненту, который читает observable MobX state.

Dumb-компонент на обычных props не обязан быть observer.

## 14. Provider поднимается в `app` без причины

Локальный `PostEditorProvider` не должен становиться глобальным только потому, что Context удобно подключить наверху.

Размещайте provider рядом с владельцем lifecycle.

## 15. Структура создаётся заранее

Не создавайте пустые `api/`, `model/`, `schema/`, `mapper/` для каждого slice.

Начните плоско и разделяйте по мере роста.

## Итоговая проверка

Большинство проблем можно найти четырьмя вопросами:

1. Кто владеет кодом?
2. Не вышел ли внешний контракт в React?
3. Не идёт ли зависимость снизу вверх?
4. Не появилось ли два источника истины?
