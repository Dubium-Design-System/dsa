# DSA

**Data-First Slice Architecture** — документация по организации frontend-приложений и набор практических примеров.

Репозиторий содержит:

- документацию DSA в `docs/`;
- full stack guide с проектными соглашениями;
- example-проекты в `examples/`;
- GitHub Actions workflow для сборки, релиза и публикации документации.

Документация: https://dubium-design-system.github.io/dsa/

Примеры: https://github.com/Dubium-Design-System/dsa/tree/main/examples

## Структура репозитория

```text
dsa/
├── .github/
│   └── workflows/
│       └── release-docs.yml
├── docs/
│   ├── .vitepress/
│   ├── architecture/
│   ├── data/
│   ├── example/
│   ├── examples/
│   ├── full-stack/
│   ├── guide/
│   ├── practices/
│   ├── reference/
│   └── index.md
├── examples/
│   └── ...
├── package.json
├── package-lock.json
└── README.md
```

`docs/` содержит исходники документации.

`examples/` предназначен для отдельных проектов, которые показывают применение DSA на практике.

Не путайте `docs/examples/` и `examples/`:

- `docs/examples/` — страницы документации с небольшими примерами кода;
- `examples/` — полноценные проекты в репозитории.

## Требования

Для документации нужен Node.js `>= 18`.

Для максимального совпадения с CI рекомендуется использовать Node.js 24.

Проверить версии:

```bash
node --version
npm --version
```

## Клонирование репозитория

```bash
git clone https://github.com/Dubium-Design-System/dsa.git
cd dsa
npm ci
```

Используйте `npm ci`, если `package-lock.json` уже существует и зависимости не меняются.

Если вы намеренно добавляете или обновляете зависимости, используйте `npm install`, после чего обязательно проверьте изменения в `package.json` и `package-lock.json`.

---

# Работа с документацией

## Локальный запуск

Запустите VitePress:

```bash
npm run docs:dev
```

Также доступна короткая команда:

```bash
npm run dev
```

После запуска VitePress покажет локальный адрес документации в терминале.

## Production-сборка

Перед push документации обязательно проверьте production-сборку:

```bash
npm run docs:build
```

или:

```bash
npm run build
```

Собранные файлы появятся в:

```text
docs/.vitepress/dist/
```

`dist` является результатом сборки. Не редактируйте его вручную.

Для проверки production-сборки локально:

```bash
npm run docs:preview
```

## Как изменить существующую страницу

Создайте отдельную ветку:

```bash
git switch main
git pull
git switch -c docs/update-pages
```

Измените нужные Markdown-файлы в `docs/`.

После изменений проверьте документацию:

```bash
npm run docs:build
npm run docs:preview
```

Затем посмотрите diff:

```bash
git status
git diff
```

Добавьте изменения и создайте commit:

```bash
git add docs
git commit -m "docs: update pages documentation"
```

Отправьте ветку в GitHub:

```bash
git push -u origin docs/update-pages
```

После этого создайте Pull Request в `main`.

## Как добавить новую страницу

Создайте Markdown-файл в подходящем разделе:

```text
docs/
  architecture/
  data/
  full-stack/
  guide/
  practices/
  reference/
```

Например:

```text
docs/architecture/providers.md
```

Если страница должна отображаться в sidebar, добавьте её в:

```text
docs/.vitepress/config.ts
```

После этого обязательно проверьте:

- страницу можно открыть из sidebar;
- внутренние ссылки работают;
- нет ссылок на удалённые страницы;
- code blocks корректно закрыты;
- примеры соответствуют принятым правилам DSA;
- `npm run docs:build` завершается без ошибок.

## Как удалить страницу

При удалении Markdown-файла недостаточно удалить только сам файл.

Нужно также:

1. удалить страницу из `docs/.vitepress/config.ts`;
2. найти ссылки на неё в остальных Markdown-файлах;
3. удалить или заменить эти ссылки;
4. выполнить production-сборку.

Для поиска можно использовать:

```bash
grep -R "/reference/example" docs
```

После удаления:

```bash
npm run docs:build
```

## Что проверить перед push документации

```bash
git status
git diff
npm run docs:build
```

Проверьте, что в commit не попали:

```text
node_modules/
docs/.vitepress/dist/
.env
.DS_Store
```

---

# Работа с example-проектами

Полноценные примеры DSA располагаются в корневой директории:

```text
examples/
```

Каждый пример должен быть самостоятельным и понятным без чтения исходников других example-проектов.

Рекомендуемая структура:

```text
examples/
  blog/
    src/
    package.json
    README.md
    ...
```

## Что должен показывать example-проект

Example нужен не для демонстрации максимального количества библиотек.

Он должен показывать конкретные правила DSA в работающем приложении:

- структуру `app`, `pages`, `components`, `data`, `shared`;
- направление зависимостей;
- public API модулей;
- работу MobX stores;
- React Router;
- формы;
- validation и mapper;
- реальные сценарии взаимодействия между слоями.

Если example использует дополнительные технологии, которые не входят в DSA Core, это должно быть явно указано в README самого example-проекта.

## Как добавить новый example

Начните с актуального `main`:

```bash
git switch main
git pull
git switch -c example/add-blog
```

Создайте директорию проекта:

```text
examples/blog/
```

Добавьте в неё код и собственный `README.md`.

README example-проекта должен как минимум объяснять:

- что показывает пример;
- какой стек используется;
- как установить зависимости;
- как запустить проект;
- какие разделы DSA он демонстрирует.

Перед commit запустите проверки, предусмотренные самим example-проектом.

Не добавляйте в Git:

```text
node_modules/
dist/
.env
```

Если проекту нужны переменные окружения, добавьте безопасный шаблон:

```text
.env.example
```

без реальных токенов, паролей и приватных значений.

После проверки:

```bash
git status
git diff
git add examples/blog
git commit -m "example: add blog project"
git push -u origin example/add-blog
```

После этого создайте Pull Request в `main`.

## Если example связан с документацией

Если вместе с новым example нужно добавить ссылки или пояснения в документацию, включите изменения `docs/` в тот же Pull Request:

```bash
git add examples/blog docs
git commit -m "example: add blog project and documentation"
```

Ссылка на каталог с example-проектами:

https://github.com/Dubium-Design-System/dsa/tree/main/examples

---

# Обычный push и публикация документации

Важно различать две операции:

1. **push кода в репозиторий**;
2. **публикацию новой версии документации на GitHub Pages**.

Обычные изменения можно отправить через feature branch и Pull Request без изменения версии.

Например:

```bash
git switch -c docs/update-routing
# изменения
git add docs
git commit -m "docs: update routing guide"
git push -u origin docs/update-routing
```

После merge изменения окажутся в `main`, но release workflow документации не запускается только из-за изменения Markdown-файлов.

---

# Релиз документации

Публикацией документации занимается:

```text
.github/workflows/release-docs.yml
```

Workflow запускается автоматически при push в `main`, если изменился:

```text
package.json
```

Изменение версии в `package.json` является сигналом к новому релизу.

Workflow:

1. проверяет версию;
2. устанавливает зависимости через `npm ci`;
3. собирает VitePress;
4. создаёт Git tag `v<version>`;
5. создаёт GitHub Release;
6. прикладывает архив собранной документации;
7. публикует эту же сборку на GitHub Pages.

## Подготовка релиза

Сначала убедитесь, что все нужные изменения уже находятся в ветке, из которой будет создан релиз.

Проверьте сборку:

```bash
npm ci
npm run build
```

Затем увеличьте версию.

Для patch-релиза:

```bash
npm version patch --no-git-tag-version
```

Для minor-релиза:

```bash
npm version minor --no-git-tag-version
```

Для major-релиза:

```bash
npm version major --no-git-tag-version
```

Команда обновит:

```text
package.json
package-lock.json
```

Локальный Git tag создавать не нужно. Его создаст GitHub Actions.

Проверьте изменения:

```bash
git diff
```

Создайте commit:

```bash
git add package.json package-lock.json
git commit -m "release: v$(node -p "require('./package.json').version")"
```

После попадания этого commit в `main` workflow автоматически запустит release.

Если вы работаете напрямую с `main`:

```bash
git push origin main
```

Если изменения проходят через Pull Request, отправьте release-ветку и после проверки объедините её в `main`.

## Повторный релиз той же версии

Не используйте уже опубликованную версию повторно.

Например, если существует:

```text
v0.2.0
```

следующий release должен иметь новую версию:

```text
v0.2.1
```

или выше.

Workflow проверяет существующие Git tags и остановит релиз, если версия конфликтует с уже созданным тегом.

---

# GitHub Pages

Документация публикуется через GitHub Actions.

Для project repository базовый путь обычно определяется автоматически из имени репозитория:

```text
/dsa/
```

Если документация публикуется на custom domain или нужен другой base path, используется repository variable:

```text
DOCS_BASE
```

Значение должно начинаться и заканчиваться `/`.

Например:

```text
/
```

или:

```text
/dsa/
```

Для первой настройки GitHub Pages проверьте:

```text
Settings
→ Pages
→ Source
→ GitHub Actions
```

Workflow также должен иметь право создавать Git tags и GitHub Releases.

---

# Рекомендуемый Git flow

Для обычных изменений не работайте напрямую в `main`.

Используйте отдельную ветку:

```text
main
  └── docs/...
  └── example/...
  └── fix/...
```

Примеры названий:

```text
docs/update-routing
docs/add-providers
example/add-blog
fix/broken-docs-link
```

Примеры commit messages:

```text
docs: update pages documentation
docs: add provider guide
example: add blog project
fix: remove broken documentation link
release: v0.2.0
```

Обычный процесс:

```text
main
→ новая ветка
→ изменения
→ локальная проверка
→ commit
→ push
→ Pull Request
→ review
→ merge в main
```

Для публикации новой версии документации после готовых изменений:

```text
main
→ bump version
→ release commit
→ push / merge в main
→ GitHub Actions
→ Git tag
→ GitHub Release
→ GitHub Pages
```

---

# Короткая памятка

## Изменил документацию

```bash
npm ci
npm run docs:build

git switch -c docs/my-change
git add docs
git commit -m "docs: describe change"
git push -u origin docs/my-change
```

Создайте Pull Request.

## Добавил example-проект

```bash
git switch -c example/my-example
git add examples/my-example
git commit -m "example: add my example"
git push -u origin example/my-example
```

Создайте Pull Request.

## Хочу опубликовать новую версию документации

После того как нужные изменения готовы к релизу:

```bash
npm ci
npm run build
npm version patch --no-git-tag-version

git add package.json package-lock.json
git commit -m "release: v$(node -p "require('./package.json').version")"
git push origin main
```

После push в `main` дальнейшую сборку, Git tag, GitHub Release и публикацию GitHub Pages выполняет GitHub Actions.
