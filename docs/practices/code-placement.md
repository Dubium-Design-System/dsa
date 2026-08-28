# Куда класть код

Эта страница — практическая шпаргалка.

## Шпаргалка

| Код | Место |
|---|---|
| Router и корневая композиция | `app` |
| Экран конкретного URL | `pages` |
| UI-модуль блога | `components` |
| Valibot schema ответа | `data/<domain>` |
| DTO и mapper | `data/<domain>` |
| MobX store | `data/<domain>` |
| Универсальный React UI | `shared/ui` |
| Локальная секция одной страницы | рядом с page |

## Как принять решение за минуту

### 1. Код владеет данными?

Если это schema, DTO, mapper, MobX store или внутренний тип поста:

```txt
data/posts
```

### 2. Код знает домен блога?

Если да, это уже не `shared`.

```txt
PostCard → components/posts
Button → shared/ui
```

### 3. Код соответствует URL?

Если компонент представляет конкретный route:

```txt
/posts/:postId → pages/Post
```

### 4. Код только соединяет store и UI?

Smart-компонент:

```txt
components/posts/widgets
```

### 5. Код нужен только одной page?

Оставьте рядом с ней:

```txt
pages/Post/sections
```

Не поднимайте его заранее.

## DTO

DTO живёт внутри `data` и не используется как React props.

```txt
unknown → Valibot → DTO → mapper → IPost
```

## Stores

Пример читаемого контракта:

```txt
IPostsState
IPostsActions
IPostsComputed
IPostsStore
PostsStore implements IPostsStore
```

Для маленького store интерфейс можно упростить.

## Большая форма

```txt
значения полей → React Hook Form
валидация формы → Valibot
сценарное состояние → MobX
```

Не копируйте все значения формы в store.

## Если всё ещё непонятно

Сформулируйте назначение файла одним предложением.

- «Проверяет внешний список постов» → `data/posts`.
- «Рисует карточку поста по props» → `components/posts/ui`.
- «Показывает страницу `/posts/:postId`» → `pages/Post`.
- «Соединяет `postsStore` со списком» → `components/posts/widgets`.
- «Универсальная кнопка» → `shared/ui`.

Если предложение содержит двух разных владельцев, возможно, файл делает слишком много.
