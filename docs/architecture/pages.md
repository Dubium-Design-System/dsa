# Слой pages

`pages` — слой экранов приложения.

Обычно одна page соответствует одному route и собирает всё, что нужно показать пользователю на этом URL.

Например:

```txt
/posts               → PostsPage
/posts/:postId        → PostPage
/posts/:postId/edit   → EditPostPage
```

Page не должна превращаться в один файл на несколько сотен строк. Если экран состоит из нескольких самостоятельных частей, их можно разделять внутри самой page.

Для этого используются:

- `sections`;
- `steps`;
- `tabs`;
- `screens`.

Это **внутренняя структура конкретной page**, а не новые глобальные архитектурные слои.

---

## Базовая структура page

Небольшой экран может выглядеть просто:

```txt
pages/
  Post/
    Post.page.tsx
    index.ts
```

Если экран растёт:

```txt
pages/
  Post/
    Post.page.tsx

    sections/
      PostHeader/
        PostHeader.tsx
        index.tsx
      PostContent/
        PostContent.tsx
        index.tsx
      Comments/
        Comments.tsx
        index.tsx
      RelatedPosts/
        RelatedPosts.tsx
        index.tsx

    index.ts
```

Если часть нужна только этой page, сначала оставляйте её внутри page.

Не переносите каждый крупный JSX-блок в `components` только потому, что появился отдельный файл.

---

# Что делает page

Page может:

- читать route params через React Router;
- собирать компоненты экрана;
- определять порядок отображения блоков;
- переключать локальные `tabs`, `steps` и `screens`;
- определять page-level loading/error/empty состояния;
- лениво подключать части интерфейса, которые не нужны при первом отображении.

Page не должна:

- описывать DTO;
- хранить schema внешнего API;
- выполнять mapping DTO;
- реализовывать transport;
- содержать domain store только потому, что он используется на этой странице.

---

# Sections

`section` — крупная самостоятельная часть страницы.

Например, страница поста может состоять из:

```txt
PostPage
├── PostHeaderSection
├── PostContentSection
├── CommentsSection
└── RelatedPostsSection
```

Файловая структура:

```txt
pages/
  Post/
    Post.page.tsx

    sections/
      PostHeader/
        PostHeader.tsx
        index.tsx
      PostContent/
        PostContent.tsx
        index.tsx
      Comments/
        Comments.tsx
        index.tsx
      RelatedPosts/
        RelatedPosts.tsx
        index.tsx

    index.ts
```

## Когда использовать section

Используйте `section`, если блок:

- является заметной частью одного экрана;
- имеет собственную композицию;
- может содержать несколько компонентов;
- нужен только этой page;
- отображается вместе с другими частями страницы.

Например:

```tsx
import { useParams } from "react-router"

import { PostContentSection } from "./sections/PostContentSection"
import { PostHeaderSection } from "./sections/PostHeaderSection"

export const PostPage = () => {
  const { postId } = useParams()

  if (!postId) {
    return <p>Не указан идентификатор поста</p>
  }

  return (
    <main>
      <PostHeaderSection postId={postId} />
      <PostContentSection postId={postId} />
    </main>
  )
}

PostPage.displayName = "PostPage"
```

Здесь `PostHeaderSection` и `PostContentSection` являются частями одного экрана `/posts/:postId`.

---

## Когда section нужно вынести в components

Пока блок принадлежит только одной page:

```txt
pages/Post/sections/CommentsSection.tsx
```

это нормальное место.

Если тот же блок начинает использоваться в нескольких независимых pages:

```txt
PostPage
AuthorPage
ModerationPage
```

это сигнал проверить, не стал ли он самостоятельным UI-модулем.

Тогда его можно вынести, например, в:

```txt
components/
  comments/
    Comments.tsx
    index.ts
```

Правило простое:

> `section` отвечает за часть конкретной page.  
> `component` может жить независимо от конкретной page.

---

# LazyBoundary

В проекте не используйте `Suspense` напрямую в каждой page.

Для lazy-компонентов используется общий `LazyBoundary`:

```tsx
// shared/ui/LazyBoundary/LazyBoundary.tsx
import { Suspense, type ReactNode } from "react"

interface LazyBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

export const LazyBoundary = ({
  fallback,
  children,
}: LazyBoundaryProps) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

LazyBoundary.displayName = "LazyBoundary"
```

Public API:

```ts
// shared/ui/LazyBoundary/index.ts
export { LazyBoundary } from "./LazyBoundary"
```

Page и её внутренние модули используют только `LazyBoundary`:

```tsx
import { LazyBoundary } from "@/shared/ui"
```

Это даёт одно место, где можно централизованно изменить поведение lazy-boundary, fallback или обработку ошибок, не переписывая каждую page.

---

# Где объявлять `lazy`

`lazy()` не объявляется внутри файла page.

Каждый `section`, `tab`, `step` или `screen`, который должен загружаться лениво, экспортирует готовый lazy-компонент из собственного `index.tsx`.

Например:

```txt
src/
  pages/
    Home/
      Home.page.tsx

      sections/
        Hero/
          Hero.tsx
          index.tsx
```

Сам компонент:

```tsx
// src/pages/Home/sections/Hero/Hero.tsx
export const Hero = () => {
  return <section>...</section>
}

Hero.displayName = "Hero"
```

А lazy-export находится рядом с ним:

```tsx
// src/pages/Home/sections/Hero/index.tsx
import { lazy } from "react"

import { LazyBoundary } from "@/shared/ui"

export const HeroSection = lazy(() =>
  import("./Hero").then(({ Hero }) => ({
    default: Hero,
  })),
)

HeroSection.displayName = "HeroSection"
```

После этого page не знает, как именно загружается секция:

```tsx
import { HeroSection } from "./sections/Hero"
```

Это правило одинаково для:

```txt
sections/
tabs/
steps/
screens/
```

То есть page импортирует **готовый публичный модуль**, а решение о lazy-loading остаётся рядом с самим модулем.

---

# Lazy sections

Не каждую section нужно включать в первый JavaScript chunk страницы.

Если секция:

- тяжёлая;
- находится далеко ниже первого экрана;
- не нужна пользователю сразу;
- использует большой дополнительный UI или библиотеку;

её имеет смысл подключить через `lazy`.

Но здесь есть важное правило.

## `lazy()` не означает «загрузить при скролле»

Такой код:

```tsx
import { lazy } from "react"

import { LazyBoundary } from "@/shared/ui/LazyBoundary"

// src/pages/Post/sections/Comments/index.tsx
export const CommentsSection = lazy(() =>
  import("./Comments").then(({ Comments }) => ({
    default: Comments,
  })),
)

export const PostPage = () => {
  return (
    <main>
      <PostHeaderSection />
      <PostContentSection />

      <LazyBoundary fallback={<p>Загрузка комментариев...</p>}>
        <CommentsSection />
      </LazyBoundary>
    </main>
  )
}
```

разделит код на отдельный chunk, но React всё равно попытается отрендерить `CommentsSection` сразу.

Следовательно, загрузка chunk начнётся сразу при рендере page.

Если задача именно **не загружать section до приближения пользователя к ней**, нужен ещё условный render.

---

## Section ниже первого экрана

Например, комментарии находятся далеко после текста поста.

Можно сделать небольшой локальный hook:

```tsx
import {
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react"

export const useNearViewport = (): {
  ref: RefObject<HTMLDivElement | null>
  isVisible: boolean
} => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "300px",
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return {
    ref,
    isVisible,
  }
}
```

И использовать его на page:

```tsx
import { lazy } from "react"

import { LazyBoundary } from "@/shared/ui/LazyBoundary"
import { useParams } from "react-router"

import { useNearViewport } from "./hooks/useNearViewport"
import { PostContentSection } from "./sections/PostContentSection"
import { PostHeaderSection } from "./sections/PostHeaderSection"

// src/pages/Post/sections/Comments/index.tsx
export const CommentsSection = lazy(() =>
  import("./Comments").then(({ Comments }) => ({
    default: Comments,
  })),
)

export const PostPage = () => {
  const { postId } = useParams()
  const comments = useNearViewport()

  if (!postId) {
    return <p>Не указан идентификатор поста</p>
  }

  return (
    <main>
      <PostHeaderSection postId={postId} />
      <PostContentSection postId={postId} />

      <div ref={comments.ref}>
        {comments.isVisible ? (
          <LazyBoundary fallback={<p>Загрузка комментариев...</p>}>
            <CommentsSection postId={postId} />
          </LazyBoundary>
        ) : null}
      </div>
    </main>
  )
}

PostPage.displayName = "PostPage"
```

Теперь `CommentsSection` впервые рендерится только когда пользователь приближается к ней.

И только после этого React начинает загружать lazy chunk.

### Что загружать сразу

Если section находится в начале страницы:

```txt
PostHeaderSection
PostContentSection
```

обычный import часто лучше:

```tsx
import { PostContentSection } from "./sections/PostContentSection"
import { PostHeaderSection } from "./sections/PostHeaderSection"
```

Не нужно превращать каждый файл в lazy chunk.

Lazy loading должен улучшать загрузку страницы, а не создавать waterfall из десятков маленьких запросов.

---

# Steps

`step` — отдельный этап последовательного сценария.

Steps подходят, когда пользователь проходит процесс **по порядку**.

Например, создание публикации:

```txt
CreatePostPage
├── DetailsStep
├── ContentStep
└── PreviewStep
```

Структура:

```txt
pages/
  CreatePost/
    CreatePost.page.tsx

    steps/
      Details/
        Details.tsx
        index.tsx
      Content/
        Content.tsx
        index.tsx
      Preview/
        Preview.tsx
        index.tsx

    index.ts
```

Характерный признак `steps`:

> В конкретный момент пользователь работает только с текущим этапом и затем переходит к следующему или предыдущему.

---

## Lazy steps

Например, второй шаг экспортируется так:

```tsx
// src/pages/CreatePost/steps/Content/index.tsx
import { lazy } from "react"

export const ContentStep = lazy(() =>
  import("./Content").then(({ Content }) => ({
    default: Content,
  })),
)

ContentStep.displayName = "ContentStep"
```

А page просто импортирует его:

```tsx
import { ContentStep } from "./steps/Content"
```


Первый step нужен сразу, поэтому его можно импортировать обычно.

Следующие steps пользователь увидит только после действий на первом экране, поэтому их можно подключить через `lazy`.

```tsx
import { useState } from "react"

import { LazyBoundary } from "@/shared/ui"

import { DetailsStep } from "./steps/DetailsStep"

import { ContentStep } from "./steps/Content"
import { PreviewStep } from "./steps/Preview"

type Step = "details" | "content" | "preview"

export const CreatePostPage = () => {
  const [step, setStep] = useState<Step>("details")

  return (
    <main>
      {step === "details" ? (
        <DetailsStep
          onNext={() => {
            setStep("content")
          }}
        />
      ) : null}

      {step === "content" ? (
        <LazyBoundary fallback={<p>Загрузка редактора...</p>}>
          <ContentStep
            onBack={() => {
              setStep("details")
            }}
            onNext={() => {
              setStep("preview")
            }}
          />
        </LazyBoundary>
      ) : null}

      {step === "preview" ? (
        <LazyBoundary fallback={<p>Загрузка предпросмотра...</p>}>
          <PreviewStep
            onBack={() => {
              setStep("content")
            }}
          />
        </LazyBoundary>
      ) : null}
    </main>
  )
}

CreatePostPage.displayName = "CreatePostPage"
```

Здесь:

```txt
DetailsStep
```

попадает в основной chunk page.

А:

```txt
ContentStep
PreviewStep
```

загружаются только при первом переходе пользователя на соответствующий step.

---

# Tabs

`tab` — один из нескольких равноправных режимов внутри одной page.

Например, страница автора:

```txt
AuthorPage
├── PostsTab
├── CommentsTab
└── AboutTab
```

Tabs отличаются от steps тем, что пользователь не обязан проходить их по порядку.

Он может открыть:

```txt
Posts
→ About
→ Comments
→ Posts
```

Структура:

```txt
pages/
  Author/
    Author.page.tsx

    tabs/
      Posts/
        Posts.tsx
        index.tsx
      Comments/
        Comments.tsx
        index.tsx
      About/
        About.tsx
        index.tsx

    index.ts
```

---

## Lazy tabs

Например:

```tsx
// src/pages/Author/tabs/Comments/index.tsx
import { lazy } from "react"

export const CommentsTab = lazy(() =>
  import("./Comments").then(({ Comments }) => ({
    default: Comments,
  })),
)

CommentsTab.displayName = "CommentsTab"
```

Page импортирует:

```tsx
import { CommentsTab } from "./tabs/Comments"
```


Обычно default tab нужен сразу, а остальные можно загружать при первом открытии.

```tsx
import { useState } from "react"
import { LazyBoundary } from "@/shared/ui"
import { PostsTab } from "./tabs/PostsTab"
import { AboutTab } from "./tabs/About"
import { CommentsTab } from "./tabs/Comments"

type Tab = "posts" | "comments" | "about"

export const AuthorPage = () => {
  const [tab, setTab] = useState<Tab>("posts")

  return (
    <main>
      <nav>
        <button
          type="button"
          onClick={() => {
            setTab("posts")
          }}
        >
          Посты
        </button>

        <button
          type="button"
          onClick={() => {
            setTab("comments")
          }}
        >
          Комментарии
        </button>

        <button
          type="button"
          onClick={() => {
            setTab("about")
          }}
        >
          Об авторе
        </button>
      </nav>

      {tab === "posts" ? <PostsTab /> : null}

      {tab === "comments" ? (
        <LazyBoundary fallback={<p>Загрузка комментариев...</p>}>
          <CommentsTab />
        </LazyBoundary>
      ) : null}

      {tab === "about" ? (
        <LazyBoundary fallback={<p>Загрузка информации...</p>}>
          <AboutTab />
        </LazyBoundary>
      ) : null}
    </main>
  )
}

AuthorPage.displayName = "AuthorPage"
```

`CommentsTab` не загружается до первого переключения на `comments`.

`AboutTab` не загружается до первого переключения на `about`.

---

## Когда tab должен стать route

Не делайте локальный `tab`, если его состояние фактически является самостоятельной страницей.

Например, если пользователь должен иметь возможность открыть напрямую:

```txt
/authors/:authorId/posts
/authors/:authorId/comments
/authors/:authorId/about
```

то это уже повод рассмотреть вложенные routes.

Особенно если:

- URL должен сохранять выбранный раздел;
- нужна отдельная browser history;
- пользователь должен иметь возможность поделиться прямой ссылкой;
- каждый раздел фактически является самостоятельным экраном.

Не создавайте внутри page второй Router на `useState`, если состояние должно быть отражено в URL.

---

# Screens

`screen` — крупное взаимоисключающее состояние одной page.

В отличие от `section`, screens обычно **не отображаются одновременно**.

Например, редактор поста:

```txt
EditPostPage
├── EditorScreen
├── SuccessScreen
└── ConflictScreen
```

Структура:

```txt
pages/
  EditPost/
    EditPost.page.tsx

    screens/
      Editor/
        Editor.tsx
        index.tsx
      Success/
        Success.tsx
        index.tsx
      Conflict/
        Conflict.tsx
        index.tsx

    index.ts
```

Page определяет, какой screen сейчас нужно показать.

---

## Пример screens

Например:

```tsx
// src/pages/EditPost/screens/Success/index.tsx
import { lazy } from "react"

export const SuccessScreen = lazy(() =>
  import("./Success").then(({ Success }) => ({
    default: Success,
  })),
)

SuccessScreen.displayName = "SuccessScreen"
```

Page импортирует:

```tsx
import { SuccessScreen } from "./screens/Success"
```


```tsx
import { useState } from "react"

import { LazyBoundary } from "@/shared/ui/LazyBoundary"

import { EditorScreen } from "./screens/EditorScreen"

import { ConflictScreen } from "./screens/Conflict"
import { SuccessScreen } from "./screens/Success"

type Screen = "editor" | "success" | "conflict"

export const EditPostPage = () => {
  const [screen, setScreen] = useState<Screen>("editor")

  if (screen === "success") {
    return (
      <LazyBoundary fallback={<p>Загрузка...</p>}>
        <SuccessScreen />
      </LazyBoundary>
    )
  }

  if (screen === "conflict") {
    return (
      <LazyBoundary fallback={<p>Загрузка...</p>}>
        <ConflictScreen
          onBack={() => {
            setScreen("editor")
          }}
        />
      </LazyBoundary>
    )
  }

  return (
    <EditorScreen
      onConflict={() => {
        setScreen("conflict")
      }}
      onSuccess={() => {
        setScreen("success")
      }}
    />
  )
}

EditPostPage.displayName = "EditPostPage"
```

`EditorScreen` нужен сразу.

`SuccessScreen` пользователь увидит только после успешного действия.

`ConflictScreen` нужен только при отдельном состоянии.

Поэтому вторичные screens можно вынести в lazy chunks.

---

# Чем отличаются section, step, tab и screen

| Тип | Что означает | Одновременно видно несколько? | Есть порядок? | Обычно нужен отдельный URL? |
| --- | --- | --- | --- | --- |
| `section` | часть одного экрана | да | нет | нет |
| `step` | этап сценария | обычно нет | да | обычно нет |
| `tab` | переключаемый режим | нет | нет | зависит от требований |
| `screen` | крупное состояние page | нет | нет | обычно нет |

Простой способ выбрать:

```txt
Это часть страницы, которая видна вместе с другими?
→ section

Пользователь проходит этапы последовательно?
→ step

Пользователь переключается между равноправными режимами?
→ tab

Почти вся page заменяется из-за состояния сценария?
→ screen
```

---

# Когда использовать lazy

Не используйте `lazy` только потому, что компонент лежит в:

```txt
sections/
steps/
tabs/
screens/
```

Решение зависит не от имени папки, а от момента, когда код нужен пользователю.

## Загружайте сразу

Обычно обычный import подходит для:

- header первого экрана;
- основного содержимого page;
- default tab;
- первого step;
- основного screen;
- небольших компонентов.

Пример:

```tsx
import { PostHeaderSection } from "./sections/PostHeaderSection"
import { PostsTab } from "./tabs/PostsTab"
```

## Используйте lazy

Lazy особенно полезен для:

- тяжёлой section ниже первого экрана;
- второго и последующих steps;
- неактивных tabs;
- редких alternative screens;
- редакторов;
- больших preview;
- сложных таблиц;
- тяжёлых визуальных блоков.

Пример:

```tsx
// src/pages/Post/sections/Comments/index.tsx
export const PreviewStep = lazy(
  () => import("./steps/PreviewStep"),
)

export const CommentsTab = lazy(
  () => import("./tabs/CommentsTab"),
)

export const ConflictScreen = lazy(
  () => import("./screens/ConflictScreen"),
)
```

---

# Lazy и данные — разные вещи

Code splitting и загрузка данных решают разные задачи.

```txt
lazy()
```

откладывает загрузку JavaScript-модуля.

Это не означает, что данные автоматически должны загружаться тем же способом.

Например, page может загрузить данные поста сразу:

```txt
PostPage
→ PostsStore
→ post
```

а тяжёлый UI комментариев подключить позже:

```txt
CommentsSection
→ lazy chunk
```

И наоборот: иногда section уже загружена как код, но запрос данных начинается только после её появления.

Не смешивайте эти две задачи в одно понятие «lazy loading».

---

# Page не должна становиться вторым приложением

Локальные папки помогают разложить большой экран:

```txt
pages/
  Post/
    sections/
    tabs/
    screens/
```

но это не означает, что внутри каждой page нужно строить собственную архитектуру со всеми глобальными слоями.

Плохо:

```txt
pages/
  Post/
    app/
    data/
    pages/
    shared/
```

Page — всё ещё composition layer экрана.

Если внутренняя часть стала самостоятельным большим модулем и используется в нескольких местах, скорее всего, ей уже не место внутри `pages`.

---

# Когда нужна отдельная page

Если часть интерфейса получает самостоятельный URL:

```txt
/posts/:postId/history
```

это сильный сигнал, что перед нами отдельная page:

```txt
pages/
  PostHistory/
    PostHistory.page.tsx
```

а не:

```txt
pages/
  Post/
    tabs/
      HistoryTab.tsx
```

Особенно если URL:

- открывается напрямую;
- должен сохраняться после reload;
- участвует в browser history;
- используется в ссылках;
- имеет собственные route params;
- имеет самостоятельный lifecycle экрана.

---

# Пример большой страницы поста

Итоговая структура может выглядеть так:

```txt
pages/
  Post/
    Post.page.tsx

    sections/
      PostHeader/
        PostHeader.tsx
        index.tsx

      PostContent/
        PostContent.tsx
        index.tsx

      Comments/
        Comments.tsx
        index.tsx

      RelatedPosts/
        RelatedPosts.tsx
        index.tsx

    tabs/
      PostHistoryTab/
        PostHistoryTab.tsx
        index.tsx

    screens/
      PostScreen/
        PostScreen.tsx
        index.tsx

      DeletedPostScreen/
        DeletedPostScreen.tsx
        index.tsx

    index.ts
```

Но не создавайте все эти папки заранее.

Начинайте с:

```txt
pages/
  Post/
    Post.page.tsx
    index.ts
```

И добавляйте `sections`, `steps`, `tabs` или `screens` только когда page действительно становится сложнее.

---

# Правила

1. Page соответствует самостоятельному экрану приложения.
2. `section` — крупная часть одной page.
3. `step` — последовательный этап сценария.
4. `tab` — равноправный переключаемый режим.
5. `screen` — взаимоисключающее крупное состояние page.
6. Первый видимый контент не нужно без причины делать lazy.
7. Вторичные тяжёлые `sections`, `steps`, `tabs` и `screens` можно загружать через `lazy`.
8. `lazy()` объявляется в `index.tsx` самого `section / step / tab / screen`, а не внутри page.
9. Page использует `LazyBoundary`, а не `Suspense` напрямую.
10. `lazy()` загружает модуль при первом render, а не при скролле.
11. Для загрузки section при приближении к viewport нужен conditional render.
12. Если часть получает самостоятельный URL, рассмотрите отдельную page вместо локального tab/screen.
13. Если локальный блок начинает использоваться в нескольких pages, рассмотрите перенос в `components`.
14. Не создавайте `sections/steps/tabs/screens` заранее без реальной необходимости.