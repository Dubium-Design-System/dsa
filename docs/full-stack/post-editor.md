# Сквозной сценарий: редактор поста

Теперь разберём write-flow:

```txt
React Hook Form
→ Valibot form schema
→ form values
→ request mapper
→ Axios facade
→ MobX operation state
→ React Router navigation
```

## 1. Form schema

```ts
// data/post-editor/post-editor.schema.ts
import {
  minLength,
  object,
  pipe,
  string,
} from "valibot"

export const PostFormSchema = object({
  title: pipe(
    string(),
    minLength(3, "Минимум 3 символа"),
  ),
  content: pipe(
    string(),
    minLength(20, "Минимум 20 символов"),
  ),
})
```

## 2. Form values

```ts
// data/post-editor/post-editor.types.ts
import type { InferInput } from "valibot"

import { PostFormSchema } from "./post-editor.schema"

export type PostFormValues = InferInput<typeof PostFormSchema>
```

Форма и server request не считаются одним контрактом только потому, что поля сейчас похожи.

## 3. Request mapper

Предположим, backend ожидает другое naming:

```ts
// data/post-editor/post-editor.mapper.ts
import type { PostFormValues } from "./post-editor.types"

interface ICreatePostRequest {
  post_title: string
  post_content: string
}

export const mapFormToCreatePostRequest = (
  values: PostFormValues,
): ICreatePostRequest => ({
  post_title: values.title,
  post_content: values.content,
})
```

## 4. API operation через facade

```ts
// data/post-editor/post-editor.api.ts
import { api } from "@/app/infrastructure/facade/axios"
import { object, parse, string } from "valibot"

import { mapFormToCreatePostRequest } from "./post-editor.mapper"
import type { PostFormValues } from "./post-editor.types"

const CreatePostResponseSchema = object({
  id: string(),
})

export const createPost = async (
  values: PostFormValues,
): Promise<string> => {
  const request = mapFormToCreatePostRequest(values)
  const response = await api.post("/posts", request)

  const dto = parse(
    CreatePostResponseSchema,
    response.data as unknown,
  )

  return dto.id
}
```

Request формируется в `data`, потому что это внешний контракт операции.

Response снова проходит runtime validation.

## 5. Store хранит состояние операции

```ts
// data/post-editor/post-editor.store.ts
import { makeAutoObservable, runInAction } from "mobx"

import { createPost } from "./post-editor.api"
import type { PostFormValues } from "./post-editor.types"

export class PostEditorStore {
  isSaving = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  async create(values: PostFormValues): Promise<string | null> {
    this.isSaving = true
    this.error = null

    try {
      return await createPost(values)
    } catch {
      runInAction(() => {
        this.error = "Не удалось сохранить пост"
      })

      return null
    } finally {
      runInAction(() => {
        this.isSaving = false
      })
    }
  }
}

export const postEditorStore = new PostEditorStore()
```

MobX не дублирует `title` и `content`. Этими полями владеет React Hook Form.

## 6. Public API

```ts
// data/post-editor/index.ts
import { PostFormSchema } from "./post-editor.schema"
import {
  PostEditorStore,
  postEditorStore,
} from "./post-editor.store"
import type { PostFormValues } from "./post-editor.types"

export {
  PostEditorStore,
  PostFormSchema,
  postEditorStore,
  type PostFormValues,
}
```

## 7. React Hook Form

```tsx
// components/post-editor/widgets/PostEditorForm/PostEditorForm.tsx
import { valibotResolver } from "@hookform/resolvers/valibot"
import { observer } from "mobx-react-lite"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"

import {
  PostFormSchema,
  postEditorStore,
  type PostFormValues,
} from "@/data/post-editor"

export const PostEditorForm = observer(() => {
  const navigate = useNavigate()

  const form = useForm<PostFormValues>({
    resolver: valibotResolver(PostFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const postId = await postEditorStore.create(values)

    if (postId) {
      navigate(`/posts/${postId}`)
    }
  })

  return (
    <form onSubmit={handleSubmit}>
      <input {...form.register("title")} />
      <textarea {...form.register("content")} />

      {postEditorStore.error && (
        <p>{postEditorStore.error}</p>
      )}

      <button
        type="submit"
        disabled={postEditorStore.isSaving}
      >
        Сохранить
      </button>
    </form>
  )
})

PostEditorForm.displayName = "PostEditorForm"
```

## Почему navigation остаётся в React

Store знает результат операции:

```txt
create(values) → postId
```

Но store не обязан знать, что после этого приложение открывает:

```txt
/posts/:postId
```

Route является UI/application concern, поэтому `navigate` остаётся в React-слое.

## Создание и редактирование

Один UI editor может работать с двумя operations:

```txt
create(values)
update(postId, values)
```

Но request DTO и endpoint operations могут отличаться.

Не объединяйте их только ради уменьшения числа файлов, если семантика разная.

## Где Core, а где Stack

**Core:**

- React Hook Form владеет полями;
- Valibot проверяет форму;
- MobX хранит отдельное scenario state;
- React Router выполняет navigation.

**Full Stack:**

- request отправляется через Axios facade;
- transport conventions задаются инфраструктурным слоем.

См. [Example project](/example/).
