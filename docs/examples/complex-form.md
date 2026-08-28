# Пример: редактор поста

Форма поста показывает границу между React Hook Form, Valibot и MobX.

## Ответственность

React Hook Form владеет:

- текущими значениями полей;
- touched/dirty;
- ошибками полей;
- submit lifecycle формы.

MobX store владеет состоянием сценария, которое не является состоянием конкретного input.

Например:

- сохраняется ли пост;
- какой post был сохранён;
- общая ошибка сохранения.

## Schema формы

```ts
// data/post-editor/post-form.schema.ts
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

## Store сценария

```ts
// data/post-editor/post-editor.store.ts
import { makeAutoObservable } from "mobx"

export class PostEditorStore {
  isSaving = false
  savedPostId: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  startSaving(): void {
    this.isSaving = true
  }

  finishSaving(postId: string): void {
    this.isSaving = false
    this.savedPostId = postId
  }

  reset(): void {
    this.isSaving = false
    this.savedPostId = null
  }
}
```

В этом store нет копии `title` и `body`: ими уже владеет React Hook Form.

## React Hook Form + Valibot

```tsx
import { valibotResolver } from "@hookform/resolvers/valibot"
import { useForm } from "react-hook-form"

import {
  PostFormSchema,
  type PostFormValues,
} from "@/data/post-editor"

export const PostEditorForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: valibotResolver(PostFormSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  })

  const submit = (values: PostFormValues) => {
    // Передайте проверенные значения владельцу сценария сохранения.
  }

  return (
    <form onSubmit={handleSubmit(submit)}>
      <label>
        Заголовок
        <input {...register("title")} />
      </label>
      {errors.title && <p>{errors.title.message}</p>}

      <label>
        Текст
        <textarea {...register("body")} />
      </label>
      {errors.body && <p>{errors.body.message}</p>}

      <button type="submit">Сохранить</button>
    </form>
  )
}

PostEditorForm.displayName = "PostEditorForm"
```

## Когда нужен `Controller`

Используйте `Controller`, если UI-компонент не работает как обычный uncontrolled input и требует явного `value/onChange`.

Для обычного `<input>` предпочтительнее `register`.

## Когда нужен `FormProvider`

Если форма разбита на глубокие внутренние секции, можно передать methods через `FormProvider`, а в дочерних блоках использовать `useFormContext`.

Не используйте provider для маленькой формы только ради единообразия.

## Главное правило

Не создавайте два источника истины для одних полей.

```txt
поля формы → React Hook Form
сценарное состояние → MobX
проверка формы → Valibot
```
