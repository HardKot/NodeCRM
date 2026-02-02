# Руководство разработчика Space.js Platform

## Содержание

- [Начало работы](#начало-работы)
- [Структура проекта](#структура-проекта)
- [Создание модулей](#создание-модулей)
- [Работа с DI](#работа-с-di)
- [Создание API эндпоинтов](#создание-api-эндпоинтов)
- [Валидация данных](#валидация-данных)
- [Безопасность](#безопасность)
- [Тестирование](#тестирование)
- [Отладка](#отладка)
- [Производительность](#производительность)
- [Best Practices](#best-practices)

---

## Начало работы

### Установка проекта

```bash
# Клонировать репозиторий
git clone <repository-url>
cd NodeCRM

# Установить зависимости
pnpm install

# Создать SSL сертификаты для разработки
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key \
  -out certs/server.crt -days 365 -nodes -subj "/CN=localhost"

# Запустить приложение
node main.js
```

### Первый запуск

После запуска вы увидите:
```
[Instance@/path/to/project] Building container with N components...
[Instance@/path/to/project] Building commands with M handlers...
[HttpServer] Loading extended 'HttpServer'
```

Приложение доступно по адресу: `https://localhost:3000`

---

## Структура проекта

### Рекомендуемая организация

```
src/
├── modules/                    # Функциональные модули
│   ├── users/
│   │   ├── user.module.js     # Определение модуля
│   │   ├── user.service.js    # Бизнес-логика
│   │   ├── user.controller.js # API endpoints
│   │   ├── user.repository.js # Работа с данными
│   │   └── user.schema.js     # Схемы валидации
│   ├── auth/
│   │   ├── auth.module.js
│   │   ├── auth.service.js
│   │   └── auth.controller.js
│   └── products/
│       └── ...
├── shared/                     # Общие компоненты
│   ├── services/
│   │   ├── database.service.js
│   │   ├── cache.service.js
│   │   └── logger.service.js
│   ├── middleware/
│   ├── utils/
│   └── types/
├── config/                     # Конфигурация
│   ├── database.config.js
│   └── app.config.js
└── app.module.js              # Корневой модуль
```

### Файловая конвенция

- `*.module.js` - определение модуля
- `*.service.js` - бизнес-логика, провайдеры
- `*.controller.js` - API эндпоинты, консьюмеры
- `*.repository.js` - работа с БД
- `*.schema.js` - схемы валидации
- `*.test.js` - тесты

---

## Создание модулей

### Базовый модуль

```javascript
// src/modules/blog/blog.module.js
const { BlogService } = require('./blog.service');
const { BlogController } = require('./blog.controller');

class BlogModule {
  constructor() {
    this.providers = [BlogService];
    this.consumers = [BlogController];
  }
  
  // Lifecycle hooks (опционально)
  async onModuleInit() {
    console.log('BlogModule initialized');
  }
  
  async onModuleDestroy() {
    console.log('BlogModule destroyed');
  }
  
  async onApplicationBootstrap() {
    console.log('Application started');
  }
  
  async onApplicationShutdown() {
    console.log('Application shutting down');
  }
}

module.exports = { BlogModule };
```

### Модуль с зависимостями

```javascript
class OrderModule {
  constructor({ userService, productService }) {
    this.userService = userService;
    this.productService = productService;
    
    this.providers = [
      new OrderService({ userService, productService })
    ];
    this.consumers = [OrderController];
  }
}

OrderModule.$inject = ['userService', 'productService'];

module.exports = { OrderModule };
```

### Регистрация в главном модуле

```javascript
// src/app.module.js
const { UserModule } = require('./modules/users/user.module');
const { BlogModule } = require('./modules/blog/blog.module');

class AppModule {
  constructor() {
    const userModule = new UserModule();
    const blogModule = new BlogModule();
    
    this.providers = [
      ...userModule.providers,
      ...blogModule.providers
    ];
    
    this.consumers = [
      ...userModule.consumers,
      ...blogModule.consumers
    ];
  }
}

module.exports = { AppModule };
```

---

## Работа с DI

### Создание Provider (сервиса)

```javascript
// src/services/email.service.js
class EmailService {
  constructor({ logger, config }) {
    this.logger = logger;
    this.config = config;
  }
  
  // Вызывается после создания экземпляра
  async postConstructor() {
    this.logger.info('EmailService initialized');
    // Инициализация подключений, etc.
  }
  
  // Вызывается при уничтожении (для SCOPED)
  async dispose() {
    this.logger.info('EmailService disposed');
    // Очистка ресурсов
  }
  
  async sendEmail(to, subject, body) {
    this.logger.info('Sending email', { to, subject });
    // Логика отправки
  }
}

// Метаданные для DI
EmailService.$inject = ['logger', 'config'];  // Зависимости
EmailService.$scope = 'singleton';            // Область видимости
EmailService.$type = 'provider';              // Тип компонента
EmailService.$binding = ['emailService', 'email']; // Дополнительные имена

module.exports = { EmailService };
```

### Области видимости

**Singleton** - один экземпляр на всё приложение
```javascript
class ConfigService {}
ConfigService.$scope = 'singleton';
```

**Scoped** - один экземпляр на запрос (scope)
```javascript
class RequestContextService {}
RequestContextService.$scope = 'scoped';
```

**Transient** - новый экземпляр при каждом обращении
```javascript
class RandomService {}
RandomService.$scope = 'transient';
```

### Инъекция зависимостей

**В конструкторе**:
```javascript
class UserService {
  constructor({ database, logger, cache }) {
    this.db = database;
    this.logger = logger;
    this.cache = cache;
  }
}

UserService.$inject = ['database', 'logger', 'cache'];
```

**В функциях**:
```javascript
function createUser({ body }, userService, logger) {
  logger.info('Creating user', body);
  return userService.create(body);
}

createUser.$inject = ['userService', 'logger'];
```

### Eager Loading

По умолчанию компоненты создаются lazy (по требованию). Для eager loading:

```javascript
class DatabaseService {}
DatabaseService.$eager = true;  // Создастся сразу при старте
```

---

## Создание API эндпоинтов

### Базовый эндпоинт

```javascript
function hello({ body, params, session }) {
  return { message: 'Hello, World!' };
}

hello.$mapping = '/hello';
hello.$method = 'get';
hello.$access = 'public';

module.exports = { hello };
```

### Параметры функции-обработчика

```javascript
function handler({ body, params, session }) {
  // body - тело запроса (JSON)
  // params - параметры из URL
  // session - пользовательская сессия
  
  return result;
}
```

### Метаданные эндпоинта

```javascript
handler.$mapping = '/api/path';          // URL путь
handler.$method = 'get';                 // HTTP метод: get, post, put, delete
handler.$access = 'public';              // Контроль доступа
handler.$inject = ['service1'];          // Зависимости
handler.$body = { /* schema */ };       // Схема тела запроса
handler.$returns = { /* schema */ };    // Схема ответа
handler.$params = { /* schema */ };     // Схема параметров URL
```

### Динамические параметры URL

```javascript
// /users/<number> → /users/123
function getUser({ params }) {
  const userId = Number(params.id);
  return { id: userId };
}

getUser.$mapping = '/users/<number>';

// /posts/<string> → /posts/my-post-slug
function getPost({ params }) {
  const slug = params.slug;
  return { slug };
}

getPost.$mapping = '/posts/<string>';
```

### Контроллеры-классы

```javascript
class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }
  
  // Каждый метод становится эндпоинтом
  async getAll({ params }) {
    return this.userService.findAll();
  }
  
  async getById({ params }) {
    return this.userService.findById(Number(params.id));
  }
  
  async create({ body }) {
    return this.userService.create(body);
  }
}

// Метаданные для методов
UserController.prototype.getAll.$mapping = '/users';
UserController.prototype.getAll.$method = 'get';

UserController.prototype.getById.$mapping = '/users/<number>';
UserController.prototype.getById.$method = 'get';

UserController.prototype.create.$mapping = '/users';
UserController.prototype.create.$method = 'post';
UserController.prototype.create.$body = {
  name: 'string',
  email: 'string'
};

UserController.$inject = ['userService'];
UserController.$type = 'consumer';

module.exports = { UserController };
```

---

## Валидация данных

### Простые схемы

```javascript
// Скалярные типы
handler.$body = {
  name: 'string',
  age: 'number',
  active: 'boolean',
  createdAt: 'date',
  data: 'any'
};

// Опциональные поля
handler.$body = {
  name: 'string',
  description: 'string?'  // необязательное
};
```

### Вложенные объекты

```javascript
handler.$body = {
  user: {
    name: 'string',
    email: 'string',
    address: {
      city: 'string',
      street: 'string',
      zip: 'string?'
    }
  }
};
```

### Массивы

```javascript
// Массив строк
handler.$body = {
  tags: ['string']
};

// Массив объектов
handler.$body = {
  items: [{
    name: 'string',
    quantity: 'number'
  }]
};

// Массив массивов
handler.$body = {
  matrix: [['number']]
};
```

### Сложные схемы с использованием классов

```javascript
const { ScalarField, SchemaField, ArrayField, EnumField } = require('../libs/core/schema/fields');

// Enum
const statusField = new EnumField(['active', 'inactive', 'pending'], true);

// Сложная схема
const userSchema = new SchemaField({
  name: new ScalarField('string', true),
  email: new ScalarField('string', true),
  age: new ScalarField('number', false),
  status: statusField,
  tags: new ArrayField(new ScalarField('string', true), false),
  address: new SchemaField({
    city: new ScalarField('string', true),
    street: new ScalarField('string', true)
  }, false)
}, true);

handler.$body = userSchema;
```

### Кастомная валидация

```javascript
const { BaseField, Result, ValidateError } = require('../libs/core/schema/fields');

class EmailField extends BaseField {
  validate(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Result.failure(new ValidateError('Invalid email format'));
    }
    return Result.success(null);
  }
  
  transform(value) {
    return value?.toLowerCase().trim();
  }
}

handler.$body = {
  email: new EmailField(true)
};
```

---

## Безопасность

### Уровни доступа

**Public** - доступно всем:
```javascript
handler.$access = 'public';
```

**Authenticated** - только для аутентифицированных:
```javascript
handler.$access = 'authenticated';
```

**Private** - запрещено (по умолчанию):
```javascript
handler.$access = 'private';
// или просто не указывать
```

### Кастомная проверка доступа

```javascript
// На основе ролей
handler.$access = async (session) => {
  return session.roles.includes('admin');
};

// На основе прав
handler.$access = async (session) => {
  return session.permissions.includes('user:delete');
};

// Сложная логика
handler.$access = async (session) => {
  const userId = session.get('userId');
  if (!userId) return false;
  
  const user = await userService.findById(userId);
  return user && user.isActive && user.roles.includes('premium');
};
```

### Middleware для аутентификации

```javascript
// src/middleware/auth.middleware.js
class AuthMiddleware {
  constructor({ authService }) {
    this.authService = authService;
  }
  
  async authenticate(request) {
    const token = this.extractToken(request);
    if (!token) return null;
    
    const user = await this.authService.verify(token);
    return user;
  }
  
  extractToken(request) {
    const auth = request.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.substring(7);
  }
}

AuthMiddleware.$inject = ['authService'];
AuthMiddleware.$scope = 'singleton';

module.exports = { AuthMiddleware };
```

### Защита от инъекций

При работе с БД всегда используйте параметризованные запросы:

```javascript
// ✅ Правильно
await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ Неправильно
await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

---

## Тестирование

### Unit тесты

```javascript
// src/services/__tests__/user.service.test.js
const { describe, it, expect, beforeEach } = require('@jest/globals');
const { UserService } = require('../user.service');

describe('UserService', () => {
  let userService;
  let mockDatabase;
  let mockLogger;
  
  beforeEach(() => {
    mockDatabase = {
      query: jest.fn()
    };
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    
    userService = new UserService({
      database: mockDatabase,
      logger: mockLogger
    });
  });
  
  it('should create user', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    mockDatabase.query.mockResolvedValue({
      rows: [{ id: 1, ...userData }]
    });
    
    const user = await userService.create(userData);
    
    expect(user.id).toBe(1);
    expect(user.name).toBe('John');
    expect(mockDatabase.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      expect.arrayContaining(['John', 'john@example.com'])
    );
  });
  
  it('should find user by id', async () => {
    mockDatabase.query.mockResolvedValue({
      rows: [{ id: 1, name: 'John' }]
    });
    
    const user = await userService.findById(1);
    
    expect(user).toEqual({ id: 1, name: 'John' });
    expect(mockDatabase.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1',
      [1]
    );
  });
});
```

### Integration тесты

```javascript
// src/__tests__/user.integration.test.js
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const { Container } = require('../../libs/core');
const { UserService } = require('../services/user.service');
const { DatabaseService } = require('../shared/database.service');

describe('User Integration', () => {
  let container;
  let userService;
  
  beforeAll(async () => {
    container = await Container.create([
      DatabaseService,
      UserService
    ]);
    
    userService = await container.get('userService');
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  it('should create and retrieve user', async () => {
    const userData = { name: 'John', email: 'john@test.com' };
    const created = await userService.create(userData);
    
    expect(created.id).toBeDefined();
    
    const retrieved = await userService.findById(created.id);
    expect(retrieved.name).toBe('John');
  });
});
```

### E2E тесты

```javascript
// src/__tests__/api.e2e.test.js
const { describe, it, expect } = require('@jest/globals');
const https = require('node:https');

describe('API E2E', () => {
  const agent = new https.Agent({
    rejectUnauthorized: false // для self-signed сертификата
  });
  
  async function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        agent,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          body: JSON.parse(data)
        }));
      });
      
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
  
  it('should create user via API', async () => {
    const response = await makeRequest('POST', '/users', {
      name: 'John',
      email: 'john@example.com'
    });
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('John');
  });
});
```

### Запуск тестов

```bash
# Все тесты
pnpm test

# Конкретный файл
pnpm test user.service.test.js

# Watch mode
pnpm test --watch

# С покрытием
pnpm test --coverage
```

---

## Отладка

### Логирование

```javascript
class MyService {
  constructor({ logger }) {
    this.logger = logger;
  }
  
  async doWork() {
    this.logger.info('Starting work');
    
    try {
      // Work
      this.logger.info('Work completed successfully');
    } catch (error) {
      this.logger.error('Work failed', error);
      throw error;
    }
  }
}

MyService.$inject = ['logger'];
```

### VS Code Debugger

**.vscode/launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Application",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/main.js",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Run Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--detectOpenHandles"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Chrome DevTools

```bash
node --inspect main.js
```

Откройте `chrome://inspect` в Chrome

### Профилирование

```bash
# CPU профиль
node --prof main.js
node --prof-process isolate-*.log > profile.txt

# Heap snapshot
node --inspect main.js
# В Chrome DevTools: Memory → Take heap snapshot
```

---

## Производительность

### Рекомендации по областям видимости

```javascript
// ✅ Singleton для тяжелых сервисов
class DatabaseService {}
DatabaseService.$scope = 'singleton';

// ✅ Scoped для request-specific данных
class RequestContextService {}
RequestContextService.$scope = 'scoped';

// ⚠️ Transient только когда действительно нужно
class RandomService {}
RandomService.$scope = 'transient';
```

### Кэширование

```javascript
class UserService {
  constructor({ database, cache }) {
    this.db = database;
    this.cache = cache;
  }
  
  async findById(id) {
    const key = `user:${id}`;
    
    // Проверить кэш
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Загрузить из БД
    const user = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    // Сохранить в кэш
    if (user.rows[0]) {
      this.cache.set(key, user.rows[0], 60000); // 60 секунд
    }
    
    return user.rows[0];
  }
}
```

### Пулы соединений

```javascript
const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      max: 20,                      // Максимум соединений
      idleTimeoutMillis: 30000,    // Таймаут простоя
      connectionTimeoutMillis: 2000 // Таймаут подключения
    });
  }
}
```

### Кластеризация

```javascript
// main.js
Application.build()
  .clusterCount(require('os').cpus().length)  // По количеству CPU
  .module(virtualSpace)
  .run();
```

---

## Best Practices

### 1. Организация кода

- ✅ Один модуль = одна функциональность
- ✅ Сервисы содержат только бизнес-логику
- ✅ Контроллеры только маршрутизируют запросы
- ✅ Репозитории отвечают за работу с данными

### 2. Dependency Injection

- ✅ Всегда используйте DI вместо прямого импорта
- ✅ Объявляйте зависимости через `$inject`
- ✅ Используйте правильную область видимости
- ❌ Избегайте циклических зависимостей

### 3. Валидация

- ✅ Всегда определяйте `$body` для POST/PUT
- ✅ Определяйте `$returns` для документирования
- ✅ Используйте строгие типы
- ❌ Не доверяйте входным данным

### 4. Безопасность

- ✅ Явно указывайте `$access` для всех эндпоинтов
- ✅ Используйте HTTPS (TLS)
- ✅ Валидируйте все входные данные
- ✅ Логируйте все важные действия
- ❌ Не передавайте sensitive данные в логи

### 5. Ошибки

- ✅ Используйте Result для обработки ошибок
- ✅ Логируйте ошибки с контекстом
- ✅ Возвращайте понятные сообщения пользователю
- ❌ Не выбрасывайте неконтролируемые исключения

### 6. Тестирование

- ✅ Пишите unit тесты для бизнес-логики
- ✅ Пишите integration тесты для модулей
- ✅ Используйте моки для внешних зависимостей
- ✅ Стремитесь к покрытию > 80%

### 7. Производительность

- ✅ Используйте кэширование для частых запросов
- ✅ Используйте пулы для БД соединений
- ✅ Используйте кластеризацию в production
- ✅ Профилируйте критичные участки кода

### 8. Документирование

- ✅ Документируйте публичные API
- ✅ Используйте JSDoc для сложных функций
- ✅ Поддерживайте README актуальным
- ✅ Документируйте архитектурные решения

---

## Дополнительные ресурсы

- [README.md](../README.md) - Общее описание проекта
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Детали архитектуры
- [API.md](./API.md) - Справочник API
- [EXAMPLES.md](./EXAMPLES.md) - Примеры использования

---

**Успехов в разработке!** 🚀
