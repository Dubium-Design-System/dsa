# Пример: создание и редактирование поста

Этот пример показывает, как один домен может иметь два похожих, но разных сценария формы.

## Общая форма значений

Если create и edit используют одинаковые поля, можно переиспользовать тип формы:

```ts
import {
  minLength,
  object,
  pipe,
  string,
  type InferOutput,
} from "valibot"

export const PostFormSchema = object({
  title: pipe(string(), minLength(1, "Введите заголовок")),
  body: pipe(string(), minLength(1, "Введите текст")),
})

export type PostFormValues = InferOutput<typeof PostFormSchema>
```

## Create page

```tsx
import { valibotResolver } from "@hookform/resolvers/valibot"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"

import {
  PostFormSchema,
  type PostFormValues,
} from "@/data/post-editor"

export const CreatePostPage = () => {
  const navigate = useNavigate()

  const form = useForm<PostFormValues>({
    resolver: valibotResolver(PostFormSchema),
  })

  const submit = async (values: PostFormValues) => {
    const postId = await createPost(values)
    navigate(`/posts/${postId}`)
  }

  return <PostEditorForm form={form} onSubmit={submit} />
}

CreatePostPage.displayName = "CreatePostPage"
```

## Edit page

```tsx
import { useParams } from "react-router"

export const EditPostPage = () => {
  const { postId } = useParams()

  if (!postId) {
    return <p>Не указан пост</p>
  }

  return <PostEditor postId={postId} />
}

EditPostPage.displayName = "EditPostPage"
```

## Что можно переиспользовать

Переиспользуйте:

- Valibot schema формы, если требования к полям одинаковы;
- dumb UI редактора;
- общие типы значений.

Не объединяйте автоматически:

- lifecycle создания и редактирования;
- состояние loading;
- правила инициализации;
- route params.

Похожий UI не означает одинаковый сценарий.
