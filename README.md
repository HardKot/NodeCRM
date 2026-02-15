# Space.js Platform

> Современный фреймворк для создания многопользовательских SaaS-приложений на Node.js

## 📖 Оглавление

- [Обзор](#обзор)
- [Основные возможности](#основные-возможности)
- [Архитектура](#архитектура)
- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Основные концепции](#основные-концепции)
- [Примеры использования](#примеры-использования)
- [API Documentation](#api-documentation)
- [Тестирование](#тестирование)
- [Разработка](#разработка)

## Обзор

Space.js Platform - это enterprise-grade фреймворк для разработки многопользовательских SaaS-приложений. Фреймворк построен на принципах dependency injection, модульности и hot-reload, что обеспечивает высокую производительность и удобство разработки.

### Ключевые особенности

- **Модульная архитектура** - изолированные, переиспользуемые модули
- **Dependency Injection** - встроенный IoC-контейнер с поддержкой различных областей видимости
- **Hot Reload** - автоматическая перезагрузка модулей при изменении кода
- **HTTP/2 сервер** - встроенная поддержка HTTP/2 с TLS
- **Валидация схем** - декларативная валидация данных
- **Система сессий** - встроенная поддержка аутентификации и авторизации
- **TypeScript support** - полная поддержка TypeScript и JSDoc

## Основные возможности

### 🚀 Производительность

- Поддержка кластеризации для многоядерных систем
- HTTP/2 с TLS для быстрой и безопасной передачи данных
- Асинхронная архитектура на базе Node.js

### 🔧 Разработка

- Hot Reload - изменения применяются без перезапуска сервера
- Virtual Space - изолированная среда выполнения для модулей
- Декларативное определение API-эндпоинтов
- Встроенная система логирования

### 🛡️ Безопасность

- Встроенная система контроля доступа
- Поддержка JWT-токенов
- Управление сессиями пользователей
- Валидация входных данных

### 📦 Модульность

- Компонентная архитектура
- Dependency Injection контейнер
- Плагинная система расширения
- Изолированные области видимости (Singleton, Scoped, Transient)

## Архитектура

### Основные компоненты

```
┌─────────────────────────────────────────────────────────┐
│                     Application                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Instance   │→ │  Container   │→ │   Components   │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Virtual Space                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Modules   │→ │     Code     │→ │   Hot Reload   │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     Plugins Layer                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ HTTP Server │  │   Security   │  │   Database     │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Жизненный цикл приложения

1. **Инициализация** - создание экземпляра Application
2. **Загрузка модулей** - Virtual Space сканирует и загружает модули
3. **Построение контейнера** - регистрация компонентов и их зависимостей
4. **Инициализация плагинов** - запуск HTTP-сервера и других плагинов
5. **Построение команд** - создание API-эндпоинтов из consumers
6. **Готовность** - приложение готово к обработке запросов

## Быстрый старт

### Установка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd NodeCRM

# Установите зависимости
pnpm install

# Сгенерируйте SSL-сертификаты (для разработки)
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes
```

### Создание первого модуля

1. Создайте файл `src/app.module.js`:

```javascript
const { helloWorld } = require('./controllers/helloWorld.js');

class AppModule {
  constructor() {
    this.providers = [];    // Сервисы и утилиты
    this.consumers = [helloWorld];  // API-эндпоинты
  }
}

module.exports = { AppModule };
```

2. Создайте контроллер `src/controllers/helloWorld.js`:

```javascript
function helloWorld({ body, params, session }) {
  return { message: 'Hello, World!' };
}

// Метаданные для автоматической регистрации
helloWorld.$body = {};
helloWorld.$returns = { message: 'string' };
helloWorld.$access = 'public';
helloWorld.$mapping = '/hello';

module.exports = { helloWorld };
```

3. Запустите приложение:

```bash
node main.js
```

4. Протестируйте API:

```bash
curl -k https://localhost:3000/hello
# Ответ: {"message":"Hello, World!"}
```

## Структура проекта

```
NodeCRM/
├── main.js                    # Точка входа приложения
├── package.json              # Зависимости и скрипты
├── tsconfig.json             # Конфигурация TypeScript
├── jest.config.js            # Конфигурация тестов
├── eslint.config.js          # Конфигурация линтера
│
├── certs/                    # SSL-сертификаты
│   ├── server.key
│   └── server.crt
│
├── libs/                     # Библиотеки фреймворка
│   ├── core/                 # Ядро фреймворка
│   │   ├── application/      # Управление приложением
│   │   │   ├── instance.ts   # Экземпляр приложения
│   │   │   ├── container.ts  # DI-контейнер
│   │   │   ├── command.ts    # Обработчики команд
│   │   │   ├── session.ts    # Управление сессиями
│   │   │   ├── access.ts     # Контроль доступа
│   │   │   └── plugins.ts    # Интерфейс плагинов
│   │   │
│   │   ├── component/        # Система компонентов
│   │   │   ├── component.ts  # Базовый компонент
│   │   │   ├── scoped.ts     # Области видимости
│   │   │   └── sourceComponentParser.ts
│   │   │
│   │   ├── module/           # Система модулей
│   │   │   ├── module.ts     # Определение модуля
│   │   │   ├── IAppModule.ts # Интерфейс модуля
│   │   │   └── sourceModuleParser.ts
│   │   │
│   │   ├── schema/           # Валидация данных
│   │   │   ├── schema.ts     # Основная схема
│   │   │   └── fields/       # Типы полей
│   │   │       ├── baseField.ts
│   │   │       ├── scalarField.ts
│   │   │       ├── arrayField.ts
│   │   │       ├── schemaField.ts
│   │   │       └── enumField.ts
│   │   │
│   │   └── metadata/         # Система метаданных
│   │       ├── metadata.ts
│   │       └── metadataRegistry.ts
│   │
│   ├── httpServer/           # HTTP/2 сервер
│   │   ├── httpServer.ts     # Основной сервер
│   │   ├── request.js        # Обработка запросов
│   │   ├── response.js       # Обработка ответов
│   │   ├── routes.ts         # Маршрутизация
│   │   └── httpError.js      # Обработка ошибок
│   │
│   ├── space/                # Virtual Space
│   │   ├── space.ts   # Управление модулями
│   │   └── code.ts           # Выполнение кода
│   │
│   ├── security/             # Безопасность
│   │   ├── jwtService.js     # JWT-токены
│   │   ├── securityService.js
│   │   ├── userService.js
│   │   └── serverAuthMiddleware.js
│   │
│   └── utils/                # Утилиты
│       ├── result.ts         # Монада Result
│       ├── optional.ts       # Монада Optional
│       ├── types.ts          # Проверка типов
│       ├── objectUtils.ts    # Работа с объектами
│       ├── stringUtils.ts    # Работа со строками
│       └── functionUtils.ts  # Работа с функциями
│
└── src/                      # Исходный код приложения
    ├── app.module.js         # Главный модуль
    └── controllers/          # Контроллеры
        └── helloWorld.js     # Пример контроллера
```

## Основные концепции

### 1. Модули (Modules)

Модули - это основные строительные блоки приложения. Каждый модуль может содержать providers (сервисы) и consumers (API-эндпоинты).

```javascript
class UserModule {
  constructor() {
    this.providers = [UserService, EmailService];
    this.consumers = [UserController];
  }
  
  async onModuleInit() {
    console.log('Модуль инициализирован');
  }
}
```

### 2. Компоненты (Components)

Компоненты - это классы или функции, управляемые DI-контейнером.

**Типы компонентов:**
- **Provider** - сервисы и утилиты
- **Consumer** - обработчики HTTP-запросов

**Области видимости:**
- **SINGLETON** - один экземпляр на всё приложение
- **SCOPED** - один экземпляр на запрос
- **TRANSIENT** - новый экземпляр при каждом обращении

```javascript
class UserService {
  constructor({ database, logger }) {
    this.db = database;
    this.logger = logger;
  }
  
  async findUser(id) {
    return await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

UserService.$inject = ['database', 'logger'];
UserService.$scope = 'singleton';
```

### 3. Consumers (API-эндпоинты)

Consumers - это функции, которые автоматически становятся HTTP-эндпоинтами.

```javascript
function createUser({ body, params, session }) {
  const { name, email } = body;
  // Создание пользователя
  return { id: 1, name, email };
}

// Метаданные
createUser.$mapping = '/users';          // URL эндпоинта
createUser.$method = 'post';             // HTTP-метод
createUser.$access = 'authenticated';    // Контроль доступа
createUser.$body = {                     // Схема тела запроса
  name: 'string',
  email: 'string'
};
createUser.$returns = {                  // Схема ответа
  id: 'number',
  name: 'string',
  email: 'string'
};
```

### 4. Валидация схем

Автоматическая валидация входных и выходных данных.

```javascript
// Простая схема
createUser.$body = {
  name: 'string',
  age: 'number'
};

// Сложная схема с вложенными объектами
createUser.$body = {
  name: 'string',
  email: 'string',
  address: {
    city: 'string',
    street: 'string'
  },
  tags: ['string']  // массив строк
};
```

### 5. Контроль доступа

Система контроля доступа на основе сессий.

```javascript
// Публичный доступ
endpoint.$access = 'public';

// Только для аутентифицированных пользователей
endpoint.$access = 'authenticated';

// Приватный (по умолчанию)
endpoint.$access = 'private';

// Кастомная функция проверки
endpoint.$access = async (session) => {
  return session.roles.includes('admin');
};
```

### 6. Virtual Space

Virtual Space - это изолированная среда для загрузки и выполнения модулей с поддержкой hot reload.

```javascript
Space.factory({
  path: path.join(process.cwd(), 'src'),  // Путь к модулям
  watchTimeout: 500,                       // Задержка перед перезагрузкой
  rootModule: 'app.module'            // Имя корневого модуля
})
```

При изменении файлов в указанной директории, Virtual Space автоматически:
1. Перезагружает изменённые модули
2. Перестраивает DI-контейнер
3. Обновляет маршруты HTTP-сервера

### 7. Плагины

Плагины расширяют функциональность приложения.

```javascript
class MyPlugin {
  name = 'MyPlugin';
  components = [MyService];  // Дополнительные компоненты
  
  async init(instance) {
    // Инициализация при запуске
    console.log('Plugin initialized');
  }
  
  async build(instance) {
    // Вызывается после построения контейнера
    console.log('Plugin built');
  }
}
```

## Примеры использования

### Пример 1: CRUD API для пользователей

**src/services/userService.js**
```javascript
class UserService {
  constructor({ database }) {
    this.db = database;
    this.users = new Map();
  }
  
  async create(data) {
    const id = Date.now();
    const user = { id, ...data, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async findAll() {
    return Array.from(this.users.values());
  }
  
  async findById(id) {
    return this.users.get(id) || null;
  }
  
  async update(id, data) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }
  
  async delete(id) {
    return this.users.delete(id);
  }
}

UserService.$inject = ['database'];
UserService.$scope = 'singleton';

module.exports = { UserService };
```

**src/controllers/userController.js**
```javascript
// Получить всех пользователей
function getUsers({ params, session }, userService) {
  return userService.findAll();
}
getUsers.$mapping = '/users';
getUsers.$method = 'get';
getUsers.$access = 'public';
getUsers.$inject = ['userService'];

// Получить пользователя по ID
function getUser({ params }, userService) {
  const user = userService.findById(Number(params.id));
  if (!user) throw new Error('User not found');
  return user;
}
getUser.$mapping = '/users/<number>';
getUser.$method = 'get';
getUser.$access = 'public';
getUser.$inject = ['userService'];

// Создать пользователя
function createUser({ body }, userService) {
  return userService.create(body);
}
createUser.$mapping = '/users';
createUser.$method = 'post';
createUser.$access = 'authenticated';
createUser.$inject = ['userService'];
createUser.$body = {
  name: 'string',
  email: 'string'
};

// Обновить пользователя
function updateUser({ params, body }, userService) {
  const user = userService.update(Number(params.id), body);
  if (!user) throw new Error('User not found');
  return user;
}
updateUser.$mapping = '/users/<number>';
updateUser.$method = 'put';
updateUser.$access = 'authenticated';
updateUser.$inject = ['userService'];
updateUser.$body = {
  name: 'string?',
  email: 'string?'
};

// Удалить пользователя
function deleteUser({ params }, userService) {
  const deleted = userService.delete(Number(params.id));
  if (!deleted) throw new Error('User not found');
  return { success: true };
}
deleteUser.$mapping = '/users/<number>';
deleteUser.$method = 'delete';
deleteUser.$access = 'authenticated';
deleteUser.$inject = ['userService'];

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
```

**src/user.module.js**
```javascript
const { UserService } = require('./services/userService');
const userController = require('./controllers/userController');

class UserModule {
  constructor() {
    this.providers = [UserService];
    this.consumers = [
      userController.getUsers,
      userController.getUser,
      userController.createUser,
      userController.updateUser,
      userController.deleteUser
    ];
  }
}

module.exports = { UserModule };
```

### Пример 2: Аутентификация с JWT

**src/services/authService.js**
```javascript
class AuthService {
  constructor({ jwtService, userService }) {
    this.jwt = jwtService;
    this.userService = userService;
  }
  
  async login(email, password) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new Error('User not found');
    
    // Проверка пароля (упрощенно)
    if (user.password !== password) {
      throw new Error('Invalid password');
    }
    
    const token = await this.jwt.sign({
      id: user.id,
      email: user.email,
      roles: user.roles
    });
    
    return { token, user };
  }
  
  async verify(token) {
    return await this.jwt.verify(token);
  }
}

AuthService.$inject = ['jwtService', 'userService'];
AuthService.$scope = 'singleton';

module.exports = { AuthService };
```

### Пример 3: Использование сессий

```javascript
function getProfile({ session }) {
  // Доступ к данным сессии
  const userId = session.get('userId');
  const roles = session.roles;
  const permissions = session.permissions;
  
  return {
    userId,
    roles,
    permissions
  };
}

getProfile.$mapping = '/profile';
getProfile.$access = 'authenticated';
```

## API Documentation

### Application

Главный класс для создания и конфигурирования приложения.

```javascript
Application.build()
  .clusterCount(4)                    // Количество worker-процессов
  .module(virtualSpace)               // Загрузчик модулей
  .stdout(process.stdout)             // Поток для логов
  .stderr(process.stderr)             // Поток для ошибок
  .plugins([httpServer, security])    // Плагины
  .run();                             // Запуск приложения
```

### Container

DI-контейнер для управления зависимостями.

```javascript
const container = await Container.create(components);

// Получить экземпляр компонента
const service = await container.get('userService');

// Получить все компоненты определенного типа
const consumers = await container.type('consumer');

// Выполнить в отдельной области видимости
await container.runScope(async () => {
  // Здесь SCOPED-компоненты будут одинаковыми
  const service1 = await container.get('scopedService');
  const service2 = await container.get('scopedService');
  // service1 === service2
});
```

### Space

Управление модулями с hot reload.

```javascript
const space = await Space.factory({
  path: './src',                   // Путь к модулям
  watchTimeout: 500,               // Задержка hot reload
  rootModule: 'app.module',   // Корневой модуль
  context: {env: 'development'}  // Контекст выполнения
});

// Получить текущий модуль
const module = space.current;

// Получить модуль по имени
const userModule = space.get('user.module');

// Подписаться на изменения
space.onChange((space) => {
  console.log('Modules reloaded');
});
```

### Command

Обработчик API-запросов.

```javascript
const command = new Command(handler, metadata, schemas);

// Выполнить команду
const result = await command.run(body, session, params);

if (result.isSuccess) {
  console.log('Result:', result.getOrNull());
} else {
  console.error('Error:', result.errorOrNull());
}
```

### Result

Монада для безопасной обработки результатов и ошибок.

```javascript
// Создание
const success = Result.success(value);
const failure = Result.failure(error);

// Проверка
if (result.isSuccess) { /* ... */ }
if (result.isFailure) { /* ... */ }

// Извлечение значения
const value = result.getOrNull();
const value = result.getOrThrow();
const value = result.getOrElse(defaultValue);

// Трансформация
const mapped = result.map(value => value * 2);

// Fold
const output = result.fold(
  value => `Success: ${value}`,
  error => `Error: ${error.message}`
);
```

### Session

Управление пользовательской сессией.

```javascript
const session = new Session();

// Установить значения
session.set('userId', 123);
session.set('roles', ['admin']);

// Получить значения
const userId = session.get('userId');
const roles = session.roles;
const permissions = session.permissions;
```

## Тестирование

Проект использует Jest для тестирования.

### Запуск тестов

```bash
# Все тесты
pnpm test

# Конкретный файл
pnpm test schema.test.js

# С покрытием
pnpm test --coverage
```

### Пример теста

```javascript
const { describe, it, expect } = require('@jest/globals');
const { UserService } = require('../services/userService');

describe('UserService', () => {
  it('should create user', async () => {
    const service = new UserService({ database: mockDb });
    const user = await service.create({
      name: 'John',
      email: 'john@example.com'
    });
    
    expect(user).toHaveProperty('id');
    expect(user.name).toBe('John');
    expect(user.email).toBe('john@example.com');
  });
});
```

## Разработка

### Требования

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Скрипты

```bash
# Линтинг
pnpm lint

# Тестирование
pnpm test

# Проверка перед коммитом
pnpm precommit
```

### Конфигурация для разработки

**main.js** (разработка)

```javascript
Application.build()
    .clusterCount(1)  // Один процесс для отладки
    .module(
        Space.factory({
            path: path.join(process.cwd(), 'src'),
            watchTimeout: 100  // Быстрый reload для разработки
        })
    )
    .plugins([
        HttpServer.factory({
            port: 3000,
            host: 'localhost',
            tls: {
                key: fs.readFileSync('./certs/server.key'),
                cert: fs.readFileSync('./certs/server.crt')
            }
        })
    ])
    .run();
```

### Отладка

1. **Логирование**
```javascript
class MyService {
  constructor({ logger }) {
    this.logger = logger;
  }
  
  doSomething() {
    this.logger.info('Doing something');
    this.logger.error('Error occurred');
  }
}
MyService.$inject = ['logger'];
```

2. **Использование VS Code debugger**

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/main.js"
    }
  ]
}
```

### Best Practices

1. **Модульность**: Разделяйте код на небольшие, переиспользуемые модули
2. **Dependency Injection**: Используйте DI для всех зависимостей
3. **Валидация**: Всегда определяйте схемы для $body и $returns
4. **Контроль доступа**: Явно указывайте $access для каждого эндпоинта
5. **Тестирование**: Пишите тесты для критичной бизнес-логики
6. **Именование**: Используйте понятные имена для модулей, сервисов и эндпоинтов

### Рекомендуемая структура проекта

```
src/
├── modules/
│   ├── users/
│   │   ├── user.module.js
│   │   ├── user.service.js
│   │   ├── user.controller.js
│   │   └── user.schema.js
│   ├── auth/
│   │   ├── auth.module.js
│   │   ├── auth.service.js
│   │   └── auth.controller.js
│   └── ...
├── shared/
│   ├── services/
│   ├── utils/
│   └── types/
└── app.module.js
```

## Лицензия

См. LICENSE файл для подробностей.

## Контакты

Для вопросов и предложений создавайте Issue в репозитории проекта.

---

**Space.js Platform** - построй будущее своего SaaS сегодня!
