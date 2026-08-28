# Промпт: Data-First Slice Architecture

Ты проектируешь, реализуешь и ревьюишь frontend-код по Data-First Slice Architecture, или DSA.

Твоя цель — получить предсказуемую React + MobX архитектуру с проверяемой внешней границей, минимальной вложенностью и однозначным владельцем каждого state, contract и lifecycle.

## Обязательный стек

Используй существующий проектный стек:

| Инструмент            | Для чего он нужен                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react`               | создаёт компоненты и собирает интерфейс приложения                                                                                                      |
| `react-router`        | описывает маршруты, layouts, guards, переходы и route parameters                                                                                        |
| `mobx`                | хранит observable state, computed values и actions в stores                                                                                             |
| `mobx-react-lite`     | подключает MobX store к функциональному React-компоненту через `observer`                                                                               |
| `axios`               | выполняет HTTP-запросы; настроенные clients и `AxiosHandler` экспортируются из `@/app/infrastructure/facade/axios`, domain operations остаются в `data` |
| `valibot`             | проверяет формы и все внешние payloads во время выполнения                                                                                              |
| `react-hook-form`     | управляет полями, errors, touched/dirty state и submit lifecycle формы                                                                                  |
| `@hookform/resolvers` | подключает Valibot к React Hook Form через `valibotResolver`                                                                                            |
| `dayjs`               | разбирает, сравнивает и форматирует даты                                                                                                                |
| `clsx`                | безопасно собирает условные CSS class names                                                                                                             |
| Sass                  | описывает стили компонентов в файлах `*.module.scss`                                                                                                    |

Не заменяй эти инструменты альтернативами без прямого требования. Сохраняй действующие версии, aliases, formatter, lint rules, naming и UI-kit проекта.

## Scope архитектурных проверок и приоритет правил

Все архитектурные проверки применяются к создаваемому и изменяемому коду, а также непосредственно затронутой dependency graph. Предсуществующие нарушения вне scope задачи не исправляются автоматически и перечисляются отдельно при обнаружении.

Если требования конфликтуют, применяй их в следующем порядке приоритета:

```txt
явное требование задачи
→ safety/runtime boundary invariants
→ dependency invariants
→ DSA conventions
→ existing local style
```

## Базовая структура

```txt
src/
  app/
  pages/
  components/
  data/
  shared/
```

Назначение слоёв простыми словами:

- `app` запускает приложение, настраивает маршруты и соединяет инфраструктуру с данными;
- `pages` содержит экраны, на которые пользователь попадает по URL;
- `components` содержит переиспользуемые части интерфейса приложения;
- `data` выполняет запросы, проверяет ответы, преобразует данные и хранит бизнес-состояние;
- `shared` содержит независимые технические механизмы, базовые UI-компоненты, hooks и helpers.

Главная формула:

```txt
data хранит состояние и бизнес-правила
smart components подключают data к интерфейсу
dumb UI отображает props
app/infrastructure/adapter связывает инфраструктуру с приложением
app/infrastructure/facade предоставляет нижним слоям стабильный infrastructure API
```

## Направление зависимостей

Основное направление product-слоёв:

```txt
app
 ↓
pages
 ↓
components
 ↓
data
 ↓
shared
```

У этого направления есть только два явно разрешённых infrastructure-отношения:

```txt
data → app/infrastructure/facade/axios → shared
app/infrastructure/adapter → data + app/infrastructure/facade + shared
```

`facade/axios` является узким исключением для HTTP infrastructure API и не даёт `data` общего права импортировать `app`. `adapter`, наоборот, находится в composition layer и может зависеть от нижних слоёв для wiring. Других обратных зависимостей не добавляй.

Таблица регулирует импорты между внутренними слоями. Внешние библиотеки разрешены согласно ответственности слоя. Всё, что не указано в таблице, запрещено.

| Откуда                                    | Разрешено импортировать                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `main.tsx`                                | public API `app`, `initialize`/`dispose` из public API `app/infrastructure/adapter`, глобальные стили из `shared`               |
| `app/index.tsx`, `app/router`             | `pages`, public API `data` для guards, `components`, `shared`, `app/infrastructure/error-boundary`                              |
| `app/infrastructure/adapter`              | собственные файлы, public API конкретных `data`-slices, generic API из `shared/lib`, public API нужного facade                  |
| `app/infrastructure/facade`               | собственные файлы facade и generic API из `shared`                                                                              |
| Page                                      | локальные `sections`/`screens`/`steps`, `components`, public API `data`, `shared`                                               |
| `sections`/`screens`/`steps` страницы     | соседние локальные части той же страницы, `components`, public API `data`, `shared`                                             |
| Smart root, `components/<module>/widgets` | собственный `ui`, public API `data`, `shared`                                                                                   |
| `components/<module>/ui`                  | собственные файлы и `shared`                                                                                                    |
| Обычный domain slice в `data`             | собственные файлы slice, pure helpers/types из `shared`, `@/app/infrastructure/facade/axios`                                    |
| Composite/read-model/flow slice в `data`  | public API явно указанных domain slices, собственные файлы, pure helpers/types из `shared`, `@/app/infrastructure/facade/axios` |
| `shared`                                  | другие модули `shared`                                                                                                          |

`sections`, `screens` и `steps` не являются глобальными папками. Они находятся только внутри папки конкретной страницы, например:

```txt
pages/private/Claims/ClaimId/
  ClaimId.page.tsx
  ClaimId.module.scss
  sections/
  screens/
  steps/
```

Если access-группы не используются, та же локальная структура начинается сразу от page: `pages/Claims/ClaimId/{sections,screens,steps}`.

Не создавай общий `app/infrastructure/index.ts`, который одновременно экспортирует adapters, facades и error boundary. Каждый подслой имеет отдельный public API, чтобы `data` не мог получить adapter через barrel-import.

## Слой app

`app` владеет:

- root React composition;
- router и route configuration;
- guards;
- route layouts;
- global error boundary внутри `app/infrastructure/error-boundary`;
- запуском и остановкой adapters;
- DI-композицией;
- только действительно global providers.

Пример:

```txt
app/
  index.tsx
  router/
    AppRoutes.tsx
    guards/
    layouts/
  infrastructure/
    adapter/
      auth.runtime.ts
      event-bus/
      websocket/
    facade/
      axios/
    error-boundary/
```

Не помещай в `app` domain API, DTO, form stores, reusable product UI или generic transport engines.

## Слой app/infrastructure

`app/infrastructure` группирует глобальные технические механизмы приложения и уменьшает количество папок первого уровня внутри `app`. Внутри него роли строго разделены на `adapter`, `facade` и `error-boundary`.

### Подслой adapter

`app/infrastructure/adapter` — слой application-specific wiring. Он связывает generic-инфраструктуру, facade и конкретное состояние приложения.

Туда можно класть:

- создание и конфигурацию EventBus, WebSocket, BroadcastChannel и SSE;
- связывание `shared/lib` с `data`;
- связывание HTTP facade с `tokenStore` и другими application callbacks;
- подключение application-specific store, provider или callback;
- lifecycle: `init`, `connect`, `subscribe`, `dispose`, `destroy`;
- application-specific router или bridge поверх generic transport;
- DI-композицию инфраструктурных зависимостей.

Точное правило:

> `app/infrastructure/adapter` содержит adapters конкретного приложения. Они могут импортировать `data`, `shared` и `app/infrastructure/facade`, выполнять wiring, оформлять подписки, маршрутизировать события и управлять lifecycle. `data`, `shared`, `pages` и `components` никогда не импортируют adapters.

### Подслой facade

`app/infrastructure/facade` предоставляет нижним слоям узкий стабильный API application-specific инфраструктуры. В текущей архитектуре `data` может импортировать только HTTP facade. Например, `src/data/claims/claims.api.ts` импортирует клиент как `import { authApi } from "@/app/infrastructure/facade/axios"`.

`app/infrastructure/facade/axios` владеет:

- настроенными `publicApi` и `authApi`;
- Axios interceptors и project HTTP configuration;
- generic `AxiosHandler` для request lifecycle;
- generic auth-token callback registry;
- Axios-specific types, которые являются частью facade contract.

Facade не импортирует `data`, `components`, `pages`, router или adapters, не содержит domain DTO/schema/mapper и не выполняет business orchestration.

### Error Boundary

`app/infrastructure/error-boundary` содержит application-level reusable
реализацию React Error Boundary: сам boundary component, его contracts,
generic/application fallback и styles.

Место хранения ErrorBoundary не определяет scope его применения.
Конкретная граница ошибки определяется владельцем composition:

- root application boundary компонуется в `app`;
- route-level boundary компонуется в `app/router`, например внутри `LazyGuard`;
- локальный boundary конкретной page/component компонуется рядом с владельцем,
  если ему требуется собственный lifecycle или специализированный fallback.

`pages`, `components`, `data` и `shared` не должны напрямую зависеть от
`app/infrastructure/error-boundary`, если boundary может быть скомпонован
верхним владельцем.

Разделяй роли:

```txt
shared/lib/event-bus                         generic engine
data/header                                  application state and contracts
app/infrastructure/facade/axios              configured clients and AxiosHandler
app/infrastructure/adapter/event-bus         instance, routing, subscriptions, lifecycle
app/infrastructure/adapter/auth.runtime.ts   tokenStore and Axios facade wiring
app/infrastructure/error-boundary            reusable React Error Boundary implementation
```

Каждый setup имеет симметричный cleanup. `init` должен быть idempotent или явно запрещать повторный вызов. Все unsubscribe functions, reactions, timers и connections освобождаются.

Допустимые способы связи:

1. Auth runtime связывает `tokenStore` с HTTP facade:

```ts
// src/app/infrastructure/adapter/auth.runtime.ts
import {
	resetAuthTokenGetter,
	setAuthTokenGetter,
} from "@/app/infrastructure/facade/axios";
import { tokenStore } from "@/data/token";
import type { IMFRemoteAuthBridge } from "@/shared/mf";

/** Инициализирует авторизацию приложения до первого React render. */
export const initializeAuth = (auth?: IMFRemoteAuthBridge): void => {
	tokenStore.initialize(auth);
	setAuthTokenGetter(() => tokenStore.encodedToken);
};

/** Освобождает auth wiring и ресурсы tokenStore. */
export const disposeAuth = (): void => {
	resetAuthTokenGetter();
	tokenStore.dispose();
};
```

2. Adapter создаёт dependency и передаёт её через constructor:

```ts
// src/app/infrastructure/adapter/event-bus/event-bus.instance.ts

/** Универсальный EventBus, созданный на уровне композиции приложения. */
const eventBus = new EventBusEngine();

/** Маршрутизатор событий конкретного приложения. */
const router = new PlatformEventRouter(eventBus, headerStore);
```

HTTP facade не импортирует `tokenStore`. `headerStore` не импортирует EventBus router.

## Слой shared

`shared` содержит только generic и переносимый код:

```txt
shared/
  assets/
  config/
  helpers/
  hooks/
  lib/
    event-bus/
    websocket/
  theme/
  types/
  ui/
```

Допустимы:

- generic EventBus/WebSocket/BroadcastChannel/SSE engines;
- storage adapters;
- generic error normalization;
- generic hooks и helpers;
- design-system primitives;
- generic transport interfaces без product-specific contracts.

Код является shared, если его можно перенести в другое приложение без product-specific imports и переименования бизнес-сущностей.

Product-aware UI относится к `components`. Product-aware state и contracts относятся к `data`. Application route constants принадлежат `app/router`, а не `shared/config`, потому что route names/paths описывают конкретное приложение.

## Слой data

`data` владеет:

- API operations;
- request/response DTO;
- Valibot schemas;
- mappers;
- frontend/domain types;
- MobX stores;
- loading/error/cancellation state;
- business actions и computed;
- composite, read-model и flow orchestration.

`data` не содержит React components/hooks, React Router, CSS, toast/modal rendering, generic transport engine или bootstrap.

Domain API получает `publicApi`/`authApi`, а store при необходимости получает generic `AxiosHandler` только из `@/app/infrastructure/facade/axios`. Другие импорты из `app` внутри `data` запрещены.

### Выбор структуры data

Всегда выбирай минимальную из трёх форм.

#### 1. Один flow — один плоский уровень

Это default:

```txt
data/claims/
  claims.api.ts
  claims.dto.ts
  claims.mapper.ts
  claims.schema.ts
  claims.store.ts
  claims.types.ts
  index.ts
```

Создавай только реально нужные файлы:

```txt
data/header/
  header.schema.ts
  header.store.ts
  header.types.ts
  index.ts
```

Для одного файла не создавай отдельную техническую папку.

#### 2. Несколько flows одного домена — flow-first

Если domain содержит несколько самостоятельных flows, первый уровень — названия flows:

```txt
data/auth/
  login/
    login.api.ts
    login.dto.ts
    login.mapper.ts
    login.schema.ts
    login.store.ts
    login.types.ts
    index.ts
  registration/
    registration.api.ts
    registration.dto.ts
    registration.mapper.ts
    registration.schema.ts
    registration.store.ts
    registration.types.ts
    index.ts
  logout/
    logout.store.ts
    index.ts
  email-verification/
    email-verification.api.ts
    email-verification.schema.ts
    email-verification.store.ts
    index.ts
  index.ts
```

Внутри каждого flow файлы лежат одним уровнем. Не создавай `auth/login/api`, `auth/login/dto`, `auth/login/model` и другие технические уровни.

Flow выделяется по собственной operation, state или lifecycle, а не автоматически на каждый endpoint.

#### 3. Большая и сложная форма — технические папки

Если один form/slice действительно содержит много API, DTO, mappers, stores, schemas и types:

```txt
data/claim-form/
  api/
    create-claim.api.ts
    upload-document.api.ts
  dto/
    create-claim.dto.ts
    document.dto.ts
  mapper/
    claim-form.mapper.ts
    document.mapper.ts
  model/
    claim-form.store.ts
    document-upload.store.ts
  schema/
    claim-form.schema.ts
    document.schema.ts
  types/
    claim-form.types.ts
    document.types.ts
  index.ts
```

Полный набор папок не является шаблоном. Создавай папку только при реальном объёме.

Если одновременно хочется глубоко вложить flow-first структуру и полный набор технических папок, сначала пересмотри границу slice.

### Имена файлов

Используй точные суффиксы ответственности:

- `*.api.ts`;
- `*.dto.ts`;
- `*.mapper.ts`;
- `*.schema.ts`;
- `*.store.ts`;
- `*.types.ts`;
- `*.vm.ts`;
- `*.constants.ts`;
- `*.helpers.ts`;
- `index.ts`.


Frontend/domain contracts размещаются в `*.types.ts`.

Папка `model/` большой формы может содержать `*.store.ts`, обоснованный `*.vm.ts`, storage/state-machine implementation с точным названием. MobX store implementation внутри `model/` всегда использует суффикс `*.store.ts`.

### View model — модель представления

`*.vm.ts` разрешён только для сборки данных из двух или более stores в одну UI-ready projection.

Допустимая роль:

```ts
// src/data/claim-dashboard/claim-dashboard.vm.ts

/** Описывает вычисляемые данные панели заявок. */
export interface IClaimDashboardVmComputed {
	readonly rows: IClaimDashboardRow[];
	readonly isLoading: boolean;
}

/** Полный контракт view model панели заявок. */
export interface IClaimDashboardVm extends IClaimDashboardVmComputed {}

/** Собирает UI-проекцию из stores заявок и пользователей. */
export class ClaimDashboardVm implements IClaimDashboardVm {
	constructor(
		private readonly claimsStore: IClaimsStore,
		private readonly usersStore: IUsersStore,
	) {
		makeAutoObservable(
			this,
			{
				claimsStore: false,
				usersStore: false,
			},
			{ autoBind: true },
		);
	}

	get rows(): IClaimDashboardRow[] {
		return this.claimsStore.claims.map((claim) => ({
			id: claim.id,
			ownerName: this.usersStore.byId.get(claim.ownerId)?.name ?? "—",
		}));
	}

	get isLoading(): boolean {
		return this.claimsStore.isLoading || this.usersStore.isLoading;
	}
}
```

VM:

- читает несколько stores;
- строит computed projection;
- не копирует source state;
- не выполняет HTTP;
- не содержит runtime response validation;
- не становится владельцем domain actions.

Для одного store используй computed самого store, mapper или тонкий widget. Для cross-domain write orchestration используй flow/composite store, а не VM.

### Независимость доменов

Обычный domain slice не импортирует соседний domain slice.

Если нужны данные или actions нескольких domains, создай отдельного владельца:

```txt
data/claim-dashboard
  → data/claims
  → data/users
```

Виды владельцев:

- composite slice — объединяет несколько domains;
- read-model slice — строит проекцию для чтения;
- flow slice — координирует последовательный сценарий;
- VM — только агрегирует несколько stores для UI.

## Внешняя граница: всегда unknown → Valibot

Любой внешний payload считается недоверенным:

- `response.data` Axios;
- error response body;
- WebSocket/SSE message;
- EventBus/BroadcastChannel event;
- local/session storage;
- query parameter, влияющий на business logic.

Порядок:

```txt
external value: unknown
  → Valibot parse/safeParse
  → validated DTO/event внутри data
  → mapper when needed
  → frontend/domain type
  → store и UI
```

### HTTP-ответ

```ts
// src/data/claims/claims.schema.ts
import { array, object, string } from "valibot";

/** Проверяет неизвестный ответ списка заявок. */
export const ClaimsResponseSchema = object({
	claims: array(
		object({
			claimId: string(),
			claimNumber: string(),
			caseDate: string(),
		}),
	),
});
```

```ts
// src/data/claims/claims.dto.ts
import type { InferOutput } from "valibot";

import { ClaimsResponseSchema } from "./claims.schema";

/** Внутренний DTO проверенного ответа списка заявок. */
export type ClaimsResponseDto = InferOutput<typeof ClaimsResponseSchema>;
```

```ts
// src/data/claims/claims.api.ts
import { parse } from "valibot";

import { authApi } from "@/app/infrastructure/facade/axios";

import type { ClaimsResponseDto } from "./claims.dto";
import { ClaimsResponseSchema } from "./claims.schema";

/** Получает и проверяет неизвестный ответ сервера. */
export const getClaims = async (config?: {
	signal?: AbortSignal;
}): Promise<ClaimsResponseDto> => {
	const response = await authApi.get<unknown>("/api/v1/claims", config);

	return parse(ClaimsResponseSchema, response.data);
};
```

Критическое требование: `get<unknown>`, а не `get<ClaimsResponseDto>`. Axios generic не выполняет runtime validation.

DTO и API function остаются внутренними для `data`. Store преобразует DTO во frontend/domain type и только этот type отдаёт через public state. DTO нельзя экспортировать через `data/<domain>/index.ts` или использовать в `app`, `pages`, `components`, `shared`.

### Ошибка

```ts
// src/data/claims/claims-error.mapper.ts
import { safeParse } from "valibot";

/** Безопасно преобразует неизвестное тело ошибки в ошибку приложения. */
export const mapUnknownToAppError = (payload: unknown): IAppError => {
	const result = safeParse(ApiErrorSchema, payload);

	if (!result.success) {
		return { message: "Неизвестная ошибка" };
	}

	return result.output;
};
```

Проверяй `result.success`. Не проверяй сам object результата на truthiness.

### События

EventBus/WebSocket/BroadcastChannel/SSE payload всегда входит как `unknown`. Product-specific transport schema остаётся private внутри owning `data`-slice и не импортируется adapter через deep import.

Если `app/infrastructure/adapter` должен маршрутизировать business payload, owning `data`-slice публикует узкий parser/decoder function через свой public API. Такой parser принимает `unknown`, внутри использует private Valibot schema и возвращает только validated application event/type или безопасный parse result. Adapter вызывает public parser и передаёт store только validated output.

```txt
external event: unknown
  → app/infrastructure/adapter
  → public parser/decoder owning data-slice
  → private Valibot schema внутри data
  → validated event
  → store
```

Generic envelope без product-семантики может валидироваться на generic infrastructure boundary, но business payload всё равно валидирует его domain owner.

Общий TypeScript interface между разными runtime-источниками не делает message доверенным.

## DTO, types и mappers

DTO — внутренний transport contract, который нужен только для runtime-валидации request/response и последующего mapping внутри `data`. Frontend/domain type описывает форму, которую разрешено отдавать store и UI.

Предпочитай выводить DTO из Valibot schema через `InferOutput`, чтобы schema и type не расходились.

DTO запрещено:

- экспортировать из public `index.ts` data-slice;
- использовать в props React-компонента;
- импортировать в `app`, `pages`, `components` или `shared`;
- делать типом public state/computed store.

Mapper нужен только при реальном transform:

- backend naming → frontend naming;
- nullable/optional normalization;
- объединение или разделение полей;
- date parsing/formatting через `dayjs`;
- form values → request DTO;
- DTO → frontend/domain type.

Пример:

```ts
// src/data/claims/claims.mapper.ts
import dayjs from "dayjs";

/** Преобразует внутренний DTO заявки во frontend-модель. */
export const mapClaimDtoToClaim = (
	dto: ClaimsResponseDto["claims"][number],
): IClaim => ({
	id: dto.claimId,
	number: dto.claimNumber,
	caseDateLabel: dayjs(dto.caseDate).format("DD.MM.YYYY"),
});
```

Mapper остаётся чистым: не выполняет HTTP, не меняет store, не читает router/context.

Не создавай identity mapper.

## Формы

Используй:

- `react-hook-form` для краткоживущего field/touched/error lifecycle;
- `valibotResolver` из `@hookform/resolvers/valibot`;
- Valibot form schema в соответствующем data flow;
- mapper form values → request DTO;
- MobX store для business submit/loading/error/draft lifecycle.

Все контролируемые form components из UI-kit подключай через `Controller`. `Controller` сам регистрирует поле: не вызывай для того же поля `register`.

Нативный uncontrolled `input` технически может использовать `register`, но не смешивай два способа для одного поля. Статические элементы, кнопки и layout не оборачиваются в `Controller`.

Form schema и response schema являются разными contracts. Не объединяй их ради совпавших полей.

Храни draft в MobX только если он должен пережить unmount, использоваться несколькими screens, синхронизироваться с другими stores или иметь самостоятельный business lifecycle.

### Большая форма

Большую форму дели на отдельные form sections. Каждая section:

- находится в собственном файле;
- группирует связанные поля через HTML `fieldset` и `legend`;
- получает методы формы через `useFormContext`;
- использует `Controller` для controlled UI-kit fields;
- использует `useWatch` только когда её rendering или derived state зависит от конкретного значения.

Пример структуры:

```txt
components/claim-form/
  widgets/
    ClaimForm/
      ClaimFormContainer.tsx
      ClaimForm.module.scss
      form-sections/
        MainFieldsSection.tsx
        PaymentFieldsSection.tsx
      index.ts
  index.ts
```

На верхнем уровне product-модуля разрешены только папки `ui` и `widgets`. Папка `form-sections` допустима только внутри конкретного smart-widget. Эти секции используют React Hook Form context, поэтому относятся к `widgets`, а не к dumb `ui`.

Spread syntax запрещён в обычных props, объектах и аргументах. Единственное разрешённое исключение — `<FormProvider {...form}>`, потому что `FormProvider` принимает целый `UseFormReturn`, а ручное перечисление его методов связывает код с конкретной версией React Hook Form и может пропустить новый или внутренний метод.

```tsx
// src/components/claim-form/widgets/ClaimForm/ClaimFormContainer.tsx
import { FormProvider, useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";

/** Создаёт единый React Hook Form context для всех секций формы. */
export const ClaimFormContainer = ({ store }: IClaimFormContainerProps) => {
	const form = useForm<IClaimFormValues>({
		resolver: valibotResolver(ClaimFormSchema),
		defaultValues: store.defaultValues,
	});

	const submitForm = form.handleSubmit((values) => store.submit(values));

	return (
		<FormProvider {...form}>
			<form onSubmit={submitForm}>
				<MainFieldsSection />
				<PaymentFieldsSection />
				<button type="submit">Сохранить</button>
			</form>
		</FormProvider>
	);
};

ClaimFormContainer.displayName = "ClaimFormContainer";
```

Отдельная section читает общий form context:

```tsx
// src/components/claim-form/widgets/ClaimForm/form-sections/MainFieldsSection.tsx
import { Controller, useFormContext, useWatch } from "react-hook-form";

/** Отображает основные поля большой формы. */
export const MainFieldsSection = () => {
	const { control } = useFormContext<IClaimFormValues>();
	const claimType = useWatch({
		control,
		name: "claimType",
	});

	return (
		<fieldset>
			<legend>Основные данные</legend>

			<Controller
				control={control}
				name="claimType"
				render={({ field, fieldState }) => (
					<SelectBox
						name={field.name}
						selected={field.value}
						error={fieldState.error?.message}
						inputRef={field.ref}
						onBlur={field.onBlur}
						onSelect={field.onChange}
					/>
				)}
			/>

			{claimType === "other" ? (
				<Controller
					control={control}
					name="customClaimType"
					render={({ field, fieldState }) => (
						<Input
							error={fieldState.error?.message}
							name={field.name}
							ref={field.ref}
							value={field.value}
							onBlur={field.onBlur}
							onChange={field.onChange}
						/>
					)}
				/>
			) : null}
		</fieldset>
	);
};

MainFieldsSection.displayName = "MainFieldsSection";
```

В этом примере `useWatch` нужен, потому что `customClaimType` показывается условно. Если section только отображает зарегистрированные поля и не зависит от других значений, `useWatch` не добавляй. Для разового чтения внутри event handler используй `getValues`, а не подписку.

Не используй spread syntax в других JSX props, объектах и аргументах. Значения `Controller.field` и обычные props перечисляй явно. Исключение не распространяется дальше `<FormProvider {...form}>`.

## MobX stores

Store владеет:

- observable state;
- computed;
- actions;
- loading/error/status;
- cancellation/race policy;
- business orchestration;
- reset/dispose.

Используй `makeAutoObservable` или `makeObservable`. Не делай injected dependencies observable.

```ts
// src/data/claims/claims.types.ts

/** Состояние списка заявок. */
export interface IClaimsState {
	readonly data: IClaim[];
	readonly isLoading: boolean;
	readonly error: IAppError | null;
}

/** Действия списка заявок. */
export interface IClaimsActions {
	fetch(signal?: AbortSignal): Promise<void>;
	dispose(): void;
}

/** Вычисляемые значения списка заявок. */
export interface IClaimsComputed {
	readonly hasClaims: boolean;
}

/** Полный контракт store списка заявок. */
export interface IClaimsStore
	extends IClaimsState, IClaimsActions, IClaimsComputed {}

// src/data/claims/claims.store.ts

/** Хранит состояние и жизненный цикл списка заявок. */
export class ClaimsStore implements IClaimsStore {
	data: IClaim[] = [];
	isLoading = false;
	error: IAppError | null = null;

	private abortController: AbortController | null = null;

	constructor(private readonly api: IClaimsApi) {
		makeAutoObservable(this, { api: false }, { autoBind: true });
	}

	get hasClaims(): boolean {
		return this.data.length > 0;
	}

	async fetch(signal?: AbortSignal): Promise<void> {
		// API возвращает проверенный DTO только внутри data.
		// Store сохраняет и отдаёт наружу только frontend type IClaim.
	}

	dispose(): void {
		this.abortController?.abort();
	}
}
```

Каждый class обязан явно указывать `implements`. Для store всегда создавай отдельные contracts:

```ts
// src/data/user/user.types.ts

/** Состояние пользователя. */
export interface IUserState {}
/** Действия пользователя. */
export interface IUserActions {}
/** Вычисляемые значения пользователя. */
export interface IUserComputed {}

/** Полный контракт store пользователя. */
export interface IUserStore extends IUserState, IUserActions, IUserComputed {}

// src/data/user/user.store.ts

/** Реализация store пользователя. */
export class UserStore implements IUserStore {}
```

Если contract пустой, не выдумывай state/action ради наполнения: пустой interface допустим и показывает предусмотренную роль.

После `await` изменяй observable state через `runInAction`, MobX `flow` или проверенный request handler.

Store не импортирует:

- React;
- `mobx-react-lite`;
- React Router;
- UI-kit;
- toast/modal implementation;
- CSS;
- `app/infrastructure/adapter`;
- `app/infrastructure/error-boundary`;
- другие `app`-модули и facade, кроме `@/app/infrastructure/facade/axios`.

API module выполняет transport и validation. Mapper выполняет transformation. Store управляет state и orchestration.

### Политика экземпляров

Singleton используй для domain store, если его state действительно имеет application/module-wide lifetime, разделяется несколькими независимыми consumers или должен жить дольше конкретной page/screen lifecycle.

Если state принадлежит одному экземпляру page, формы, wizard или screen и должен сбрасываться вместе с этим владельцем, используй локальный store. Такой экземпляр всегда создавай существующим generic-хуком `useStoreInstance`; не используй `new Store()` непосредственно в render и не подменяй этот контракт `useMemo`.

```tsx
// src/pages/private/Claims/CreateClaim/CreateClaim.page.tsx
import { useEffect } from "react";

import { ClaimFormStore } from "@/data/claim-form";
import { useStoreInstance } from "@/shared/hooks";

/** Создаёт редкий локальный store один раз на lifecycle страницы. */
export const CreateClaimPage = () => {
	const store = useStoreInstance(() => new ClaimFormStore());

	useEffect(() => () => store.dispose(), [store]);

	return <ClaimForm store={store} />;
};

CreateClaimPage.displayName = "CreateClaimPage";
```

Хук получает initializer, вызывает его один раз и возвращает стабильный instance на всё время жизни компонента. Сам хук уже находится в `shared/hooks`; не копируй его реализацию в page или component.

Для каждого singleton должно быть понятно:

- кто создаёт/инициализирует;
- кто вызывает reset/dispose;
- переживает ли он logout;
- как тестируется изолированно.

Store с listener, reaction, timer, request или connection предоставляет cleanup:

```ts
// src/data/claims/claims.store.ts

/** Освобождает ресурсы store. */
dispose(): void {
	this.abortController?.abort()
	this.disposeReaction?.()
}
```

## Public API

Каждый slice и внешний flow имеет `index.ts`.

`index.ts` не делает re-export напрямую из другого файла. На каждый путь-источник допускается ровно один `import`, содержащий только те symbols, которые входят в public API. Типы указывай через inline-модификатор `type` в том же import. После imports используй отдельный `export { ... }` без `from`.

Запрещены все формы re-export-from:

- `export * from "..."`;
- `export { ... } from "..."`;
- `export type { ... } from "..."`.

Плоский slice:

```ts
// src/data/claims/index.ts

import { ClaimsStore } from "./claims.store";
import {
	type IClaim,
	type IClaimsStore,
} from "./claims.types";

/** Публичный API data-slice claims. */
export {
	ClaimsStore,
	type IClaim,
	type IClaimsStore,
};
```

Flow:

```ts
// src/data/auth/login/index.ts

import { LoginFormSchema } from "./login.schema";
import { LoginStore } from "./login.store";
import { type LoginFormValues } from "./login.types";

/** Публичный API flow login. */
export {
	LoginFormSchema,
	LoginStore,
	type LoginFormValues,
};
```

Domain:

```ts
// src/data/auth/index.ts

import {
	EmailVerificationStore,
	type EmailVerificationFormValues,
} from "./email-verification";
import {
	LoginFormSchema,
	LoginStore,
	type LoginFormValues,
} from "./login";
import { LogoutStore } from "./logout";
import {
	RegistrationFormSchema,
	RegistrationStore,
	type RegistrationFormValues,
} from "./registration";

/** Публичный API домена auth. */
export {
	EmailVerificationStore,
	type EmailVerificationFormValues,
	LoginFormSchema,
	LoginStore,
	type LoginFormValues,
	LogoutStore,
	RegistrationFormSchema,
	RegistrationStore,
	type RegistrationFormValues,
};
```

Если symbol не должен быть доступен consumer, не импортируй его в `index.ts` и не добавляй в итоговый export. Не создавай второй import из того же пути ради разделения values и types.

Обычно public:

- singleton store; class экспортируется дополнительно для изолированных тестов или редкого локального instance;
- frontend/domain types;
- form schema для React Hook Form;
- узкий parser/decoder внешнего business event, если он нужен `app/infrastructure/adapter`; сам transport schema и DTO при этом остаются private;
- provider contract, если контекст действительно нужен consumers;
- стабильный facade.

Всегда private внутри `data`:

- request и response DTO;
- raw API function;
- transport schema;
- internal mapper/helper;
- implementation status type.

Другие modules импортируют `@/data/claims`, а не `@/data/claims/claims.store`.

## Слой components

`components` содержит reusable product UI.

### Презентационный UI

Dumb component:

- получает данные через props;
- вызывает callbacks;
- не импортирует `data`, включая type-only import;
- не знает stores, endpoints и DTO;
- использует local types, `shared/ui`, `clsx`, `*.module.scss`.

Presentation types лежат рядом с component.

### Smart root и widget

Smart component:

- импортирует public API `data`;
- использует `observer` только при чтении observables;
- читает computed/state;
- вызывает actions;
- адаптирует store data к props dumb UI.

Smart component не создаёт API, DTO, response schema, mapper или store class и не реализует многошаговую business orchestration.

### Шаблон Header

Используй этот pattern для product component, подобного Header:

```txt
data/header/
  header.store.ts
  header.types.ts
  index.ts

components/header/
  Header.tsx
  Header.types.ts
  ui/
    HeaderView/
      HeaderView.tsx
      HeaderView.module.scss
    HeaderActions/
      HeaderActions.tsx
      HeaderActions.module.scss
  index.ts
```

Smart root:

```tsx
// src/components/header/Header.tsx

/** Подключает headerStore к презентационному HeaderView. */
export const Header = observer(() => {
	const data = headerStore.data;

	if (data === null) {
		return null;
	}

	return (
		<HeaderView
			data={data}
			onAction={headerStore.dispatchAction}
			onTabChange={headerStore.selectTab}
		/>
	);
});

Header.displayName = "Header";
```

EventBus routing не находится в Header. Он находится в `app/infrastructure/adapter/event-bus`. Header только читает store и отправляет user callbacks обратно в store.

## Слой pages

`pages` содержит route-level экраны. Деление по доступу необязательно: выбирай только те группы, которые реально существуют в приложении, и не создавай пустые папки.

Возможны четыре схемы.

### Без групп доступа

```txt
pages/
  Home/
    Home.page.tsx
    Home.module.scss
    index.ts
  Claims/
    ClaimId/
      ClaimId.page.tsx
      ClaimId.module.scss
      index.ts
```

### Только public и private

```txt
pages/
  public/
    Login/
      Login.page.tsx
      Login.module.scss
  private/
    Home/
      Home.page.tsx
      Home.module.scss
```

### Только general и private

```txt
pages/
  general/
    NotFound/
      NotFound.page.tsx
      NotFound.module.scss
  private/
    Home/
      Home.page.tsx
      Home.module.scss
```

### General, public и private

```txt
pages/
  general/
    NotFound/
      NotFound.page.tsx
      NotFound.module.scss
      index.ts
  public/
    Auth/
      Login/
        Login.page.tsx
        Login.module.scss
        index.ts
      Registration/
        Registration.page.tsx
        Registration.module.scss
        index.ts
  private/
    Claims/
      Claims.page.tsx
      Claims.module.scss
      ClaimId/
        ClaimId.page.tsx
        ClaimId.module.scss
        sections/
          Policyholder/
            Policyholder.section.tsx
        index.ts
      index.ts
```

- `general` — общие страницы без привязки к авторизации: `NotFound`, `Forbidden`, техническая ошибка;
- `public` — страницы, доступные без авторизации: login, registration, password recovery;
- `private` — защищённые страницы; доступ к ним ограничивает guard в `app/router`.

Page file всегда называется `<PageName>.page.tsx`, а её SCSS Module — `<PageName>.module.scss`. Route-level lazy export остаётся в соседнем `index.ts`; `index.tsx` для page не нужен. Например, `Registration.page.tsx` находится рядом с `Registration.module.scss`. Путь зависит от выбранной схемы: `pages/Claims/ClaimId/ClaimId.page.tsx` без групп или `pages/private/Claims/ClaimId/ClaimId.page.tsx` с группами. Не используй абстрактный `Details/ClaimDetails.page.tsx`.

Page может:

- читать route params;
- собирать layout из local blocks и reusable components;
- в редком случае создавать page-local store через `useStoreInstance`;
- запускать `fetch`, `reset` и `dispose` владельца lifecycle.

Page не создаёт API/schema/DTO/store class и не реализует business algorithm.

### Route-level lazy loading страниц

Route-level page code-splitting объявляется в соседнем page `index.ts`, а route-level `Suspense` и loading fallback принадлежат `app/router`. Page `index.ts` экспортирует lazy page component, но не добавляет `Suspense`/`LazyBoundary`; router оборачивает lazy page в `LazyGuard`.

```txt
pages/private/Claims/Detail/
  Detail.page.tsx
  Detail.module.scss
  index.ts
```

```tsx
// Detail.page.tsx
const DetailPage = () => {
	return <main>Detail</main>;
};

DetailPage.displayName = "DetailPage";

export default DetailPage;
```

```ts
// index.ts
import { lazy } from "react";

const DetailPage = lazy(() => import("./Detail.page"));

export { DetailPage };
```

`Suspense` для route-level page находится в `LazyGuard` внутри `app/router/guards`:

```tsx
// app/router/guards/LazyGuard.tsx
import { Suspense } from "react";

import { Spinner } from "@/shared/ui";

import { type ILazyGuardProps } from "./LazyGuard.types";

export const LazyGuard = ({ children }: ILazyGuardProps) => {
	return <Suspense fallback={<Spinner />}>{children}</Suspense>;
};

LazyGuard.displayName = "LazyGuard";
```

Router использует уже lazy page:

```tsx
<LazyGuard>
	<DetailPage />
</LazyGuard>
```

Не оборачивай route-level page в `LazyBoundary`. `LazyGuard` владеет route-level loading fallback и `Suspense`; `LazyBoundary` предназначен только для локальных lazy parts внутри уже загруженной page.

`sections`, `screens` и `steps` находятся внутри папки конкретной page:

```txt
pages/private/Claims/ClaimId/sections/
pages/public/Onboarding/Onboarding/screens/
pages/private/Claims/CreateClaim/steps/
```

- `sections` — крупные части обычной страницы;
- `screens` — внутренние экраны одного flow;
- `steps` — шаги wizard/multi-step form.

### Lazy loading локальных parts страницы

`React.lazy` допустим для page-local `screens`, `steps` и крупных `sections`. В первую очередь используй lazy-loading для `screens` и `steps`, потому что пользователь обычно видит только один screen или текущий step, а остальные части можно вынести в отдельные chunks и не загружать при первом render.

`sections` загружай лениво только когда section тяжёлая, условная, редко показывается или тянет заметные зависимости. Не дроби обычную страницу на множество мелких lazy-chunks без измеримой пользы.

Предпочтительный порядок:

```txt
screens  → хороший default-кандидат для lazy
steps    → хороший default-кандидат для lazy
sections → lazy только при реальной выгоде
```

Для локального `screen`/`step`/`section` lazy-entry обязан скрывать от consumer детали `React.lazy` и `Suspense`: внешний consumer импортирует готовый `HistoryScreen`, `DocumentsStep` или `AuditSection` и не добавляет `Suspense` самостоятельно. Общий local-part loading fallback размещай в generic `LazyBoundary` внутри `shared/ui`. `LazyBoundary` не используется для route-level pages — их `Suspense` принадлежит `LazyGuard` в router. Локальный Error Boundary при необходимости компонуй отдельно или внутри специализированного boundary; не добавляй boolean-флаг только ради переключения ответственности.

Модуль, который непосредственно передаётся в `React.lazy`, может использовать `default export`, даже если остальные public APIs предпочитают named exports. Наружу lazy-entry экспортирует named component.

Допустимы два варианта организации.

#### Вариант 1. Отдельный `*.lazy.tsx`

Используй, когда lazy-entry имеет собственную ответственность, дополнительные props, локальный boundary, preload-логику или должен быть явно виден в структуре.

```txt
pages/private/Claims/Detail/screens/History/
  History.screen.tsx
  History.lazy.tsx
  History.module.scss
  index.ts
```

```tsx
// History.screen.tsx
const HistoryScreen = () => {
	return <div>History</div>;
};

HistoryScreen.displayName = "HistoryScreen";

export default HistoryScreen;
```

```tsx
// History.lazy.tsx
import { lazy } from "react";

import { LazyBoundary } from "@/shared/ui";

const LazyHistoryScreen = lazy(() => import("./History.screen"));

/** Публичный lazy-entry локального screen. */
export const HistoryScreen = () => {
	return (
		<LazyBoundary>
			<LazyHistoryScreen />
		</LazyBoundary>
	);
};

HistoryScreen.displayName = "HistoryScreen";
```

```ts
// index.ts
import { HistoryScreen } from "./History.lazy";

export { HistoryScreen };
```

#### Вариант 2. Компактный `index.tsx`

Это предпочтительный минимальный вариант для простого page-local `screen`, `step` или `section`, если отдельный `*.lazy.tsx` не добавляет самостоятельной ответственности. `index.tsx` одновременно является public entry и lazy-wrapper.

```txt
pages/private/Claims/Detail/screens/History/
  History.screen.tsx
  History.module.scss
  index.tsx
```

```tsx
// index.tsx
import { lazy } from "react";

import { LazyBoundary } from "@/shared/ui";

const LazyHistoryScreen = lazy(() => import("./History.screen"));

/** Публичный lazy-entry локального screen. */
export const HistoryScreen = () => {
	return (
		<LazyBoundary>
			<LazyHistoryScreen />
		</LazyBoundary>
	);
};

HistoryScreen.displayName = "HistoryScreen";
```

Consumer в обоих вариантах одинаковый:

```tsx
import { HistoryScreen } from "./screens/History";

export const DetailPage = () => {
	return <HistoryScreen />;
};

DetailPage.displayName = "DetailPage";
```

Не создавай `*.lazy.tsx` автоматически. Если файл только повторяет `lazy + LazyBoundary` и не несёт дополнительной ответственности, используй компактный `index.tsx`. Если lazy-wrapper усложняется, вынеси его в `*.lazy.tsx`, а `index.ts` оставь минимальным public API.

Local block нельзя импортировать из другой page. После появления второго потребителя перенеси его в `components`.

## Providers

Provider размещается рядом с владельцем:

| Контекст                  | Место                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Router                    | `app/router`                                                                              |
| Global Error Boundary     | `app/infrastructure/error-boundary`                                                       |
| Generic UI context        | рядом с `shared/ui` owner                                                                 |
| Generic library context   | рядом с `shared/lib` owner                                                                |
| Domain store context      | рядом со smart consumer в `components/<module>/widgets` или page; store остаётся в `data` |
| Product component context | рядом с `components/<module>`                                                             |
| Page-local store context  | рядом с page                                                                              |

`app/providers` допустим только для действительно global contexts без более узкого владельца.

## Стили и UI conventions

- Component styles: `Component.module.scss`.
- Для page-local parts суффикс остаётся только у TSX-файла: `History.screen.tsx` → `History.module.scss`, `MainInfo.step.tsx` → `MainInfo.module.scss`, `Policyholder.section.tsx` → `Policyholder.module.scss`.
- Import styles: `import styles from "./Component.module.scss"`.
- Conditional class names: `clsx`.
- Не создавай `*.style.ts` вместо SCSS Modules.
- Global SCSS оставляй для reset, tokens и действительно global rules.
- Не дублируй date formatting в JSX; используй `dayjs` в mapper/computed/helper владельца.
- React component names — PascalCase, data filenames — kebab-case или действующий единый convention проекта.
- Предпочитай named exports и локальный public `index.ts`.

### `displayName` для React-компонентов

Каждый объявленный в проекте React-компонент обязан явно иметь `displayName`. Правило действует для page, screen, step, section, smart/widget, dumb UI, wrapper-компонентов, `LazyGuard`, `LazyBoundary`, компонентов под `observer`, `memo`, `forwardRef` и authored lazy-wrapper. Не полагайся только на имя функции или автоматическое определение имени React DevTools. Объект `LazyExoticComponent`, возвращаемый `lazy()`, не является отдельным authored component и не требует ручного `displayName`; `displayName` задаётся загружаемому компоненту и публичному wrapper, если wrapper существует.

Обычный компонент:

```tsx
export const PolicyholderSection = (props: IPolicyholderSectionProps) => {
	return <section>{props.title}</section>;
};

PolicyholderSection.displayName = "PolicyholderSection";
```

Компонент под `observer`:

```tsx
export const ClaimsTable = observer(() => {
	return <ClaimsTableView rows={claimsStore.rows} />;
});

ClaimsTable.displayName = "ClaimsTable";
```

Компонент, который является `default export` для `React.lazy`:

```tsx
const OverviewScreen = ({ claimIdStore }: IOverviewScreenProps) => {
	return <OverviewContent claimIdStore={claimIdStore} />;
};

OverviewScreen.displayName = "OverviewScreen";

export default OverviewScreen;
```

Публичный authored lazy-wrapper также получает собственный `displayName`, а результат `lazy()` отдельно не именуется:

```tsx
const LazyOverviewScreen = lazy(() => import("./Overview.screen"));

export const OverviewScreen = ({ claimIdStore }: IOverviewScreenProps) => {
	return (
		<LazyBoundary>
			<LazyOverviewScreen claimIdStore={claimIdStore} />
		</LazyBoundary>
	);
};

OverviewScreen.displayName = "OverviewScreen";
```

`displayName` совпадает с публичным или локальным именем компонента и задаётся сразу после объявления/оборачивания компонента.

## Короткий список правил

1. `shared` не импортирует `data`, `components`, `pages` или `app` и не знает бизнес-сущности.
2. `data` не импортирует React, UI-kit, `components`, `pages` или `app`, кроме единственного HTTP facade `@/app/infrastructure/facade/axios`.
3. Domain API, DTO, Valibot schema, mapper и MobX store создаются только внутри соответствующего `data`-slice.
4. Dumb-компоненты в `components/<module>/ui` не импортируют `data`, даже через `import type`.
5. Smart-компоненты в `components/<module>/widgets` могут использовать public API `data`, но не создают API, DTO, schema, mapper или store class.
6. `sections`, `screens` и `steps` локальны для одной page и не переиспользуются между страницами.
7. Page читает route params и собирает экран, но не реализует API-вызовы, mapping и бизнес-сценарии.
8. DTO нужен только внутри validation/mapping boundary `data` и не используется как frontend-модель.
9. Mapper не создаётся внутри component, page или store.
10. Valibot schema не создаётся внутри component, page или store; импортируются только конкретные функции Valibot.
11. Provider лежит рядом со своей ответственностью и поднимается в `app` только при действительно глобальном lifetime.
12. `index.ts` делает один `import` на каждый путь только для нужных symbols, затем отдельный `export { ... }` без `from`; любые re-export-from запрещены.
13. Каждый class имеет явный `implements`; store interface расширяет state, actions и computed interfaces.
14. `app/infrastructure/adapter` выполняет application wiring и не импортируется нижними слоями; `data` использует HTTP только через `@/app/infrastructure/facade/axios`.
15. Controlled-поля формы используют `Controller`; большие формы делятся на отдельные `fieldset`-секции под одним `FormProvider`.
16. Spread syntax запрещён; единственное исключение — передача полного результата `useForm` через `<FormProvider {...form}>`. Обычные props и значения `Controller` перечисляются явно.
17. Singleton используется только для state с application/module-wide lifetime или несколькими независимыми consumers; page/form/wizard/screen-owned state создаётся локально через `useStoreInstance`.
18. Любой внешний payload проходит `unknown → Valibot → validated DTO/event → frontend/domain type`; adapter получает business validation только через public parser/decoder owning `data`-slice, а не через private schema.
19. Route-level page lazy-loading экспортируется из page `index.ts`, а `Suspense` предоставляет `LazyGuard` в `app/router`; `LazyBoundary` для страниц не используется.
20. `React.lazy` допустим для page-local `screens`, `steps` и крупных `sections`; consumer получает готовый local component с `LazyBoundary`, а простой lazy-wrapper можно держать прямо в `index.tsx` вместо отдельного `*.lazy.tsx`.
21. Каждый объявленный React-компонент обязан явно иметь `displayName`, включая `observer`, `memo`, `forwardRef`, `LazyGuard`, `LazyBoundary`, loaded lazy component и authored wrapper; результат `lazy()` отдельно не требует `displayName`.

## Порядок работы над задачей

1. Изучи существующую структуру, imports, public APIs, naming и lifecycle.
2. Определи владельца данных и количество flows.
3. Выбери минимальную форму `data`: flat, flow-first или technical folders для большой формы.
4. Зафиксируй внешние boundaries и сделай payload `unknown`.
5. Добавь Valibot schemas до stores/UI.
6. Раздели form, request и response contracts.
7. Вынеси реальные transformations в pure mappers.
8. Реализуй store state/actions/cancellation/reset/dispose.
9. Если участвуют несколько domains, создай composite/read-model/flow owner.
10. Создавай `*.vm.ts` только для projection из нескольких stores.
11. Свяжи generic infrastructure и data через `app/infrastructure/adapter`, а domain HTTP направь через `@/app/infrastructure/facade/axios`.
12. Раздели smart и dumb UI.
13. Открой минимальные public APIs и убери deep imports.
14. Добавь или обнови tests для schemas, mappers, stores, VMs и adapters.
15. Проверь lint, types, tests и production build доступными командами проекта.

Не создавай файлы и уровни «на будущее». Не меняй unrelated code. Если требование нарушает dependency direction или доверенную boundary, объясни конфликт и предложи архитектурно корректный вариант.

## Антипаттерны

### 1. Shared или facade импортирует бизнес-слои

`shared` и `app/infrastructure/facade` не знают о `data`. Иначе facade создаёт цикл `data → facade → data`, а generic-код перестаёт быть независимым.

### 2. Data импортирует UI

`data` не знает о React-компонентах, pages, toast, router и стилях. Такой import создаёт цикл и смешивает состояние с отображением.

```ts
// src/data/posts/posts.store.ts
import { PostCard } from "@/components/PostCard";

/** Антипример: store зависит от UI-компонента. */
export const renderPostFromStore = PostCard;
```

Хороший store импортирует только собственные data-модули и `shared`:

```ts
// src/data/posts/posts.store.ts
import { createPostApi } from "./posts.api";
import { mapCreatePostFormToRequestDto } from "./posts.mapper";

/** Контракт store публикаций. */
export interface IPostsStore {
	createPost(values: ICreatePostFormValues): Promise<void>;
}

/** Управляет публикациями без зависимости от UI. */
export class PostsStore implements IPostsStore {
	async createPost(values: ICreatePostFormValues): Promise<void> {
		const dto = mapCreatePostFormToRequestDto(values);
		await createPostApi(dto);
	}
}
```

### 3. Axios-запрос внутри компонента

Прямой запрос из React обходит validation, mapper и единое состояние loading/error.

```tsx
// src/components/posts/widgets/PostsList/PostsList.tsx
import axios from "axios";
import { useEffect } from "react";

/** Антипример: UI напрямую вызывает backend. */
export const PostsList = () => {
	useEffect(() => {
		void axios.get("/posts");
	}, []);

	return null;
};
```

Хорошо:

```tsx
// src/components/posts/widgets/PostsList/PostsList.tsx
import { useEffect } from "react";
import { observer } from "mobx-react-lite";

import { postsStore } from "@/data/posts";

/** Подключает public API postsStore к списку публикаций. */
export const PostsList = observer(() => {
	useEffect(() => {
		void postsStore.fetchPosts();
	}, []);

	return <PostsListView posts={postsStore.posts} />;
});

PostsList.displayName = "PostsList";
```

### 4. DTO используется как frontend-модель

DTO описывает проверенный backend contract только внутри `data`. UI не должен зависеть от snake_case и изменений transport-формата.

```tsx
// src/components/posts/ui/PostCard/PostCard.tsx
import type { IPostResponseDto } from "@/data/posts";

/** Антипример: props компонента раскрывают внутренний DTO. */
export interface IPostCardProps {
	post: IPostResponseDto;
}

/** Антипример карточки, зависящей от backend naming. */
export const PostCard = ({ post }: IPostCardProps) => (
	<h3>{post.created_at}</h3>
);
```

Хорошо: widget преобразует public frontend type в простые props dumb-компонента.

```tsx
// src/components/posts/ui/PostCard/PostCard.tsx

/** Props презентационной карточки публикации. */
export interface IPostCardProps {
	title: string;
	createdAtLabel: string;
}

/** Отображает подготовленные frontend-данные. */
export const PostCard = ({ title, createdAtLabel }: IPostCardProps) => (
	<article>
		<h3>{title}</h3>
		<time>{createdAtLabel}</time>
	</article>
);

PostCard.displayName = "PostCard";
```

### 5. Mapper находится в component или page

Mapping в JSX дублируется, плохо тестируется и заставляет UI знать DTO.

```tsx
// src/components/posts/widgets/PostCard/PostCard.tsx

/** Антипример: преобразует DTO во время render. */
export const PostCard = ({ postDto }: { postDto: IPostResponseDto }) => {
	const post = {
		id: postDto.id,
		title: postDto.title,
		createdAt: new Date(postDto.created_at),
	};

	return <h3>{post.title}</h3>;
};
```

Хорошо:

```ts
// src/data/posts/posts.mapper.ts

/** Преобразует внутренний response DTO во frontend-модель. */
export const mapPostResponseDtoToPost = (dto: IPostResponseDto): IPost => ({
	id: dto.id,
	title: dto.title,
	createdAt: new Date(dto.created_at),
});
```

### 6. Mapper встроен в store

Store координирует действия, но не описывает backend naming и transform-логику.

```ts
// src/data/posts/posts.store.ts

/** Антипример: store вручную собирает request DTO. */
export class PostsStore implements IPostsStore {
	async createPost(values: ICreatePostFormValues): Promise<void> {
		await createPostApi({
			title: values.title,
			description: values.description,
			category_id: values.categoryId,
		});
	}
}
```

Хорошо:

```ts
// src/data/posts/posts.store.ts

/** Отправляет форму через отдельный mapper и API boundary. */
export class PostsStore implements IPostsStore {
	async createPost(values: ICreatePostFormValues): Promise<void> {
		const dto = mapCreatePostFormToRequestDto(values);
		await createPostApi(dto);
	}
}
```

### 7. Valibot schema создаётся внутри компонента

Schema внутри render пересоздаётся, не переиспользуется и скрывает контракт формы.

```tsx
// src/components/posts/widgets/CreatePostForm/CreatePostForm.tsx
import { object, string } from "valibot";

/** Антипример: schema создаётся при каждом render. */
export const CreatePostForm = () => {
	const schema = object({ title: string(), description: string() });
	const form = useForm({ resolver: valibotResolver(schema) });

	return <form onSubmit={form.handleSubmit(() => undefined)} />;
};
```

Хорошо:

```ts
// src/data/posts/create-post.schema.ts
import {
	type InferOutput,
	object,
	string,
} from "valibot";

/** Проверяет значения формы создания публикации. */
export const CreatePostFormSchema = object({
	title: string(),
	description: string(),
});

/** Тип проверенных значений формы. */
export type CreatePostFormValues = InferOutput<typeof CreatePostFormSchema>;
```

### 8. Store создаётся внутри render без необходимости

Такой store пересоздаётся и теряет состояние. Domain store обычно экспортирует singleton из `data`. Редкий page-local store создаётся один раз через `useStoreInstance`.

```tsx
// src/components/posts/widgets/PostsList/PostsList.tsx

/** Антипример: создаёт новый store на каждом render. */
export const PostsList = () => {
	const store = new PostsStore();
	return <PostsListView posts={store.posts} />;
};
```

```ts
// src/data/posts/index.ts

/** Стабильный app-wide instance store публикаций. */
export const postsStore: IPostsStore = new PostsStore();
```

Если lifetime действительно локален:

```tsx
// src/pages/private/Posts/PostPreview/PostPreview.page.tsx
import { PostPreviewStore } from "@/data/posts";
import { useStoreInstance } from "@/shared/hooks";

/** Создаёт локальный store ровно один раз на lifecycle страницы. */
export const PostPreviewPage = () => {
	const store = useStoreInstance(() => new PostPreviewStore());

	return <PostPreview store={store} />;
};

PostPreviewPage.displayName = "PostPreviewPage";
```

Локальный UI-state допустим, если в нём нет API, DTO, mapper и business state.

### 9. Dumb UI импортирует data

`components/<module>/ui` получает только props. Если компонент читает store, это smart widget.

```tsx
// src/components/posts/ui/PostCard/PostCard.tsx
import { postsStore } from "@/data/posts";

/** Антипример: презентационный компонент стал smart. */
export const PostCard = () => <h3>{postsStore.selectedPost?.title}</h3>;
```

```tsx
// src/components/posts/ui/PostCard/PostCard.tsx

/** Props dumb-карточки публикации. */
export interface IPostCardProps {
	title: string;
	description?: string;
	imageUrl?: string | null;
}

/** Отображает публикацию только из props. */
export const PostCard = ({ title, description }: IPostCardProps) => (
	<article>
		<h3>{title}</h3>
		<p>{description}</p>
	</article>
);

PostCard.displayName = "PostCard";
```

### 10. Widget реализует data-layer

Widget может импортировать public API `data`, но не содержит `*.api.ts`, DTO, schema, mapper или store class.

```ts
// src/components/posts/widgets/PostCard/PostCard.api.ts
import axios from "axios";

/** Антипример: API ошибочно размещён внутри widget. */
export const getPost = (): Promise<unknown> => axios.get("/posts/1");
```

```tsx
// src/components/posts/widgets/PostCard/PostCard.tsx
import { observer } from "mobx-react-lite";

import { postsStore } from "@/data/posts";
import { PostCardView } from "../../ui/PostCardView";

/** Подключает store к dumb-компоненту. */
export const PostCard = observer(() => (
	<PostCardView post={postsStore.selectedPost} />
));

PostCard.displayName = "PostCard";
```

### 11. Section импортируется другой страницей

`sections`, `screens` и `steps` принадлежат одной page. После второго потребителя блок переносится в `components`.

```tsx
// src/pages/private/Profile/Profile.page.tsx
import { StatsSection } from "@/pages/private/Home/sections";

/** Антипример: одна page зависит от локальной section другой page. */
export const ProfilePage = () => <StatsSection />;
```

```tsx
// src/components/stats/widgets/StatsBlock/StatsBlock.tsx

/** Переиспользуемый smart-блок статистики. */
export const StatsBlock = observer(() => <StatsView data={statsStore.data} />);

StatsBlock.displayName = "StatsBlock";
```

### 12. Page содержит сложную бизнес-логику

Page собирает route-level экран. Fetch orchestration, filtering и mapping принадлежат store/flow/widget-владельцу.

```tsx
// src/pages/private/Home/Home.page.tsx

/** Антипример: page самостоятельно управляет несколькими business stores. */
export const HomePage = observer(() => {
	useEffect(() => {
		void postsStore.fetchPosts();
		void profileStore.fetchProfile();
		void notificationsStore.fetchNotifications();
	}, []);

	const posts = postsStore.posts.filter(isVisiblePost);
	return <PostsList posts={posts} />;
});
```

```tsx
// src/pages/private/Home/Home.page.tsx

/** Собирает главную страницу из локальных секций. */
export const HomePage = () => (
	<main>
		<StatsSection />
		<PostsSection />
	</main>
);

HomePage.displayName = "HomePage";
```

### 13. Общая папка внутри data превращается в свалку

Не создавай технический `data/common` для несвязанных DTO, mappers и stores. Контракт остаётся у domain owner; cross-domain orchestration получает отдельный именованный slice; generic contract переносится в `shared` только без бизнес-семантики.

```ts
// src/data/common/post.mapper.ts

/** Антипример: mapper потерял владельца posts. */
export const mapPost = (dto: IPostResponseDto): IPost => ({
	id: dto.id,
	title: dto.title,
	createdAt: new Date(dto.created_at),
});
```

Правильный путь: `src/data/posts/posts.mapper.ts`.

### 14. Public API открывает internals или использует re-export-from

DTO, raw API, transport schema и mapper не входят в public API. `index.ts` также не использует `export ... from`: сначала один раз импортирует нужные symbols из каждого источника, затем экспортирует их отдельным блоком.

```ts
// src/data/posts/index.ts

import { createPostApi } from "./posts.api";
import { type ICreatePostRequestDto } from "./posts.dto";
import { mapCreatePostFormToRequestDto } from "./posts.mapper";
import { PostsResponseSchema } from "./posts.schema";
import { PostsStore } from "./posts.store";

/** Антипример: public API раскрывает internal transport details. */
export {
	createPostApi,
	type ICreatePostRequestDto,
	mapCreatePostFormToRequestDto,
	PostsResponseSchema,
	PostsStore,
};
```

```ts
// src/data/posts/index.ts

import { CreatePostFormSchema } from "./create-post.schema";
import { PostsStore, postsStore } from "./posts.store";
import {
	type CreatePostFormValues,
	type IPost,
	type IPostsStore,
} from "./posts.types";

/** Минимальный публичный API posts. */
export {
	CreatePostFormSchema,
	type CreatePostFormValues,
	type IPost,
	type IPostsStore,
	PostsStore,
	postsStore,
};
```

### 15. Deep import обходит public API

Внешний consumer использует `index.ts`; относительные deep imports допустимы только внутри самого module/slice.

```ts
// src/pages/private/Posts/Posts.page.tsx

/** Антипример: consumer знает внутреннюю структуру modules. */
import { PostCard } from "@/components/posts/ui/PostCard/PostCard";
import { postsStore } from "@/data/posts/posts.store";
```

```ts
// src/pages/private/Posts/Posts.page.tsx

/** Импорты через публичные API модулей. */
import { PostCard } from "@/components/posts";
import { postsStore } from "@/data/posts";
```

### 16. Business hook находится в shared/hooks

`shared/hooks` содержит только generic hooks: `useDebounce`, `useClickOutside`, `useMediaQuery`, `usePrevious`, `useToggle`.

```ts
// src/shared/hooks/usePosts.ts
import { postsStore } from "@/data/posts";

/** Антипример: shared hook зависит от business store. */
export const usePosts = (): IPost[] => postsStore.posts;
```

Business hook размещается рядом с `components/posts/widgets` или заменяется прямым чтением store в smart widget.

### 17. Shared helper имеет бизнес-зависимость

```ts
// src/shared/helpers/auth/get-current-user.ts
import { profileStore } from "@/data/profile";

/** Антипример: utility знает application store. */
export const getCurrentUser = (): IUser | null => profileStore.user;
```

```ts
// src/shared/helpers/string/capitalize.ts

/** Делает первую букву строки заглавной. */
export const capitalize = (value: string): string =>
	value.charAt(0).toUpperCase() + value.slice(1);
```

### 18. UI primitive содержит бизнес-семантику

```tsx
// src/shared/ui/Button/Button.tsx

/** Антипример: generic Button знает сценарий создания публикации. */
export const Button = ({ variant }: { variant: "createPost" }) => (
	<button className={styles.createPost}>Создать публикацию</button>
);
```

```tsx
// src/components/posts/widgets/CreatePostButton/CreatePostButton.tsx

/** Бизнесовая кнопка поверх универсального UI primitive. */
export const CreatePostButton = () => (
	<Button variant="primary">Создать публикацию</Button>
);

CreatePostButton.displayName = "CreatePostButton";
```

### 19. Store управляет navigation или toast

`data` возвращает результат операции. UI-владелец решает, как уведомить пользователя и куда перейти.

```ts
// src/data/posts/posts.store.ts

/** Антипример: store зависит от UI runtime. */
export class PostsStore implements IPostsStore {
	async createPost(values: ICreatePostFormValues): Promise<void> {
		await createPostApi(mapCreatePostFormToRequestDto(values));
		toast.success("Публикация создана");
		navigate("/posts");
	}
}
```

```tsx
// src/components/posts/widgets/CreatePostForm/CreatePostForm.tsx

/** Обрабатывает UI-эффекты после business action. */
export const CreatePostForm = observer(() => {
	const navigate = useNavigate();

	const submit = async (values: ICreatePostFormValues): Promise<void> => {
		const post = await postsStore.createPost(values);
		if (post) {
			pushToast({ type: "success", title: "Публикация создана" });
			navigate("/posts");
		}
	};

	return <CreatePostFormView onSubmit={submit} />;
});

CreatePostForm.displayName = "CreatePostForm";
```

### 20. Form schema и response schema объединены

Источники и правила форм различаются, даже если поля временно совпадают.

```ts
// src/data/posts/post.schema.ts
import { object, string } from "valibot";

/** Антипример: одна schema используется для формы и ответа backend. */
export const PostSchema = object({ title: string(), description: string() });
```

```ts
// src/data/posts/create-post.schema.ts
import { object, string } from "valibot";

/** Проверяет форму создания публикации. */
export const CreatePostFormSchema = object({
	title: string(),
	description: string(),
});

// src/data/posts/posts-response.schema.ts
import { array, object } from "valibot";

import { PostResponseSchema } from "./post-response.schema";

/** Проверяет ответ backend со списком публикаций. */
export const PostsResponseSchema = object({
	posts: array(PostResponseSchema),
});
```

### 21. Один огромный store

Если actions имеют разные loading/error/reset/lifecycle, раздели stores или выдели отдельные slices: `data/posts`, `data/comments`, `data/post-moderation`. Не объединяй список, редактор, комментарии, moderation, upload и analytics в один God Object.

### 22. Один огромный mapper

Большой transform делится на чистые функции и собирается композицией.

```ts
// src/data/posts/posts.mapper.ts

/** Собирает request DTO из небольших mapper-функций. */
export const mapCreatePostFormToRequestDto = (
	form: ICreatePostFormValues,
): ICreatePostRequestDto => ({
	title: mapPostTitleToDto(form.title),
	description: mapPostDescriptionToDto(form.description),
	image: mapPostImageToDto(form.image),
	tag_ids: mapPostTagsToDto(form.tags),
	category_id: mapPostCategoryToDto(form.category),
	metadata: mapPostMetadataToDto(form.metadata),
});
```

### 23. Components становится новым shared

Соблюдай назначение:

```txt
shared/ui/           универсальные primitives
shared/hooks/        универсальные hooks
shared/helpers/      чистые utilities
components/*/ui/     app-level dumb UI
components/*/widgets app-level smart UI
```

Не помещай `Button`, generic `Modal`, `formatDate` и `useDebounce` в `components`.

### 24. Sections становится библиотекой компонентов

`sections` содержит только локальные блоки одной page:

```txt
pages/private/Home/
  Home.page.tsx
  Home.module.scss
  sections/
    Stats/
      Stats.section.tsx
    Posts/
      Posts.section.tsx
```

Reusable `Button`, `PostCard`, `UserAvatar` и `StatsBlock` принадлежат `shared/ui` или `components` по своей роли.

### 25. Route layout становится бизнес-компонентом

Layout размещает route shell, `Outlet` и готовые application components, но не читает domain store напрямую.

```tsx
// src/app/router/layouts/MainLayout/MainLayout.tsx
import { observer } from "mobx-react-lite";
import { postsStore } from "@/data/posts";

/** Антипример: route layout содержит бизнес-логику posts. */
export const MainLayout = observer(() => <div>{postsStore.posts.length}</div>);
```

```tsx
// src/app/router/layouts/MainLayout/MainLayout.tsx
import { Outlet } from "react-router";

import { AppHeader } from "@/components/header";

/** Размещает общий header и дочерний route. */
export const MainLayout = () => (
	<>
		<AppHeader />
		<Outlet />
	</>
);

MainLayout.displayName = "MainLayout";
```

### Дополнительные обязательные запреты

- namespace-import Valibot вместо named imports конкретных функций;
- `export * from`, `export { ... } from` и `export type { ... } from` в любом public API;
- два или более imports из одного пути в одном файле, а также import лишних symbols в `index.ts`;
- `axios.get<ResponseDto>()`, `any` или type assertion вместо `unknown → Valibot`;
- class без `implements` и store без `IState`/`IActions`/`IComputed`/`IStore`;
- MobX store implementation с суффиксом, отличным от `*.store.ts`, и `*.vm.ts`, читающие только один store;
- technical folders у маленького slice и лишняя вложенность внутри flow-first domain;
- обычный domain slice, напрямую импортирующий соседний domain slice;
- любой нижний слой, импортирующий `app/infrastructure/adapter`;
- `data`, импортирующий любой `app`-модуль, кроме `@/app/infrastructure/facade/axios`;
- `app/infrastructure/facade`, импортирующий `data`, `components`, `pages`, router или adapters;
- общий barrel `app/infrastructure/index.ts`, одновременно экспортирующий adapter, facade и error boundary;
- реализация generic transport engine в `app/infrastructure/adapter` или application callback в `shared/lib`; adapter может создать настроенный instance generic engine, а configured Axios clients и `AxiosHandler` являются отдельным facade contract;
- controlled field без `Controller` или одновременные `Controller` и `register` для одного поля;
- spread syntax в props, объектах, аргументах или объекте `Controller.field`; разрешено только `<FormProvider {...form}>`;
- большая форма без отдельных файлов sections и HTML `fieldset`;
- `useWatch` без зависимости UI от наблюдаемого значения;
- внешний EventBus/WebSocket/BroadcastChannel/SSE payload без Valibot, а также adapter, deep-importящий private transport schema вместо public parser/decoder владельца;
- route-level page, обёрнутая в `LazyBoundary` вместо router-level `LazyGuard`;
- subscription, reaction, timer, request или connection без cleanup;
- provider без владельца, CSS-in-JS вместо `*.module.scss`, строки классов вместо `clsx` и дублирование date-formatting вместо `dayjs`.

## Финальная проверка

Перед завершением убедись:

- структура `data` соответствует количеству flows и объёму;
- auth-like domain имеет flow-first структуру с плоскими flow folders;
- сложная форма использует только нужные technical folders;
- Valibot импортируется только named imports конкретных методов;
- все MobX store implementations используют суффикс `*.store.ts`;
- каждый `*.vm.ts` читает минимум два stores;
- каждый class имеет `implements`;
- каждый store имеет `IState`, `IActions`, `IComputed` и общий `IStore`;
- каждый внешний payload проходит `unknown → Valibot`;
- EventBus/WebSocket business payload валидируется private schema владельца через его public parser/decoder; adapter не deep-importит schema;
- API не выпускает raw unvalidated response;
- DTO остаются только внутри `data` и не входят в public API;
- в `index.ts` нет re-export-from, каждый путь импортируется один раз, а наружу явно отдаются только нужные symbols;
- form/request/response contracts разделены;
- controlled form fields используют `Controller`;
- spread syntax отсутствует, кроме единственного канонического `<FormProvider {...form}>`; обычные props и значения `Controller.field` перечислены явно;
- большая форма разделена на `fieldset` sections с `FormProvider`/`useFormContext`;
- `useWatch` применяется только для зависимых или условных полей;
- MobX async state меняется корректно;
- singleton используется только при application/module-wide lifetime или нескольких независимых consumers; page/form/wizard/screen-owned store создаётся через `useStoreInstance`;
- domain slices независимы;
- выбрана минимальная схема `pages`: без групп или только с реально нужными `general`/`public`/`private`; пустых access-групп нет;
- каждая page названа `<PageName>.page.tsx`, рядом лежит `<PageName>.module.scss`, а её `sections`/`screens`/`steps` остаются локальными;
- route-level lazy page экспортируется из `index.ts` без `LazyBoundary`, а router оборачивает её в `LazyGuard`;
- lazy `screen`/`step`/тяжёлая `section` скрывает local `Suspense` внутри `LazyBoundary`;
- каждый объявленный React-компонент имеет явный `displayName`; объект, возвращаемый `lazy()`, отдельно не именуется;
- `app/infrastructure/adapter` владеет application wiring и cleanup;
- `data`, `shared`, `pages` и `components` не импортируют `app/infrastructure/adapter`;
- domain HTTP импортируется только из `@/app/infrastructure/facade/axios`;
- `app/infrastructure/facade/axios` не импортирует business layers;
- глобальный Error Boundary находится в `app/infrastructure/error-boundary`, локальные boundaries — рядом со своим владельцем;
- dumb UI не импортирует `data`;
- styles находятся в `*.module.scss`, conditions используют `clsx`;
- public APIs минимальны, deep imports отсутствуют;
- setup и cleanup симметричны;
- tests и доступные проверки выполнены.

В итоговом ответе кратко перечисли:

- какие owners/slices/flows определены;
- какую структуру `data` выбрал и почему;
- где проходит `unknown → Valibot`;
- какие adapters и lifecycle добавлены или изменены;
- какие файлы изменены;
- какие проверки выполнены и их результат.

## Полная файловая структура на примере блога

В этом примере блогу нужны все три access-группы. Если в проекте нет публичных, общих или защищённых маршрутов, убери соответствующую группу целиком. Не копируй пустые папки.

```txt
src/
  main.tsx

  app/
    index.tsx
    infrastructure/
      adapter/
        auth.runtime.ts
        index.ts
        event-bus/
          event-bus.adapter.ts
          event-bus.instance.ts
          event-bus.router.ts
          event-bus.types.ts
          index.ts
        websocket/
          websocket.adapter.ts
          websocket.router.ts
          index.ts
      facade/
        axios/
          auth-token.ts
          axios.config.ts
          axios.store.ts
          axios.types.ts
          index.ts
      error-boundary/
        AppErrorBoundary.tsx
        ErrorBoundaryFallback.tsx
        ErrorBoundaryFallback.module.scss
        error-boundary.types.ts
        index.ts
    router/
      AppRoutes.tsx
      routes.constants.ts
      guards/
        AuthGuard.tsx
        GuestGuard.tsx
        LazyGuard.tsx
        LazyGuard.types.ts
        index.ts
      layouts/
        MainLayout/
          MainLayout.tsx
          MainLayout.module.scss
          index.ts
        PublicLayout/
          PublicLayout.tsx
          PublicLayout.module.scss
          index.ts
      index.ts

  pages/
    general/
      NotFound/
        NotFound.page.tsx
        NotFound.module.scss
        index.ts
    public/
      Home/
        Home.page.tsx
        Home.module.scss
        sections/
          Hero/
            Hero.section.tsx
            Hero.module.scss
          LatestPosts/
            LatestPosts.section.tsx
            LatestPosts.module.scss
        index.ts
      Posts/
        Posts.page.tsx
        Posts.module.scss
        sections/
          PostsFeed/
            PostsFeed.section.tsx
            PostsFeed.module.scss
        index.ts
      PostSlug/
        PostSlug.page.tsx
        PostSlug.module.scss
        sections/
          PostContent/
            PostContent.section.tsx
            PostContent.module.scss
          PostComments/
            PostComments.section.tsx
            PostComments.module.scss
        index.ts
      Auth/
        Login/
          Login.page.tsx
          Login.module.scss
          index.ts
        Registration/
          Registration.page.tsx
          Registration.module.scss
          index.ts
        EmailVerification/
          EmailVerification.page.tsx
          EmailVerification.module.scss
          index.ts
    private/
      Dashboard/
        Dashboard.page.tsx
        Dashboard.module.scss
        sections/
          PostsStats/
            PostsStats.section.tsx
            PostsStats.module.scss
          RecentDrafts/
            RecentDrafts.section.tsx
            RecentDrafts.module.scss
        index.ts
      Editor/
        CreatePost/
          CreatePost.page.tsx
          CreatePost.module.scss
          steps/
            MainInfo/
              MainInfo.step.tsx
              MainInfo.module.scss
            Content/
              Content.step.tsx
              Content.module.scss
            Publication/
              Publication.step.tsx
              Publication.module.scss
          index.ts
        PostId/
          PostId.page.tsx
          PostId.module.scss
          index.ts
      Profile/
        Profile.page.tsx
        Profile.module.scss
        sections/
          ProfileInfo/
            ProfileInfo.section.tsx
            ProfileInfo.module.scss
        index.ts

  components/
    header/
      Header.tsx
      Header.types.ts
      ui/
        HeaderView/
          HeaderView.tsx
          HeaderView.module.scss
          index.ts
      widgets/
        UserMenu/
          UserMenu.tsx
          UserMenu.module.scss
          index.ts
      index.ts
    posts/
      ui/
        PostCard/
          PostCard.tsx
          PostCard.types.ts
          PostCard.module.scss
          index.ts
        PostList/
          PostList.tsx
          PostList.types.ts
          PostList.module.scss
          index.ts
      widgets/
        PostsFeed/
          PostsFeed.tsx
          PostsFeed.module.scss
          index.ts
        PostDetails/
          PostDetails.tsx
          PostDetails.module.scss
          index.ts
        CreatePostForm/
          CreatePostFormContainer.tsx
          CreatePostForm.module.scss
          form-sections/
            MainFieldsSection.tsx
            ContentFieldsSection.tsx
            PublicationFieldsSection.tsx
          index.ts
      index.ts
    comments/
      ui/
        CommentCard/
          CommentCard.tsx
          CommentCard.types.ts
          CommentCard.module.scss
          index.ts
      widgets/
        CommentsList/
          CommentsList.tsx
          CommentsList.module.scss
          index.ts
      index.ts

  data/
    auth/
      login/
        login.api.ts
        login.dto.ts
        login.mapper.ts
        login.schema.ts
        login.store.ts
        login.types.ts
        index.ts
      registration/
        registration.api.ts
        registration.dto.ts
        registration.mapper.ts
        registration.schema.ts
        registration.store.ts
        registration.types.ts
        index.ts
      logout/
        logout.api.ts
        logout.store.ts
        logout.types.ts
        index.ts
      email-verification/
        email-verification.api.ts
        email-verification.dto.ts
        email-verification.schema.ts
        email-verification.store.ts
        email-verification.types.ts
        index.ts
      index.ts
    posts/
      list/
        get-posts.api.ts
        posts-response.dto.ts
        posts-response.mapper.ts
        posts-response.schema.ts
        post-list.store.ts
        post-list.types.ts
        index.ts
      details/
        get-post.api.ts
        post-response.dto.ts
        post-response.mapper.ts
        post-response.schema.ts
        post.store.ts
        post.types.ts
        index.ts
      editor/
        create-post.api.ts
        update-post.api.ts
        upload-post-image.api.ts
        create-post.dto.ts
        update-post.dto.ts
        upload-post-image.dto.ts
        create-post.mapper.ts
        update-post.mapper.ts
        create-post.schema.ts
        update-post.schema.ts
        upload-post-image.schema.ts
        post-editor.store.ts
        post-editor.types.ts
        index.ts
      index.ts
    comments/
      comments.api.ts
      comments.dto.ts
      comments.mapper.ts
      comments.schema.ts
      comments.store.ts
      comments.types.ts
      index.ts
    profile/
      profile.api.ts
      profile.dto.ts
      profile.mapper.ts
      profile.schema.ts
      profile.store.ts
      profile.types.ts
      index.ts
    blog-dashboard/
      blog-dashboard.types.ts
      blog-dashboard.vm.ts
      index.ts

  shared/
    assets/
      icons/
      images/
    config/
      env.ts
    helpers/
      date/
        format-date.ts
      string/
        capitalize.ts
    hooks/
      useClickOutside.ts
      useDebounce.ts
      useMediaQuery.ts
      useStoreInstance.ts
    lib/
      event-bus/
        event-bus.engine.ts
        event-bus.types.ts
        index.ts
      websocket/
        websocket.client.ts
        websocket.types.ts
        index.ts
    theme/
      globals.scss
      tokens.scss
    types/
      utility.types.ts
    ui/
      Button/
        Button.tsx
        Button.types.ts
        Button.module.scss
        index.ts
      Input/
        Input.tsx
        Input.types.ts
        Input.module.scss
        index.ts
      Select/
        Select.tsx
        Select.types.ts
        Select.module.scss
        index.ts
      Spinner/
        Spinner.tsx
        Spinner.module.scss
        index.ts
      LazyBoundary/
        LazyBoundary.tsx
        LazyBoundary.types.ts
        index.ts
```
