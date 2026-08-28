# Providers рядом с владельцем

React Context нужен не каждому store. Используйте provider, когда экземпляр должен иметь локальный lifecycle или передаваться глубоко без ручной передачи props.

## Пример: редактор поста

Редактор страницы может владеть локальным MobX store:

```tsx
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react"

import { PostEditorStore, type IPostEditorStore } from "@/data/post-editor"

const PostEditorContext = createContext<IPostEditorStore | null>(null)

export const PostEditorProvider = ({ children }: PropsWithChildren) => {
  const store = useMemo(() => new PostEditorStore(), [])

  return (
    <PostEditorContext.Provider value={store}>
      {children}
    </PostEditorContext.Provider>
  )
}

PostEditorProvider.displayName = "PostEditorProvider"

export const usePostEditorStore = (): IPostEditorStore => {
  const store = useContext(PostEditorContext)

  if (!store) {
    throw new Error("PostEditorProvider is missing")
  }

  return store
}
```

## Куда класть provider

Если provider нужен только `EditPostPage`, размещайте его рядом с этой page или smart-модулем редактора.

Не поднимайте provider в `app` «на всякий случай».

## Когда provider не нужен

Если `postsStore` один на всё приложение и его public instance можно импортировать напрямую, Context может только усложнить код.

Выбирайте provider по lifecycle, а не по привычке.
