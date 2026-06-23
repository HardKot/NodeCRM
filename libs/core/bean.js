import { CoreError } from './errors.js';
import { Scoped } from './enums.js';
import { Types } from '../utils/index.js';
import { BuildSymbol } from './symbols.js';

export { Bean, BeanBuilder };

class Bean {
  constructor({ name, factory, scope, deps, aliases, eager, postConstruct, preDestroy, async }) {
    this.name = name;
    this.factory = factory;
    this.scope = scope;
    this.deps = deps ?? [];
    this.aliases = aliases ?? [];
    this.eager = eager ?? false;
    this.async = async ?? false;
    this.postConstruct = postConstruct ?? [];
    this.preDestroy = preDestroy ?? [];

    if (!this.name) throw new CoreError('Bean must have a name');
    if (!this.factory) throw new CoreError('Bean must have a factory');

    if (Types.isString(this.scope))
      this.scope = Scoped[this.scope.toUpperCase()] ?? Scoped.SINGLETON;
    if (Types.isUndefined(this.scope)) this.scope = Scoped.SINGLETON;

    if (!this.aliases.includes(this.name)) this.aliases.push(this.name);
    if (!!this.postConstruct && !Array.isArray(this.postConstruct))
      this.postConstruct = [this.postConstruct];
    if (!!this.preDestroy && !Array.isArray(this.preDestroy)) this.preDestroy = [this.preDestroy];

    Object.freeze(this);
  }

  isSingleton() {
    return this.scope === Scoped.SINGLETON;
  }
  isTransient() {
    return this.scope === Scoped.TRANSIENT;
  }
  isScoped() {
    return this.scope === Scoped.SCOPED;
  }
}

class BeanBuilder {
  #name;
  #factory;
  #scope;
  #deps;
  #aliases;
  #eager;
  #postConstruct;
  #preDestroy;
  #async;

  constructor() {
    this.#name = '';
    this.#factory = () => {
      throw new CoreError('No factory provided for bean');
    };
    this.#scope = 'singleton';
    this.#deps = [];
    this.#aliases = [];
    this.#eager = false;
    this.#async = false;
    this.#postConstruct = [];
    this.#preDestroy = [];
  }

  name(value) {
    this.#name = value;
    return this;
  }
  eager() {
    this.#eager = true;
    return this;
  }
  async() {
    this.#async = true;
    return this;
  }

  singleton() {
    this.#scope = Scoped.SINGLETON;
    return this;
  }
  transient() {
    this.#scope = Scoped.TRANSIENT;
    return this;
  }
  scoped() {
    this.#scope = Scoped.SCOPED;
    return this;
  }

  dependsOn(...deps) {
    this.#deps.push(...deps);
    return this;
  }
  alias(...aliases) {
    this.#aliases.push(...aliases);
    return this;
  }

  class(Class) {
    this.#factory = deps => new Class(...deps);
    return this;
  }
  factory(factory) {
    this.#factory = factory;
    return this;
  }

  postConstruct(...methods) {
    this.#postConstruct.push(...methods);
    return this;
  }
  preDestroy(...methods) {
    this.#preDestroy.push(...methods);
    return this;
  }

  [BuildSymbol]() {
    return new Bean({
      name: this.#name,
      factory: this.#factory,
      scope: this.#scope,
      deps: this.#deps,
      aliases: this.#aliases,
      eager: this.#eager,
      postConstruct: this.#postConstruct,
      preDestroy: this.#preDestroy,
      async: this.#async,
    });
  }
}
