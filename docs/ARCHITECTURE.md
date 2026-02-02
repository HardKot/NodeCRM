# Архитектура Space.js Platform

## Обзор

Space.js Platform построен на модульной архитектуре с четким разделением ответственности между слоями приложения.

## Уровни архитектуры

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  - Управление жизненным циклом приложения                   │
│  - Кластеризация                                            │
│  - Конфигурация                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Instance Layer                            │
│  - DI Container                                             │
│  - Command Routing                                          │
│  - Module Management                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Module Layer                              │
│  - Component Organization                                   │
│  - Lifecycle Hooks                                          │
│  - Metadata Management                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│  - Providers (Services)                                     │
│  - Consumers (Controllers)                                  │
│  - Dependency Declaration                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Layer                              │
│  - HTTP Server                                              │
│  - Security                                                 │
│  - Database                                                 │
│  - Custom Plugins                                           │
└─────────────────────────────────────────────────────────────┘
```

## Ключевые компоненты

### 1. Application

**Назначение**: Управление приложением на верхнем уровне

**Функциональность**:
- Инициализация приложения
- Управление кластерами worker-процессов
- Конфигурация глобальных параметров
- Интеграция с плагинами

**Жизненный цикл**:
1. `build()` - создание конфигурации
2. `master()` - запуск master-процесса (если кластер)
3. `worker()` - запуск worker-процесса
4. Создание Instance

### 2. Instance

**Назначение**: Экземпляр приложения в worker-процессе

**Функциональность**:
- Управление DI-контейнером
- Создание и регистрация команд
- Выполнение команд по запросам
- Интеграция с плагинами

**События**:
- `BUILD` - контейнер построен
- `UPDATE` - модули обновлены

### 3. Container (DI)

**Назначение**: Управление зависимостями компонентов

**Функциональность**:
- Регистрация компонентов
- Разрешение зависимостей
- Управление областями видимости
- Lifecycle management (postConstructor, dispose)

**Области видимости**:
```typescript
enum Scoped {
  SINGLETON,  // Один экземпляр на всё приложение
  SCOPED,     // Один экземпляр на запрос (scope)
  TRANSIENT   // Новый экземпляр при каждом запросе
}
```

**Процесс разрешения зависимостей**:
```
Component Request
    ↓
Check Scope
    ↓
┌─────────────┬──────────────┬──────────────┐
│  Singleton  │    Scoped    │  Transient   │
│     ↓       │      ↓       │      ↓       │
│  Get from   │  Get from    │   Create     │
│  global     │  scope       │   new        │
│  cache      │  cache       │  instance    │
└─────────────┴──────────────┴──────────────┘
    ↓
Resolve Dependencies (recursive)
    ↓
Create Instance
    ↓
Call postConstructor
    ↓
Return Instance
```

### 4. Module

**Назначение**: Организация компонентов

**Структура**:
```typescript
interface Module {
  name: string | symbol;
  consumers: Component[];      // API endpoints
  providers: Component[];      // Services
  metadataRegistry: MetadataRegistry;
  hooks: ModuleHooks;
}
```

**Lifecycle Hooks**:
- `onModuleInit()` - вызывается при инициализации модуля
- `onModuleDestroy()` - вызывается при уничтожении модуля
- `onApplicationBootstrap()` - вызывается после запуска приложения
- `onApplicationShutdown()` - вызывается перед остановкой приложения

### 5. Component

**Назначение**: Базовая единица для DI

**Структура**:
```typescript
class Component<T, D> {
  name: ComponentInjectType;           // Имя для инъекции
  factory: (deps: D) => T;             // Фабрика создания
  inject: ComponentInjectType[];       // Зависимости
  type: ComponentType;                 // PROVIDER | CONSUMER
  scope: Scoped;                       // Область видимости
  eager: boolean;                      // Eager loading
  binding: ComponentInjectType[];      // Дополнительные привязки
  metadata: Metadata;                  // Метаданные
}
```

**Типы компонентов**:
- **PROVIDER**: Сервисы, утилиты, репозитории
- **CONSUMER**: HTTP-обработчики, команды

### 6. Command

**Назначение**: Обработчик API-запросов

**Функциональность**:
- Валидация входных данных (body, params)
- Контроль доступа
- Выполнение бизнес-логики
- Валидация выходных данных

**Процесс выполнения**:
```
HTTP Request
    ↓
Route to Command
    ↓
Parse Body/Params
    ↓
Validate Schema
    ↓
Check Access
    ↓
Execute Handler
    ↓
Validate Result
    ↓
Return Result<T, Error>
```

### 7. Virtual Space

**Назначение**: Изолированная среда выполнения модулей

**Функциональность**:
- Динамическая загрузка модулей
- Hot reload при изменении файлов
- Изолированный require с поддержкой внутренних зависимостей
- Управление жизненным циклом модулей

**Процесс работы**:
```
Start
    ↓
Scan Directory
    ↓
Load Module Files
    ↓
Parse & Execute Code
    ↓
Cache Modules
    ↓
Watch File Changes
    ↓
┌─────────────────┐
│  File Changed   │
└─────────────────┘
    ↓
Clear Cache
    ↓
Reload Modules
    ↓
Emit 'update' Event
    ↓
Instance Rebuild
```

### 8. Schema System

**Назначение**: Валидация и трансформация данных

**Иерархия полей**:
```
BaseField (abstract)
    ↓
┌───────────┬───────────┬───────────┬───────────┐
│  Scalar   │   Array   │  Schema   │   Enum    │
│  Field    │   Field   │  Field    │  Field    │
└───────────┴───────────┴───────────┴───────────┘
```

**Типы скалярных полей**:
- `string`
- `number`
- `boolean`
- `date`
- `any`

**Процесс валидации**:
```
Input Value
    ↓
Transform
    ↓
Validate Type
    ↓
Validate Required
    ↓
Validate Constraints
    ↓
Result<T, ValidateError>
```

## Паттерны проектирования

### 1. Dependency Injection

**Реализация**: Constructor Injection

```javascript
class UserService {
  constructor({ database, logger }) {
    this.db = database;
    this.logger = logger;
  }
}
UserService.$inject = ['database', 'logger'];
```

### 2. Builder Pattern

**Применение**: Конфигурация Application

```javascript
Application.build()
  .clusterCount(4)
  .module(virtualSpace)
  .plugins([httpServer])
  .run();
```

### 3. Factory Pattern

**Применение**: Создание компонентов и плагинов

```javascript
VirtualSpace.factory({ path: './src' });
HttpServer.factory({ port: 3000 });
```

### 4. Observer Pattern

**Применение**: События изменения модулей

```javascript
virtualSpace.onChange((space) => {
  // React to changes
});
```

### 5. Command Pattern

**Применение**: Обработка HTTP-запросов

```javascript
const result = await command.run(body, session, params);
```

### 6. Monad Pattern

**Применение**: Result и Optional

```javascript
const result = Result.success(value);
result.map(v => v * 2)
      .fold(success, failure);
```

## Потоки данных

### HTTP Request Flow

```
Client Request
    ↓
HTTP/2 Server
    ↓
Request Parser
    ↓
Route Resolution
    ↓
Command Lookup
    ↓
Session Creation
    ↓
Access Control
    ↓
Body Validation
    ↓
Container Scope
    ↓
Command Execution
    ↓
Result Validation
    ↓
Response Serialization
    ↓
Client Response
```

### Module Loading Flow

```
Application Start
    ↓
Virtual Space Init
    ↓
Scan Source Directory
    ↓
Load *.module.js Files
    ↓
Parse Module Classes
    ↓
Extract Providers
    ↓
Extract Consumers
    ↓
Parse Metadata
    ↓
Build Components
    ↓
Register in Container
    ↓
Create Commands
    ↓
Register Routes
    ↓
Ready to Serve
```

### Dependency Resolution Flow

```
Component Request
    ↓
Lookup in Bindings
    ↓
Check Scope Type
    ↓
Get/Create Instance
    ↓
Resolve Dependencies (recursive)
    ↓
Call Factory
    ↓
Run postConstructor
    ↓
Cache if needed
    ↓
Return Instance
```

## Расширяемость

### Custom Components

```javascript
class MyComponent {
  constructor({ dependency1, dependency2 }) {
    // Initialize
  }
  
  async postConstructor() {
    // Post-initialization logic
  }
  
  async dispose() {
    // Cleanup
  }
}

MyComponent.$inject = ['dependency1', 'dependency2'];
MyComponent.$scope = 'singleton';
MyComponent.$type = 'provider';
```

### Custom Plugins

```javascript
class MyPlugin {
  name = 'MyPlugin';
  components = [MyService, MyController];
  
  async init(instance) {
    // Initialize plugin
    instance.on('BUILD', () => {
      console.log('Instance built');
    });
  }
  
  async build(instance) {
    // Access to built container
    const service = await instance.container.get('myService');
  }
}
```

### Custom Schemas

```typescript
class CustomField extends BaseField {
  validate(value: any) {
    // Custom validation logic
    if (!this.isValid(value)) {
      return Result.failure(new ValidateError('Invalid'));
    }
    return Result.success(null);
  }
  
  transform(value: any) {
    // Custom transformation
    return this.normalize(value);
  }
}
```

## Производительность

### Оптимизации

1. **Singleton компоненты** - создаются один раз
2. **Lazy loading** - компоненты создаются по требованию
3. **Кеширование модулей** - Virtual Space кеширует загруженные модули
4. **HTTP/2** - мультиплексирование запросов
5. **Кластеризация** - использование всех CPU-ядер

### Рекомендации

1. Используйте Singleton для тяжелых сервисов
2. Используйте Scoped для request-specific данных
3. Избегайте Transient для часто используемых компонентов
4. Минимизируйте глубину дерева зависимостей
5. Используйте асинхронную инициализацию в postConstructor

## Безопасность

### Механизмы

1. **TLS/SSL** - обязательное шифрование
2. **Access Control** - проверка прав доступа
3. **Input Validation** - валидация всех входных данных
4. **Session Management** - изолированные сессии
5. **Error Handling** - безопасная обработка ошибок

### Best Practices

1. Всегда используйте HTTPS (HTTP/2 с TLS)
2. Определяйте $access для всех endpoints
3. Валидируйте входные данные через $body
4. Не передавайте sensitive данные в логи
5. Используйте JWT для stateless аутентификации

## Тестирование

### Уровни тестирования

1. **Unit Tests** - тестирование отдельных компонентов
2. **Integration Tests** - тестирование взаимодействия компонентов
3. **E2E Tests** - тестирование полного цикла запроса

### Подход к тестированию

```javascript
// Unit test
describe('UserService', () => {
  it('should create user', async () => {
    const mockDb = { query: jest.fn() };
    const service = new UserService({ database: mockDb });
    
    await service.create({ name: 'John' });
    
    expect(mockDb.query).toHaveBeenCalled();
  });
});

// Integration test
describe('UserModule', () => {
  it('should integrate components', async () => {
    const container = await Container.create([
      UserService,
      UserController
    ]);
    
    const controller = await container.get('userController');
    expect(controller).toBeDefined();
  });
});
```

## Мониторинг и отладка

### Логирование

```javascript
class MyService {
  constructor({ logger }) {
    this.logger = logger;
  }
  
  doWork() {
    this.logger.info('Starting work');
    try {
      // Work
      this.logger.info('Work completed');
    } catch (e) {
      this.logger.error('Work failed', e);
    }
  }
}
```

### Отладка

1. **Console logs** - через logger
2. **Debugger** - VS Code / Chrome DevTools
3. **Error tracking** - через плагины
4. **Performance profiling** - Node.js profiler

## Заключение

Space.js Platform предоставляет современную, масштабируемую архитектуру для создания enterprise SaaS-приложений. Модульность, DI, hot reload и встроенные инструменты обеспечивают высокую производительность разработки и приложения.
