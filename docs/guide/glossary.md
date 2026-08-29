# Термины

| Термин | Простыми словами | Пример из блога |
|---|---|---|
| Domain | Область данных и правил | `posts`, `authors`, `comments` |
| Data-slice | Самостоятельная часть `data` с одним владельцем | `data/posts` |
| Flow | Отдельный сценарий внутри большого домена | `posts/edit-post` |
| Store | MobX-объект с состоянием и действиями | `PostsStore` |
| State | Хранимые значения | `posts`, `isLoading`, `error` |
| Action | Действие, меняющее состояние | `setPosts`, `reset` |
| Computed | Значение, вычисляемое из state | `hasPosts` |
| Schema | Valibot-описание допустимой формы данных | `PostsResponseSchema` |
| DTO | Тип данных после успешной runtime-проверки | `PostsResponseDto` |
| Mapper | Чистое преобразование между формами данных | `published_at → publishedAt` |
| Public API | Разрешённые импорты модуля через `index.ts` | `@/data/posts` |
| Deep import | Импорт внутреннего файла в обход `index.ts` | `@/data/posts/posts.store` |
| Smart UI | React-компонент, который читает store | `PostsWidget` |
| Dumb UI | React-компонент только на props | `PostsList` |
| View model | Read-only композиция данных нескольких stores для одного представления | `PostDetailsVm` |

## Три термина, которые чаще всего путают

**Schema** проверяет форму данных во время выполнения.  
**DTO** описывает уже проверенный результат.  
**Модель приложения** — форма данных, удобная остальному коду.

Например:

```txt
unknown
  ↓ Valibot
PostDto { published_at: string }
  ↓ mapper
Post { publishedAt: Date }
```
