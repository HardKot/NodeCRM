// --- DSL для схем ---
class SchemaFieldBuilder {
  constructor(name) {
    this.name = name;
    this.typeName = null;
    this.isRequired = false;
    this.isOptional = false;
  }
  type(typeName) { this.typeName = typeName; return this; }
  required() { this.isRequired = true; return this; }
  optional() { this.isOptional = true; return this; }
}

class SchemaBuilder {
  constructor(name) {
    this.name = name;
    this.fields = [];
  }
  field(name) {
    const f = new SchemaFieldBuilder(name);
    this.fields.push(f);
    return f;
  }
}

class SchemaRegistry {
  constructor() { this.schemas = new Map(); }
  add(builder) { this.schemas.set(builder.name, builder); }
  get(name) { return this.schemas.get(name); }
  getAll() { return Array.from(this.schemas.values()); }
}
// Новый DSL и архитектура SpaceJS (ядро)
// Реализация согласно промпту из Describe.md
// Весь код — чистый JS, без сторонних библиотек

// 1. BeanDefinitionBuilder
class BeanDefinitionBuilder {
  constructor(name, Class) {
    this.name = name;
    this.Class = Class;
    this.scope = 'singleton';
    this.deps = [];
    this.aliases = [];
  }
  singleton() { this.scope = 'singleton'; return this; }
  prototype() { this.scope = 'prototype'; return this; }
  request() { this.scope = 'request'; return this; }
  scoped() { this.scope = 'scoped'; return this; }
  dependsOn(...deps) { this.deps.push(...deps); return this; }
  alias(...aliases) { this.aliases.push(...aliases); return this; }
}

// 2. BeanRegistry
class BeanRegistry {
  constructor() {
    this.defs = new Map();
    this.aliasMap = new Map();
  }
  add(def) {
    this.defs.set(def.name, def);
    for (const a of def.aliases) this.aliasMap.set(a, def.name);
  }
  getDef(nameOrAlias) {
    const name = this.aliasMap.get(nameOrAlias) || nameOrAlias;
    let def = this.defs.get(name);
    if (!def) {
      for (const entry of this.defs.values()) {
        if (entry.aliases.includes(nameOrAlias)) {
          this.aliasMap.set(nameOrAlias, entry.name);
          def = entry;
          break;
        }
      }
    }
    return def;
  }
  getAllDefs() { return Array.from(this.defs.values()); }
}

// 3. ScopeManager
class ScopeManager {
  constructor() {
    this.singletons = new Map();
    this.scoped = new Map(); // key: scopeId, value: Map(name, instance)
  }
  get(scope, name, scopeId) {
    if (scope === 'singleton') return this.singletons.get(name);
    if (scope === 'scoped' && scopeId) {
      const map = this.scoped.get(scopeId);
      return map ? map.get(name) : undefined;
    }
    return undefined;
  }
  set(scope, name, instance, scopeId) {
    if (scope === 'singleton') this.singletons.set(name, instance);
    if (scope === 'scoped' && scopeId) {
      if (!this.scoped.has(scopeId)) this.scoped.set(scopeId, new Map());
      this.scoped.get(scopeId).set(name, instance);
    }
  }
  clearScope(scopeId) {
    this.scoped.delete(scopeId);
  }
}

// 4. Route & Router
const { parserAccess } = require('../security/access.js');
class Route {
  constructor(path) {
    this.path = path;
    this.children = [];
    this.handlers = {};
    this.accessChecker = () => true;
  }
  route(subPath) {
    const parts = subPath.split('/').filter(Boolean);
    let node = this;
    for (const part of parts) {
      const pathPart = '/' + part;
      let child = node.children.find(c => c.path === pathPart);
      if (!child) {
        child = new Route(pathPart);
        node.children.push(child);
      }
      node = child;
    }
    return node;
  }
  get(fn) { this.handlers['GET'] = fn; return this; }
  post(fn) { this.handlers['POST'] = fn; return this; }
  put(fn) { this.handlers['PUT'] = fn; return this; }
  delete(fn) { this.handlers['DELETE'] = fn; return this; }
  use(fn) { this.handlers['USE'] = fn; return this; }
  access(rule) { this.accessChecker = parserAccess(rule); return this; }
  authorize(rule) { return this.access(rule); }
  permitAll() { return this.access('public'); }
  denyAll() { return this.access('private'); }
  authenticated() { return this.access('authenticated'); }
  anonymous() { return this.access('anonymous'); }
  hasRole(...roles) { return this.access(`role: ${roles.join(', ')}`); }
  hasAnyRole(...roles) { return this.hasRole(...roles); }
  hasPermission(...permissions) { return this.access(`permissions: ${permissions.join(', ')}`); }
}
class Router {
  constructor() { this.root = new Route(''); }
  route(path) { return this.root.route(path); }
  find(path, method) {
    // Простой поиск по дереву (без динамики)
    let node = this.root;
    for (const part of path.split('/').filter(Boolean)) {
      node = node.children.find(c => c.path === '/' + part);
      if (!node) return null;
    }
    const handler = node.handlers[method] || node.handlers['USE'] || null;
    return handler ? { handler, accessChecker: node.accessChecker } : null;
  }
}

// 5. ApplicationContext
class ApplicationContext {
  constructor() {
    this.registry = new BeanRegistry();
    this.scopeManager = new ScopeManager();
    this.router = new Router();
    this.schemaRegistry = new SchemaRegistry();
  }
  beans(fn) {
    fn((name, Class) => {
      const builder = new BeanDefinitionBuilder(name, Class);
      this.registry.add(builder);
      return builder;
    });
  }

  schemas(fn) {
    fn((name, def) => {
      const builder = new SchemaBuilder(name);
      def(builder);
      this.schemaRegistry.add(builder);
      return builder;
    });
  }
  routing(fn) { fn(this.router.route.bind(this.router)); }
  async getBean(name, { scopeId } = {}) {
    const def = this.registry.getDef(name);
    if (!def) throw new Error('Bean not found: ' + name);
    // Определяем область видимости
    let scope = def.scope;
    if (scope === 'request') scope = 'scoped';
    const id = scope === 'singleton' ? undefined : (scopeId || 'default');
    let instance = this.scopeManager.get(scope, def.name, id);
    if (!instance) {
      // Разрешаем зависимости
      const deps = await Promise.all(def.deps.map(dep => this.getBean(dep, { scopeId: id })));
      instance = new def.Class(...deps);
      if (typeof instance.postConstructor === 'function') instance.postConstructor();
      this.scopeManager.set(scope, def.name, instance, id);
    }
    return instance;
  }
  async refresh() {
    // Для совместимости, можно добавить инициализацию
  }
}

function createApp() { return new ApplicationContext(); }


exports.createApp = createApp;
exports.ApplicationContext = ApplicationContext;
exports.BeanRegistry = BeanRegistry;
exports.BeanDefinitionBuilder = BeanDefinitionBuilder;
exports.ScopeManager = ScopeManager;
exports.Route = Route;
exports.Router = Router;
exports.SchemaRegistry = SchemaRegistry;
exports.SchemaBuilder = SchemaBuilder;
exports.SchemaFieldBuilder = SchemaFieldBuilder;