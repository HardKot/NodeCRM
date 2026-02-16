# Примеры использования Space.js Platform

## Содержание

- [Базовый пример](#базовый-пример)
- [CRUD приложение](#crud-приложение)
- [Аутентификация и авторизация](#аутентификация-и-авторизация)
- [Работа с базой данных](#работа-с-базой-данных)
- [Файловые операции](#файловые-операции)
- [WebSocket интеграция](#websocket-интеграция)
- [Микросервисная архитектура](#микросервисная-архитектура)

---

## Базовый пример

### Hello World

**main.ts**
```javascript
const path = require('node:path');
const fs = require('node:fs');
const { Application } = require('./libs/core');
const { HttpServer } = require('./libs/httpServer');
const { Space } = require('./libs/space');

Application.build()
  .clusterCount(1)
  .module(
    Space.factory({
      path: path.join(process.cwd(), 'src')
    })
  )
  .plugins([
    HttpServer.factory({
      port: 3000,
      tls: {
        key: fs.readFileSync('./certs/server.key'),
        cert: fs.readFileSync('./certs/server.crt')
      }
    })
  ])
  .run();
```

**src/app.module.ts**
```javascript
const { hello } = require('./controllers/hello');

class AppModule {
  constructor() {
    this.providers = [];
    this.consumers = [hello];
  }
}

module.exports = { AppModule };
```

**src/controllers/hello.js**
```javascript
function hello({ body, params, session }) {
  return {
    message: 'Hello, World!',
    timestamp: new Date().toISOString()
  };
}

hello.$mapping = '/hello';
hello.$access = 'public';
hello.$returns = {
  message: 'string',
  timestamp: 'string'
};

module.exports = { hello };
```

**Использование**:
```bash
curl -k https://localhost:3000/hello
# {"message":"Hello, World!","timestamp":"2026-02-01T12:00:00.000Z"}
```

---

## CRUD приложение

### Управление задачами (TODO)

**src/services/taskService.js**
```javascript
class TaskService {
  constructor() {
    this.tasks = new Map();
    this.nextId = 1;
  }

  create(data) {
    const task = {
      id: this.nextId++,
      ...data,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(task.id, task);
    return task;
  }

  findAll(filters = {}) {
    let tasks = Array.from(this.tasks.values());
    
    if (filters.completed !== undefined) {
      tasks = tasks.filter(t => t.completed === filters.completed);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
      );
    }
    
    return tasks;
  }

  findById(id) {
    return this.tasks.get(id) || null;
  }

  update(id, data) {
    const task = this.tasks.get(id);
    if (!task) return null;
    
    const updated = {
      ...task,
      ...data,
      updatedAt: new Date()
    };
    this.tasks.set(id, updated);
    return updated;
  }

  delete(id) {
    return this.tasks.delete(id);
  }

  markAsCompleted(id) {
    return this.update(id, { completed: true });
  }
}

TaskService.$scope = 'singleton';

module.exports = { TaskService };
```

**src/controllers/taskController.js**
```javascript
// Получить все задачи
function getTasks({ params }, taskService) {
  const filters = {
    completed: params.completed === 'true' ? true : 
               params.completed === 'false' ? false : 
               undefined,
    search: params.search
  };
  return taskService.findAll(filters);
}

getTasks.$inject = ['taskService'];
getTasks.$mapping = '/tasks';
getTasks.$method = 'get';
getTasks.$access = 'public';
getTasks.$params = {
  completed: 'string?',
  search: 'string?'
};

// Получить задачу по ID
function getTask({ params }, taskService) {
  const task = taskService.findById(Number(params.id));
  if (!task) throw new Error('Task not found');
  return task;
}

getTask.$inject = ['taskService'];
getTask.$mapping = '/tasks/<number>';
getTask.$method = 'get';
getTask.$access = 'public';

// Создать задачу
function createTask({ body }, taskService) {
  return taskService.create(body);
}

createTask.$inject = ['taskService'];
createTask.$mapping = '/tasks';
createTask.$method = 'post';
createTask.$access = 'authenticated';
createTask.$body = {
  title: 'string',
  description: 'string?',
  dueDate: 'string?'
};
createTask.$returns = {
  id: 'number',
  title: 'string',
  description: 'string?',
  completed: 'boolean',
  createdAt: 'string',
  updatedAt: 'string'
};

// Обновить задачу
function updateTask({ params, body }, taskService) {
  const task = taskService.update(Number(params.id), body);
  if (!task) throw new Error('Task not found');
  return task;
}

updateTask.$inject = ['taskService'];
updateTask.$mapping = '/tasks/<number>';
updateTask.$method = 'put';
updateTask.$access = 'authenticated';
updateTask.$body = {
  title: 'string?',
  description: 'string?',
  dueDate: 'string?'
};

// Отметить как выполненную
function completeTask({ params }, taskService) {
  const task = taskService.markAsCompleted(Number(params.id));
  if (!task) throw new Error('Task not found');
  return task;
}

completeTask.$inject = ['taskService'];
completeTask.$mapping = '/tasks/<number>/complete';
completeTask.$method = 'post';
completeTask.$access = 'authenticated';

// Удалить задачу
function deleteTask({ params }, taskService) {
  const deleted = taskService.delete(Number(params.id));
  if (!deleted) throw new Error('Task not found');
  return { success: true };
}

deleteTask.$inject = ['taskService'];
deleteTask.$mapping = '/tasks/<number>';
deleteTask.$method = 'delete';
deleteTask.$access = 'authenticated';

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  deleteTask
};
```

**src/task.module.js**
```javascript
const { TaskService } = require('./services/taskService');
const taskController = require('./controllers/taskController');

class TaskModule {
  constructor() {
    this.providers = [TaskService];
    this.consumers = [
      taskController.getTasks,
      taskController.getTask,
      taskController.createTask,
      taskController.updateTask,
      taskController.completeTask,
      taskController.deleteTask
    ];
  }
}

module.exports = { TaskModule };
```

**Использование**:
```bash
# Создать задачу
curl -k -X POST https://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","description":"Urgent"}'

# Получить все задачи
curl -k https://localhost:3000/tasks

# Получить конкретную задачу
curl -k https://localhost:3000/tasks/1

# Обновить задачу
curl -k -X PUT https://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk and bread"}'

# Отметить как выполненную
curl -k -X POST https://localhost:3000/tasks/1/complete

# Удалить задачу
curl -k -X DELETE https://localhost:3000/tasks/1

# Фильтрация
curl -k "https://localhost:3000/tasks?completed=false"
curl -k "https://localhost:3000/tasks?search=milk"
```

---

## Аутентификация и авторизация

### JWT-based аутентификация

**src/services/authService.js**
```javascript
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor({ userService }) {
    this.userService = userService;
    this.secret = process.env.JWT_SECRET || 'your-secret-key';
  }

  async register(data) {
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = this.hashPassword(data.password);
    const user = await this.userService.create({
      ...data,
      passwordHash
    });

    const token = this.generateToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

  async login(email, password) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

  async verify(token) {
    try {
      const payload = jwt.verify(token, this.secret);
      const user = await this.userService.findById(payload.userId);
      return user ? this.sanitizeUser(user) : null;
    } catch (e) {
      return null;
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles: user.roles || []
      },
      this.secret,
      { expiresIn: '24h' }
    );
  }

  hashPassword(password) {
    return crypto
      .createHash('sha256')
      .update(password + this.secret)
      .digest('hex');
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}

AuthService.$inject = ['userService'];
AuthService.$scope = 'singleton';

module.exports = { AuthService };
```

**src/services/userService.js**
```javascript
class UserService {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
    this.emailIndex = new Map();
  }

  create(data) {
    const user = {
      id: this.nextId++,
      ...data,
      roles: data.roles || ['user'],
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    return user;
  }

  findById(id) {
    return this.users.get(id) || null;
  }

  findByEmail(email) {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) : null;
  }

  updateRoles(id, roles) {
    const user = this.users.get(id);
    if (!user) return null;
    user.roles = roles;
    return user;
  }
}

UserService.$scope = 'singleton';

module.exports = { UserService };
```

**src/controllers/authController.js**
```javascript
// Регистрация
function register({ body }, authService) {
  return authService.register(body);
}

register.$inject = ['authService'];
register.$mapping = '/auth/register';
register.$method = 'post';
register.$access = 'public';
register.$body = {
  name: 'string',
  email: 'string',
  password: 'string'
};

// Вход
function login({ body }, authService) {
  return authService.login(body.email, body.password);
}

login.$inject = ['authService'];
login.$mapping = '/auth/login';
login.$method = 'post';
login.$access = 'public';
login.$body = {
  email: 'string',
  password: 'string'
};

// Проверка токена
function verifyToken({ body }, authService) {
  const user = authService.verify(body.token);
  if (!user) throw new Error('Invalid token');
  return user;
}

verifyToken.$inject = ['authService'];
verifyToken.$mapping = '/auth/verify';
verifyToken.$method = 'post';
verifyToken.$access = 'public';
verifyToken.$body = {
  token: 'string'
};

// Защищенный эндпоинт
function getProfile({ session }, userService) {
  const userId = session.get('userId');
  const user = userService.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
}

getProfile.$inject = ['userService'];
getProfile.$mapping = '/profile';
getProfile.$method = 'get';
getProfile.$access = 'authenticated';

// Только для администраторов
function adminOnly({ session }) {
  return {
    message: 'Admin area',
    user: session.get('userId')
  };
}

adminOnly.$mapping = '/admin';
adminOnly.$access = async (session) => {
  return session.roles.includes('admin');
};

module.exports = {
  register,
  login,
  verifyToken,
  getProfile,
  adminOnly
};
```

**Использование**:
```bash
# Регистрация
curl -k -X POST https://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"secret"}'

# Вход
curl -k -X POST https://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret"}'
# Response: {"token":"eyJhbGc...","user":{...}}

# Использование токена
TOKEN="eyJhbGc..."
curl -k https://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Работа с базой данных

### PostgreSQL интеграция

**src/services/databaseService.js**
```javascript
const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'myapp',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query executed', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Query error', { text, error: error.message });
      throw error;
    }
  }

  async getClient() {
    const client = await this.pool.connect();
    return client;
  }

  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async dispose() {
    await this.pool.end();
  }
}

DatabaseService.$scope = 'singleton';

module.exports = { DatabaseService };
```

**src/repositories/userRepository.js**
```javascript
class UserRepository {
  constructor({ database }) {
    this.db = database;
  }

  async create(data) {
    const result = await this.db.query(
      `INSERT INTO users (name, email, password_hash, roles, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [data.name, data.email, data.passwordHash, data.roles || ['user']]
    );
    return result.rows[0];
  }

  async findById(id) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findAll(limit = 100, offset = 0) {
    const result = await this.db.query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const result = await this.db.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await this.db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }
}

UserRepository.$inject = ['database'];
UserRepository.$scope = 'singleton';

module.exports = { UserRepository };
```

**Миграции (SQL)**:
```sql
-- migrations/001_create_users.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  roles TEXT[] DEFAULT ARRAY['user'],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

---

## Файловые операции

### Загрузка и управление файлами

**src/services/fileService.js**
```javascript
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

class FileService {
  constructor({ logger }) {
    this.logger = logger;
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.maxFileSize = 10 * 1024 * 1024; // 10 MB
  }

  async postConstructor() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    this.logger.info('FileService initialized', { uploadDir: this.uploadDir });
  }

  async save(filename, buffer) {
    if (buffer.length > this.maxFileSize) {
      throw new Error('File too large');
    }

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(filename);
    const savedName = `${hash}${ext}`;
    const filepath = path.join(this.uploadDir, savedName);

    await fs.writeFile(filepath, buffer);
    
    return {
      originalName: filename,
      savedName,
      size: buffer.length,
      hash
    };
  }

  async read(savedName) {
    const filepath = path.join(this.uploadDir, savedName);
    const buffer = await fs.readFile(filepath);
    return buffer;
  }

  async delete(savedName) {
    const filepath = path.join(this.uploadDir, savedName);
    await fs.unlink(filepath);
    return true;
  }

  async list() {
    const files = await fs.readdir(this.uploadDir);
    const details = await Promise.all(
      files.map(async (file) => {
        const filepath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filepath);
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
    );
    return details;
  }
}

FileService.$inject = ['logger'];
FileService.$scope = 'singleton';

module.exports = { FileService };
```

**src/controllers/fileController.js**
```javascript
const { Readable } = require('node:stream');

// Загрузить файл
function uploadFile({ body }, fileService) {
  // body должен содержать Buffer
  return fileService.save(body.filename, body.content);
}

uploadFile.$inject = ['fileService'];
uploadFile.$mapping = '/files/upload';
uploadFile.$method = 'post';
uploadFile.$access = 'authenticated';
uploadFile.$body = Readable;  // Stream upload

// Скачать файл
function downloadFile({ params }, fileService) {
  return fileService.read(params.filename);
}

downloadFile.$inject = ['fileService'];
downloadFile.$mapping = '/files/<string>';
downloadFile.$method = 'get';
downloadFile.$access = 'public';
downloadFile.$returns = Readable;  // Stream download

// Список файлов
function listFiles({ }, fileService) {
  return fileService.list();
}

listFiles.$inject = ['fileService'];
listFiles.$mapping = '/files';
listFiles.$method = 'get';
listFiles.$access = 'authenticated';

// Удалить файл
function deleteFile({ params }, fileService) {
  fileService.delete(params.filename);
  return { success: true };
}

deleteFile.$inject = ['fileService'];
deleteFile.$mapping = '/files/<string>';
deleteFile.$method = 'delete';
deleteFile.$access = 'authenticated';

module.exports = {
  uploadFile,
  downloadFile,
  listFiles,
  deleteFile
};
```

---

## Микросервисная архитектура

### Несколько модулей

**src/modules/users/user.module.js**
```javascript
const { UserService } = require('./user.service');
const { UserController } = require('./user.controller');

class UserModule {
  constructor() {
    this.providers = [UserService];
    this.consumers = [UserController];
  }
  
  async onModuleInit() {
    console.log('UserModule initialized');
  }
}

module.exports = { UserModule };
```

**src/modules/products/product.module.js**
```javascript
const { ProductService } = require('./product.service');
const { ProductController } = require('./product.controller');

class ProductModule {
  constructor() {
    this.providers = [ProductService];
    this.consumers = [ProductController];
  }
}

module.exports = { ProductModule };
```

**src/modules/orders/order.module.js**
```javascript
const { OrderService } = require('./order.service');
const { OrderController } = require('./order.controller');

class OrderModule {
  constructor({ userService, productService }) {
    // Зависимости от других модулей
    this.userService = userService;
    this.productService = productService;
    
    this.providers = [OrderService];
    this.consumers = [OrderController];
  }
}

OrderModule.$inject = ['userService', 'productService'];

module.exports = { OrderModule };
```

**src/app.module.ts**
```javascript
const { UserModule } = require('./modules/users/user.module');
const { ProductModule } = require('./modules/products/product.module');
const { OrderModule } = require('./modules/orders/order.module');

class AppModule {
  constructor() {
    const userModule = new UserModule();
    const productModule = new ProductModule();
    const orderModule = new OrderModule({
      userService: userModule.providers[0],
      productService: productModule.providers[0]
    });
    
    this.providers = [
      ...userModule.providers,
      ...productModule.providers,
      ...orderModule.providers
    ];
    
    this.consumers = [
      ...userModule.consumers,
      ...productModule.consumers,
      ...orderModule.consumers
    ];
  }
  
  async onApplicationBootstrap() {
    console.log('Application fully started');
  }
}

module.exports = { AppModule };
```

---

## Продвинутые примеры

### Кэширование

**src/services/cacheService.js**
```javascript
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
  }

  set(key, value, ttl = 60000) {
    this.cache.set(key, value);
    
    if (ttl > 0) {
      const timeout = setTimeout(() => {
        this.cache.delete(key);
        this.ttlMap.delete(key);
      }, ttl);
      this.ttlMap.set(key, timeout);
    }
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    const timeout = this.ttlMap.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.ttlMap.delete(key);
    }
    return this.cache.delete(key);
  }

  clear() {
    for (const timeout of this.ttlMap.values()) {
      clearTimeout(timeout);
    }
    this.cache.clear();
    this.ttlMap.clear();
  }

  async dispose() {
    this.clear();
  }
}

CacheService.$scope = 'singleton';

module.exports = { CacheService };
```

**Использование кэша**:
```javascript
class UserService {
  constructor({ database, cache }) {
    this.db = database;
    this.cache = cache;
  }

  async findById(id) {
    const cacheKey = `user:${id}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const user = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (user.rows[0]) {
      this.cache.set(cacheKey, user.rows[0], 60000); // 60 секунд
    }
    
    return user.rows[0];
  }
}

UserService.$inject = ['database', 'cache'];
```

---

Эти примеры демонстрируют основные паттерны работы с Space.js Platform. Вы можете комбинировать их для создания полноценных приложений.
