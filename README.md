# DSA

Документация Data-First Slice Architecture разделена на три части:

1. **DSA Core** — архитектурные правила, которые не зависят от полного проектного стека.
2. **Full Stack Guide** — конкретная реализация DSA на принятом стеке.
3. **Example project** — эталонный блог, где правила и стек собраны вместе.

## DSA Core

Core говорит только о:

- React;
- React Router;
- MobX;
- mobx-react-lite;
- React Hook Form;
- Valibot;
- @hookform/resolvers.

HTTP-клиент, стили, работа с датами и транспортные механизмы не считаются частью Core.

## Full Stack Guide

Stack Guide добавляет проектные соглашения вокруг:

- Axios;
- dayjs;
- clsx;
- Sass / CSS Modules;
- application adapters;
- HTTP facade;
- EventBus / WebSocket-подобных transport mechanisms;
- application Error Boundary.

Важно: это **реализация DSA в конкретном стеке**, а не обязательные правила самой архитектуры.

## Example project

Во всей документации используется один домен блога:

- posts;
- authors;
- comments;
- post editor.

Страница `Example project` связывает документацию с отдельным проектом-примером.

> В этой тестовой сборке внешний URL example-проекта задан как placeholder:
> `https://example.com/dsa-example`.
> Перед публикацией замените его на реальный URL репозитория или demo.

## Запуск документации

Документация работает на VitePress, который использует Vite как dev-сервер и
production-сборщик.

```bash
npm install
npm run dev
```

## Production-сборка

```bash
npm run build
```

Исходные страницы находятся в `docs/`.

## Релизы и GitHub Pages

Workflow `.github/workflows/release-docs.yml` запускается при изменении
`package.json` в ветке `main` и:

1. проверяет формат `version`;
2. собирает документацию через Vite;
3. создаёт тег `v<version>` и GitHub Release с архивом сборки;
4. публикует эту же сборку в GitHub Pages.

Перед первым релизом выберите в репозитории **Settings → Pages → Source →
GitHub Actions**. Токен workflow должен иметь право `contents: write`; если
политика репозитория запрещает его, включите **Settings → Actions → General →
Workflow permissions → Read and write permissions**.

Для следующего релиза обновите версию без локального Git-тега:

```bash
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "release: v$(node -p "require('./package.json').version")"
git push origin main
```

Workflow сам создаст тег и release. Повторно использовать уже выпущенную
версию нельзя: сборка завершится ошибкой с просьбой увеличить `version`.

Для обычного project site base path вычисляется из имени репозитория. Для
custom domain его можно переопределить переменной репозитория `DOCS_BASE`
(например, значением `/`). Значение должно начинаться и заканчиваться `/`.
