# API Reference - Space.js Platform

## Core API

### Application

Главный класс для создания и управления приложением.

#### Методы

##### `Application.build(): ApplicationBuilder`

Создает builder для конфигурации приложения.

**Возвращает**: `ApplicationBuilder`

**Пример**:
```javascript
const app = Application.build()
  .clusterCount(4)
  .module(virtualSpace)
  .run();
```

---

##### `ApplicationBuilder.clusterCount(count: number): ApplicationBuilder`

Устанавливает количество worker-процессов для кластеризации.

**Параметры**:
- `count` (number) - количество worker-процессов (0 = без кластеризации)

**Возвращает**: `ApplicationBuilder`

**Пример**:
```javascript
Application.build()
  .clusterCount(4)  // 4 worker-процесса
```

---

##### `ApplicationBuilder.module(module: Module | Promise<Module>): ApplicationBuilder`

Устанавливает корневой модуль приложения.

**Параметры**:
- `module` - модуль или Promise модуля

**Возвращает**: `ApplicationBuilder`

**Пример**:
```javascript
Application.build()
  .module(VirtualSpace.factory({ path: './src' }))
```

---

##### `ApplicationBuilder.plugins(plugins: Plugin[]): ApplicationBuilder`

Регистрирует плагины приложения.

**Параметры**:
- `plugins` - массив плагинов

**Возвращает**: `ApplicationBuilder`

**Пример**:
```javascript
Application.build()
  .plugins([
    HttpServer.factory({ port: 3000 }),
    SecurityPlugin.factory()
  ])
```

---

##### `ApplicationBuilder.run(): Promise<Application>`

Запускает приложение.

**Возвращает**: `Promise<Application>`

**Пример**:
```javascript
await Application.build()
  .clusterCount(1)
  .module(module)
  .run();
```

---

### Container

DI-контейнер для управления компонентами и их зависимостями.

#### Методы

##### `Container.create(components: Component[]): Promise<Container>`

Создает и инициализирует контейнер.

**Параметры**:
- `components` - массив компонентов для регистрации

**Возвращает**: `Promise<Container>`

**Пример**:
```javascript
const container = await Container.create([
  UserService,
  UserController,
  DatabaseService
]);
```

---

##### `container.get(binding: string | symbol): Promise<any | null>`

Получает экземпляр компонента по имени.

**Параметры**:
- `binding` - имя компонента для инъекции

**Возвращает**: `Promise<any | null>` - экземпляр компонента или null

**Пример**:
```javascript
const userService = await container.get('userService');
const logger = await container.get(Symbol.for('logger'));
```

---

##### `container.type(type: ComponentType): Promise<Array<{name, instance, meta}>>`

Получает все компоненты указанного типа.

**Параметры**:
- `type` - тип компонента ('provider' | 'consumer')

**Возвращает**: `Promise<Array>` - массив компонентов с метаданными

**Пример**:
```javascript
const consumers = await container.type('consumer');
const providers = await container.type('provider');
```

---

##### `container.runScope(callback: () => Promise<void>): Promise<void>`

Выполняет callback в изолированной области видимости для SCOPED компонентов.

**Параметры**:
- `callback` - асинхронная функция для выполнения

**Возвращает**: `Promise<void>`

**Пример**:
```javascript
await container.runScope(async () => {
  const service1 = await container.get('scopedService');
  const service2 = await container.get('scopedService');
  // service1 === service2 в пределах этого scope
});
```

---

### Module

Представляет модуль приложения с компонентами и хуками жизненного цикла.

#### Свойства

- `name: string | symbol` - имя модуля
- `consumers: Component[]` - API-эндпоинты
- `providers: Component[]` - сервисы и утилиты
- `metadataRegistry: MetadataRegistry` - реестр метаданных
- `hooks: ModuleHooks` - хуки жизненного цикла

#### Методы

##### `module.onModuleInit(): Promise<void>`

Вызывается при инициализации модуля.

---

##### `module.onModuleDestroy(): Promise<void>`

Вызывается при уничтожении модуля.

---

##### `module.onApplicationBootstrap(): Promise<void>`

Вызывается после запуска приложения.

---

##### `module.onApplicationShutdown(): Promise<void>`

Вызывается перед остановкой приложения.

---

##### `Module.merge(target: Module, source: Module): Module`

Объединяет два модуля в один.

**Параметры**:
- `target` - целевой модуль
- `source` - исходный модуль

**Возвращает**: `Module` - новый объединенный модуль

---

### Component

Базовый компонент для DI-контейнера.

#### Конструктор

```typescript
new Component<T, D>(
  name: string | symbol,
  factory: (deps: D) => T,
  metadata: Metadata
)
```

**Параметры**:
- `name` - имя компонента для инъекции
- `factory` - фабрика создания экземпляра
- `metadata` - метаданные компонента

#### Свойства

- `name: string | symbol` - имя компонента
- `factory: Function` - фабрика создания
- `inject: Array<string | symbol>` - зависимости
- `type: ComponentType` - тип ('provider' | 'consumer')
- `scope: Scoped` - область видимости
- `eager: boolean` - eager loading
- `binding: Array` - дополнительные привязки
- `metadata: Metadata` - метаданные

#### Методы

##### `component.runPostConstruct(instance: T): Promise<void>`

Выполняет post-constructor метод экземпляра.

**Параметры**:
- `instance` - экземпляр компонента

---

### Command

Обработчик API-запросов с валидацией и контролем доступа.

#### Конструктор

```typescript
new Command<T extends Function>(
  runner: T,
  metadata: Metadata,
  schemas: SchemaRegistry
)
```

#### Свойства

- `access: AccessFunction` - функция проверки доступа
- `params: BaseField | null` - схема параметров URL
- `body: BaseField | null` - схема тела запроса
- `returns: BaseField | null` - схема ответа

#### Методы

##### `command.run(body: any, session: Session, params: any): Promise<Result<T, Error>>`

Выполняет команду с валидацией и контролем доступа.

**Параметры**:
- `body` - тело запроса
- `session` - пользовательская сессия (по умолчанию: new Session())
- `params` - параметры URL (по умолчанию: null)

**Возвращает**: `Promise<Result<T, Error>>`

**Пример**:
```javascript
const result = await command.run(
  { name: 'John', email: 'john@example.com' },
  session,
  { id: 123 }
);

if (result.isSuccess) {
  console.log('Result:', result.getOrNull());
} else {
  console.error('Error:', result.errorOrNull());
}
```

---

### VirtualSpace

Управляет загрузкой и hot reload модулей.

#### Методы

##### `VirtualSpace.factory(config): Promise<VirtualSpace>`

Создает и инициализирует Virtual Space.

**Параметры**:
- `config.path: string` - путь к директории с модулями
- `config.watchTimeout?: number` - задержка hot reload (по умолчанию: 500ms)
- `config.rootModuleName?: string` - имя корневого модуля (по умолчанию: 'app.module')
- `config.context?: object` - контекст выполнения кода
- `config.rootExtractor?: Function` - функция извлечения корневого модуля

**Возвращает**: `Promise<VirtualSpace>`

**Пример**:
```javascript
const space = await VirtualSpace.factory({
  path: path.join(process.cwd(), 'src'),
  watchTimeout: 500,
  rootModuleName: 'app.module',
  context: { env: process.env.NODE_ENV }
});
```

---

##### `space.current: any`

Получает текущий корневой модуль.

**Пример**:
```javascript
const appModule = space.current;
```

---

##### `space.get(name: string): any`

Получает модуль по имени.

**Параметры**:
- `name` - имя модуля (с расширением .module или без)

**Возвращает**: `any` - экспорты модуля

**Пример**:
```javascript
const userModule = space.get('user.module');
const authModule = space.get('auth');  // расширение добавится автоматически
```

---

##### `space.getAll(): any[]`

Получает все загруженные модули.

**Возвращает**: `any[]` - массив модулей

---

##### `space.onChange(listener: (space) => void): EventEmitter`

Подписывается на изменения модулей.

**Параметры**:
- `listener` - функция-обработчик изменений

**Возвращает**: `EventEmitter`

**Пример**:
```javascript
space.onChange((space) => {
  console.log('Modules reloaded');
});
```

---

### Session

Управление пользовательской сессией.

#### Конструктор

```typescript
new Session()
```

Создает новую сессию с уникальным ID.

#### Свойства

- `id: string` - уникальный идентификатор сессии (UUID)
- `roles: string[]` - роли пользователя
- `permissions: string[]` - права доступа

#### Методы

Наследует все методы от `Map`:

##### `session.set(key: string, value: any): this`

Устанавливает значение в сессии.

**Пример**:
```javascript
session.set('userId', 123);
session.set('roles', ['admin', 'user']);
```

---

##### `session.get(key: string): any`

Получает значение из сессии.

**Пример**:
```javascript
const userId = session.get('userId');
```

---

##### `session.has(key: string): boolean`

Проверяет наличие ключа в сессии.

---

##### `session.delete(key: string): boolean`

Удаляет значение из сессии.

---

## Utility API

### Result

Монада для безопасной обработки результатов операций.

#### Статические методы

##### `Result.success<T, E>(value: T): Result<T, E>`

Создает успешный Result.

**Пример**:
```javascript
const result = Result.success({ id: 1, name: 'John' });
```

---

##### `Result.failure<T, E>(error: E): Result<T, E>`

Создает Result с ошибкой.

**Пример**:
```javascript
const result = Result.failure(new Error('Not found'));
```

---

##### `Result.of<T>(value: T): Result<T>`

Создает Result из значения (автоматическое определение success/failure).

**Пример**:
```javascript
const result = Result.of(possiblyNull);
```

---

#### Свойства

- `isSuccess: boolean` - true если операция успешна
- `isFailure: boolean` - true если операция завершилась ошибкой

#### Методы

##### `result.getOrNull(): T | null`

Получает значение или null при ошибке.

**Пример**:
```javascript
const value = result.getOrNull();
```

---

##### `result.getOrThrow(): T`

Получает значение или выбрасывает ошибку.

**Пример**:
```javascript
try {
  const value = result.getOrThrow();
} catch (e) {
  console.error(e);
}
```

---

##### `result.getOrElse(defaultValue: T | ((error: E) => T)): T`

Получает значение или возвращает значение по умолчанию.

**Пример**:
```javascript
const value = result.getOrElse({ id: 0, name: 'Unknown' });
const value = result.getOrElse(err => defaultUser);
```

---

##### `result.errorOrNull(): E | null`

Получает ошибку или null при успехе.

---

##### `result.map<U>(transform: (value: T) => U): Result<U, E>`

Трансформирует значение при успехе.

**Пример**:
```javascript
const doubled = result.map(x => x * 2);
```

---

##### `result.fold<U>(onSuccess: (T) => U, onFailure: (E) => U): U`

Обрабатывает оба случая (success и failure).

**Пример**:
```javascript
const message = result.fold(
  value => `Success: ${value}`,
  error => `Error: ${error.message}`
);
```

---

### Optional

Монада для безопасной работы с nullable значениями.

#### Статические методы

##### `Optional.of<T>(value: T | null | undefined): Optional<T>`

Создает Optional из значения.

---

##### `Optional.empty<T>(): Optional<T>`

Создает пустой Optional.

---

#### Методы

##### `optional.isEmpty(): boolean`

Проверяет, пуст ли Optional.

---

##### `optional.getOrNull(): T | null`

Получает значение или null.

---

##### `optional.getOrElse(defaultValue: T | (() => T)): T`

Получает значение или значение по умолчанию.

---

##### `optional.map<U>(transform: (value: T) => U): Optional<U>`

Трансформирует значение если оно присутствует.

---

##### `optional.orElse(value: T): T`

Получает значение или альтернативное значение.

---

### Types

Утилиты для проверки типов.

#### Методы

##### `Types.isNull(value: any): boolean`

Проверяет, является ли значение null.

---

##### `Types.isUndefined(value: any): boolean`

Проверяет, является ли значение undefined.

---

##### `Types.isFunction(value: any): boolean`

Проверяет, является ли значение функцией.

---

##### `Types.isObject(value: any): boolean`

Проверяет, является ли значение объектом.

---

##### `Types.isString(value: any): boolean`

Проверяет, является ли значение строкой.

---

##### `Types.isNumber(value: any): boolean`

Проверяет, является ли значение числом.

---

##### `Types.isBoolean(value: any): boolean`

Проверяет, является ли значение булевым значением.

---

##### `Types.isArray(value: any): boolean`

Проверяет, является ли значение массивом.

---

##### `Types.isClass(value: any): boolean`

Проверяет, является ли значение классом.

---

##### `Types.isAsyncIterator(value: any): boolean`

Проверяет, является ли значение async iterator.

---

##### `Types.isReadableStream(value: any): boolean`

Проверяет, является ли значение readable stream.

---

##### `Types.isWritableStream(value: any): boolean`

Проверяет, является ли значение writable stream.

---

### ObjectUtils

Утилиты для работы с объектами.

##### `ObjectUtils.getMethodNames(obj: object): string[]`

Получает имена всех методов объекта.

**Пример**:
```javascript
class UserService {
  create() {}
  update() {}
  delete() {}
}

const methods = ObjectUtils.getMethodNames(new UserService());
// ['create', 'update', 'delete']
```

---

### StringUtils

Утилиты для работы со строками.

##### `StringUtils.factoryCamelCase(...parts: string[]): string`

Преобразует части в camelCase.

**Пример**:
```javascript
StringUtils.factoryCamelCase('user', 'service');
// 'userService'
```

---

##### `StringUtils.factoryPascalCase(...parts: string[]): string`

Преобразует части в PascalCase.

**Пример**:
```javascript
StringUtils.factoryPascalCase('user', 'service');
// 'UserService'
```

---

## Schema API

### BaseField

Базовый класс для всех полей схемы.

#### Методы

##### `field.validate(value: any): Result<null, ValidateError>`

Валидирует значение.

---

##### `field.transform(value: any): any`

Трансформирует значение перед валидацией.

---

##### `field.parse<T>(value: any): Result<T, ValidateError>`

Парсит и валидирует значение.

**Пример**:
```javascript
const field = new ScalarField('string', true);
const result = field.parse('hello');

if (result.isSuccess) {
  console.log('Valid:', result.getOrNull());
}
```

---

### ScalarField

Поле для примитивных типов.

#### Конструктор

```typescript
new ScalarField(type: string, required: boolean)
```

**Типы**:
- `'string'`
- `'number'`
- `'boolean'`
- `'date'`
- `'any'`

**Пример**:
```javascript
const nameField = new ScalarField('string', true);
const ageField = new ScalarField('number', false);
```

---

### ArrayField

Поле для массивов.

#### Конструктор

```typescript
new ArrayField(itemField: BaseField, required: boolean)
```

**Пример**:
```javascript
const tagsField = new ArrayField(
  new ScalarField('string', true),
  false
);
```

---

### SchemaField

Поле для вложенных объектов.

#### Конструктор

```typescript
new SchemaField(schema: Record<string, BaseField>, required: boolean)
```

**Пример**:

```javascript
const addressField = new Schema({
    city: new ScalarField('string', true),
    street: new ScalarField('string', true),
    zip: new ScalarField('string', false)
}, true);
```

---

### EnumField

Поле для перечислений.

#### Конструктор

```typescript
new EnumField(values: any[], required: boolean)
```

**Пример**:
```javascript
const statusField = new EnumField(
  ['active', 'inactive', 'pending'],
  true
);
```

---

## Plugin API

### HttpServer

HTTP/2 сервер с TLS.

##### `HttpServer.factory(options): HttpServer`

Создает HTTP-сервер.

**Параметры**:
- `options.port?: number` - порт (по умолчанию: 3000)
- `options.host?: string` - хост (по умолчанию: '127.0.0.1')
- `options.tls: { key: Buffer, cert: Buffer }` - TLS сертификаты
- `options.timeout?: number` - таймаут запросов (по умолчанию: 60000)
- `options.maxSessions?: number` - максимум сессий (по умолчанию: 1024)

**Пример**:
```javascript
const httpServer = HttpServer.factory({
  port: 3000,
  host: 'localhost',
  tls: {
    key: fs.readFileSync('./certs/server.key'),
    cert: fs.readFileSync('./certs/server.crt')
  },
  timeout: 30000,
  maxSessions: 2048
});
```

---

### Logger

Система логирования.

#### Методы

##### `logger.info(message: string, ...args: any[]): void`

Логирует информационное сообщение.

---

##### `logger.error(message: string, error?: Error): void`

Логирует ошибку.

---

##### `logger.warn(message: string, ...args: any[]): void`

Логирует предупреждение.

---

##### `logger.debug(message: string, ...args: any[]): void`

Логирует отладочное сообщение.

---

## Метаданные компонентов

### Для Provider компонентов

```javascript
class MyService {}

MyService.$inject = ['dependency1', 'dependency2'];  // Зависимости
MyService.$scope = 'singleton';                      // singleton | scoped | transient
MyService.$type = 'provider';                        // provider | consumer
MyService.$binding = ['myService', 'service'];       // Дополнительные имена для инъекции
MyService.$eager = true;                             // Eager loading
```

### Для Consumer компонентов

```javascript
function myEndpoint({ body, params, session }) {}

myEndpoint.$inject = ['userService', 'logger'];     // Зависимости
myEndpoint.$mapping = '/api/endpoint';              // URL путь
myEndpoint.$method = 'post';                        // get | post | put | delete
myEndpoint.$access = 'authenticated';               // public | authenticated | private | Function
myEndpoint.$body = { name: 'string' };             // Схема тела запроса
myEndpoint.$returns = { id: 'number' };            // Схема ответа
myEndpoint.$params = { id: 'number' };             // Схема параметров URL
```

---

## События

### Instance Events

```javascript
instance.on('BUILD', () => {
  // Контейнер построен, команды созданы
});

instance.on('UPDATE', () => {
  // Модули обновлены, контейнер перестроен
});
```

### VirtualSpace Events

```javascript
space.on('preLoad', () => {
  // Перед загрузкой модулей
});

space.on('postLoad', () => {
  // После загрузки модулей
});

space.on('update', (space) => {
  // Модули перезагружены
});

space.on('error', (error) => {
  // Ошибка при загрузке
});
```

---

## Константы

### ComponentType

```javascript
const ComponentType = {
  PROVIDER: 'provider',
  CONSUMER: 'consumer'
};
```

### Scoped

```javascript
const Scoped = {
  SINGLETON: 'singleton',
  SCOPED: 'scoped',
  TRANSIENT: 'transient'
};
```

### InstanceEvent

```javascript
const InstanceEvent = {
  BUILD: 'build',
  UPDATE: 'update'
};
```

---

## Типы ошибок

### ApplicationError

Ошибка на уровне Application.

### InstanceError

Ошибка на уровне Instance.

### ContainerError

Ошибка DI-контейнера.

### CommandError

Ошибка выполнения команды.

### AccessError

Ошибка проверки доступа.

### HttpServerError

Ошибка HTTP-сервера.

**Свойства**:
- `message: string` - сообщение об ошибке
- `code: number` - HTTP-код ошибки

### VirtualSpaceError

Ошибка Virtual Space.

### SchemaError

Ошибка схемы.

### ValidateError

Ошибка валидации.

**Свойства**:
- `message: string` - сообщение об ошибке
- `errors: Record<string, string>` - детали ошибок по полям
