# Example project

Example project нужен для одной вещи: показать DSA **целиком**, когда коротких фрагментов документации уже недостаточно.

В документации примеры остаются небольшими и объясняют одно правило. В example-проекте те же части соединяются в законченное приложение.

## Проект

**[Открыть DSA Example Project](https://example.com/dsa-example)**

::: warning URL для тестовой сборки
Сейчас используется placeholder `https://example.com/dsa-example`, потому что реальный URL репозитория не был передан при сборке документации.

Перед публикацией замените эту ссылку на реальный GitHub/GitLab repository или demo URL.
:::

## Что должно быть в example

Учебный проект — небольшой блог:

```txt
/posts
/posts/:postId
/posts/create
/posts/:postId/edit
```

Основные сценарии:

- список постов;
- просмотр отдельного поста;
- загрузка автора;
- загрузка комментариев;
- создание поста;
- редактирование поста;
- валидация формы;
- navigation после сохранения;
- loading и error state;
- пример HTTP boundary;
- пример полного стека.

## Как связывать документацию и проект

Документация должна объяснять правило коротко:

```ts
const dto = parse(PostResponseSchema, input)
```

А рядом можно давать ссылку:

> Полная реализация: `src/data/posts`.

Не нужно копировать в документацию весь store, API и UI только для того, чтобы показать их соединение.

## Рекомендуемая структура example

```txt
src/
  app/
  pages/
  components/
  data/
    posts/
    authors/
    comments/
    post-editor/
  shared/
```

Если example реализует Full Stack Guide, в нём также будут:

```txt
app/infrastructure/facade/axios
app/infrastructure/adapter
shared/lib
*.module.scss
```

## Что example не должен делать

Example не должен становиться второй документацией.

Не стоит:

- добавлять туда десятки необязательных feature;
- показывать несколько разных архитектурных способов решения одной задачи;
- использовать другой домен, чем в документации;
- оставлять «магический» код без ссылки на объясняющее правило;
- превращать проект в production boilerplate со всем возможным tooling.

Лучше маленький, но последовательный проект, который можно прочитать сверху вниз.

## Рекомендуемый порядок изучения

1. [Введение в DSA Core](/guide/introduction)
2. [Быстрый старт](/guide/getting-started)
3. [Full Stack Guide](/full-stack/)
4. Example project
5. [Куда класть код](/practices/code-placement) как справочник при самостоятельной задаче
