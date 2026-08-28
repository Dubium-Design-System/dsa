# Sass Modules и clsx

DSA Core не задаёт способ стилизации. В полном стеке компоненты используют Sass Modules, а условные class names собираются через `clsx`.

## Файлы компонента

```txt
components/posts/ui/PostCard/
  PostCard.tsx
  PostCard.module.scss
  index.ts
```

## Sass Module

```scss
/* PostCard.module.scss */
.root {
  display: grid;
  gap: 8px;
}

.compact {
  gap: 4px;
}

.title {
  font-weight: 600;
}
```

## clsx

```tsx
// PostCard.tsx
import clsx from "clsx"

import styles from "./PostCard.module.scss"

interface IPostCardProps {
  title: string
  compact?: boolean
}

export const PostCard = ({
  title,
  compact = false,
}: IPostCardProps) => (
  <article className={clsx(styles.root, compact && styles.compact)}>
    <h2 className={styles.title}>{title}</h2>
  </article>
)

PostCard.displayName = "PostCard"
```

`clsx` нужен для class names. Он не должен становиться местом бизнес-условий.

Плохо:

```tsx
className={clsx(
  styles.root,
  post.author.role === "admin" && post.status === "draft" && styles.special,
)}
```

Если условие имеет бизнес-смысл, лучше вычислить понятное значение раньше:

```tsx
const canHighlightDraft = postView.canHighlightDraft

return (
  <article
    className={clsx(
      styles.root,
      canHighlightDraft && styles.highlighted,
    )}
  />
)
```

## Где хранить стили

Стили живут рядом с компонентом, которому принадлежат.

```txt
pages/Posts/Posts.page.tsx
pages/Posts/Posts.module.scss

components/posts/ui/PostCard/PostCard.tsx
components/posts/ui/PostCard/PostCard.module.scss
```

Не создавайте глобальную папку со стилями конкретных product-компонентов.

## Shared UI

Универсальные primitives могут жить в `shared/ui`:

```txt
shared/ui/Button/
  Button.tsx
  Button.module.scss
```

Но `PostCard` не становится `shared` только потому, что переиспользуется на нескольких страницах.

## Что остаётся архитектурным правилом

Sass и clsx можно заменить, не меняя правило владения:

```txt
универсальный UI primitive → shared/ui
product UI → components
page-specific UI → pages/<Page>
```

Поэтому эта страница относится к Stack Guide, а не к Core.
