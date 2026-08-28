import { defineConfig } from "vitepress"

export default defineConfig({
  base: process.env.DOCS_BASE || "/",
  lang: "ru-RU",
  title: "Data-First Slice Architecture",
  titleTemplate: ":title — DSA",
  description:
    "DSA Core, Full Stack Guide и example-проект для React-приложений",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    siteTitle: "DSA",
    search: { provider: "local" },
    outline: { level: [2, 3], label: "На странице" },
    lastUpdated: { text: "Обновлено" },
    docFooter: { prev: "Предыдущая", next: "Следующая" },
    nav: [
      { text: "DSA Core", link: "/guide/introduction" },
      { text: "Full Stack", link: "/full-stack/" },
      { text: "Example", link: "/example/" },
      { text: "Куда класть код", link: "/practices/code-placement" },
    ],
    sidebar: [
      {
        text: "DSA Core · Начало",
        items: [
          { text: "Введение", link: "/guide/introduction" },
          { text: "Scope Core", link: "/guide/stack" },
          { text: "Быстрый старт", link: "/guide/getting-started" },
          { text: "Принципы", link: "/guide/principles" },
          { text: "Работа над задачей", link: "/guide/workflow" },
          { text: "Термины", link: "/guide/glossary" },
        ],
      },
      {
        text: "DSA Core · Архитектура",
        items: [
          { text: "Обзор слоёв", link: "/architecture/overview" },
          { text: "Зависимости", link: "/architecture/dependencies" },
          { text: "App", link: "/architecture/app" },
          { text: "React Router", link: "/architecture/routing" },
          { text: "Pages", link: "/architecture/pages" },
          { text: "Components", link: "/architecture/components" },
          { text: "Shared", link: "/architecture/shared" },
          { text: "Providers", link: "/architecture/providers" },
        ],
      },
      {
        text: "DSA Core · Data",
        items: [
          { text: "Назначение", link: "/data/data-layer" },
          { text: "Выбор структуры", link: "/data/structure" },
          { text: "Контракты и Valibot", link: "/data/contracts-validation" },
          { text: "MobX stores", link: "/data/mobx-stores" },
          { text: "View models", link: "/data/view-models" },
          { text: "Композиция data-slices", link: "/data/composite-slices" },
          { text: "Public API", link: "/data/public-api" },
        ],
      },
      {
        text: "DSA Core · Примеры блога",
        items: [
          {
            text: "unknown → Valibot → Post",
            link: "/examples/validated-request",
          },
          {
            text: "Редактор поста",
            link: "/examples/complex-form",
          },
          {
            text: "Создание и редактирование",
            link: "/examples/post-create-edit",
          },
          {
            text: "Маршруты блога",
            link: "/examples/blog-routing",
          },
          {
            text: "Навигация блога",
            link: "/examples/blog-navigation",
          },
        ],
      },
      {
        text: "Full Stack Guide",
        items: [
          { text: "Обзор", link: "/full-stack/" },
          { text: "Зависимости", link: "/full-stack/dependencies" },
          { text: "Axios и HTTP facade", link: "/full-stack/http-axios" },
          { text: "Application infrastructure", link: "/full-stack/infrastructure" },
          { text: "Сценарий: список постов", link: "/full-stack/posts-flow" },
          { text: "Сценарий: редактор поста", link: "/full-stack/post-editor" },
          { text: "Даты и dayjs", link: "/full-stack/dates" },
          { text: "Sass Modules и clsx", link: "/full-stack/styling" },
          { text: "Полная структура блога", link: "/full-stack/project-structure" },
          { text: "Чек-лист полного стека", link: "/full-stack/checklist" },
        ],
      },
      {
        text: "Практика и справочник",
        items: [
          { text: "Куда класть код", link: "/practices/code-placement" },
          { text: "Антипаттерны", link: "/practices/anti-patterns" },
          { text: "Проверка контрактов", link: "/practices/testing" },
          { text: "Масштабирование stores", link: "/practices/store-scaling" },
          { text: "Миграция", link: "/practices/migration" },
          { text: "Чек-листы", link: "/reference/checklists" },
          { text: "Структура Core-примера", link: "/reference/file-structure" },
          { text: "FAQ", link: "/reference/faq" },
        ],
      },
      {
        text: "Example project",
        items: [
          { text: "О проекте и ссылка", link: "/example/" },
        ],
      },
    ],
  },
})
