# Пример: навигация блога

Header — пример компонента, которому нужен React Router, но не нужен MobX store.

## Компонент

```tsx
import { Link } from "react-router"

export const BlogHeader = () => (
  <header>
    <nav>
      <Link to="/posts">Посты</Link>
      <Link to="/posts/new">Новый пост</Link>
    </nav>
  </header>
)

BlogHeader.displayName = "BlogHeader"
```

## Где размещать

Если header используется как часть приложения:

```txt
components/header/
  BlogHeader.tsx
  index.ts
```

Router layout может импортировать его:

```tsx
import { Outlet } from "react-router"

import { BlogHeader } from "@/components/header"

export const MainLayout = () => (
  <>
    <BlogHeader />
    <Outlet />
  </>
)

MainLayout.displayName = "MainLayout"
```

## Почему здесь нет store

Не добавляйте MobX только потому, что компонент «важный». Если header только создаёт ссылки, React Router уже решает его задачу.
