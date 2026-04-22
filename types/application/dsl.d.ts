// Type definitions for SpaceJS DSL (ядро)
declare class BeanDefinitionBuilder {
  singleton(): this;
  prototype(): this;
  request(): this;
  scoped(): this;
  dependsOn(...deps: string[]): this;
  alias(...aliases: string[]): this;
}
declare class BeanRegistry {
  add(def: BeanDefinitionBuilder): void;
  getDef(nameOrAlias: string): BeanDefinitionBuilder | undefined;
  getAllDefs(): BeanDefinitionBuilder[];
}
declare class ScopeManager {
  get(scope: string, name: string, scopeId?: string): any;
  set(scope: string, name: string, instance: any, scopeId?: string): void;
  clearScope(scopeId: string): void;
}
declare class Route {
  constructor(path: string);
  route(subPath: string): Route;
  get(fn: Function): this;
  post(fn: Function): this;
  put(fn: Function): this;
  delete(fn: Function): this;
  use(fn: Function): this;
  access(rule: string): this;
  authorize(rule: string): this;
  permitAll(): this;
  denyAll(): this;
  authenticated(): this;
  anonymous(): this;
  hasRole(...roles: string[]): this;
  hasAnyRole(...roles: string[]): this;
  hasPermission(...permissions: string[]): this;
}
declare interface RouteFindResult {
  handler: Function;
  accessChecker: (session: any) => boolean;
}
declare class Router {
  root: Route;
  route(path: string): Route;
  find(path: string, method: string): RouteFindResult | null;
}
declare class ApplicationContext {
  beans(fn: (bean: (name: string, Class: any) => BeanDefinitionBuilder) => void): void;
  schemas(fn: (schema: (name: string, def: (builder: SchemaBuilder) => void) => SchemaBuilder) => void): void;
  routing(fn: (route: Router) => void): void;
  getBean(name: string, opts?: { scopeId?: string }): Promise<any>;
  refresh(): Promise<void>;
  registry: BeanRegistry;
  scopeManager: ScopeManager;
  router: Router;
  schemaRegistry: SchemaRegistry;
}
declare function createApp(): ApplicationContext;

export { createApp, ApplicationContext, BeanRegistry, BeanDefinitionBuilder, ScopeManager, Route, Router, SchemaRegistry, SchemaBuilder, SchemaFieldBuilder };
